import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { checkoutCustomerEmail, createZiniInvoice, zinipayConfigured } from '@/lib/zinipay'
import { monthsForPeriod } from '@/lib/plans'
import {
  UNKNOWN_PACKAGE_BN,
  buyerFacingCheckoutMessage,
  catalogPackageFields,
  resolveCheckoutPackage,
} from '@/lib/checkout-package'
import { appBaseUrl, checkoutRedirectIsLocalhost } from '@/lib/app-url'
import { originAllowed } from '@/lib/csrf'

const schema = z.object({
  packageCode: z.string().min(1),
  period: z.enum(['MONTH', 'YEAR']).optional(),
})

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const user = await requireAuth(req)
  if (!user?.activeMembership) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const selection = resolveCheckoutPackage(body.packageCode, body.period)
  if (!selection || !(selection.amountBdt > 0)) {
    return NextResponse.json({ message: UNKNOWN_PACKAGE_BN }, { status: 404 })
  }

  const fields = catalogPackageFields(selection.def)
  const featuresJson = fields.featuresJson as Prisma.InputJsonValue
  const pkg = await prisma.subscriptionPackage.upsert({
    where: { code: selection.code },
    create: { ...fields, featuresJson },
    update: {
      nameBn: fields.nameBn,
      nameEn: fields.nameEn,
      priceBdt: fields.priceBdt,
      yearlyBdt: fields.yearlyBdt,
      featuresJson,
      smsMonthly: fields.smsMonthly,
      smsYearly: fields.smsYearly,
      teamSeats: fields.teamSeats,
      autoHearingSms: fields.autoHearingSms,
      careerFull: fields.careerFull,
      adsOff: fields.adsOff,
      sortOrder: fields.sortOrder,
      active: true,
    },
  })

  const period = selection.period
  const amount = selection.amountBdt
  const sub = await prisma.subscription.create({
    data: {
      workspaceId: user.activeMembership.workspaceId,
      packageId: pkg.id,
      status: 'PENDING',
      billingPeriod: period,
      amountBdt: amount,
      gateway: 'ZiniPay',
    },
  })

  const origin = appBaseUrl(req.url)
  if (!zinipayConfigured()) {
    return NextResponse.json({
      subscriptionId: sub.id,
      paymentRail: 'zinipay_web',
      checkoutUrl: null,
      months: monthsForPeriod(period),
      message: 'পেমেন্ট এখন উপলব্ধ নয়। সাপোর্ট বা অ্যাডমিন অ্যাক্টিভেট ব্যবহার করুন।',
      redirectOriginLocalhost: checkoutRedirectIsLocalhost(origin),
    })
  }

  const created = await createZiniInvoice({
    cusName: user.name,
    cusEmail: checkoutCustomerEmail(user),
    amountBdt: amount,
    metadata: {
      subscriptionId: sub.id,
      packageCode: selection.code,
      period,
      workspaceId: user.activeMembership.workspaceId,
    },
    redirectUrl: `${origin}/api/web/v1/checkout/zinipay/return?subscriptionId=${sub.id}`,
    cancelUrl: `${origin}/user/member?pay=cancel`,
    webhookUrl: `${origin}/api/web/v1/checkout/zinipay/webhook`,
  })

  if (!created.ok) {
    return NextResponse.json({
      subscriptionId: sub.id,
      paymentRail: 'zinipay_web',
      checkoutUrl: null,
      message: buyerFacingCheckoutMessage(created.message, created.reason === 'unconfigured'),
    }, { status: created.reason === 'unconfigured' ? 200 : 502 })
  }

  if (created.invoiceId) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { gatewayRef: created.invoiceId },
    })
  }

  return NextResponse.json({
    subscriptionId: sub.id,
    paymentRail: 'zinipay_web',
    checkoutUrl: created.paymentUrl,
    invoiceId: created.invoiceId,
    redirectOriginLocalhost: checkoutRedirectIsLocalhost(origin),
  })
}
