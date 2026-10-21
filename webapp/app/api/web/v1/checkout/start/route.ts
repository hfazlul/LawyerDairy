import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { checkoutCustomerEmail, createZiniInvoice, zinipayConfigured } from '@/lib/zinipay'
import { isSellablePackage, amountFor, defFor, monthsForPeriod } from '@/lib/plans'
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

  if (!isSellablePackage(body.packageCode)) {
    return NextResponse.json({ message: 'This package is not sold', code: 'NOT_SOLD' }, { status: 400 })
  }
  const def = defFor(body.packageCode)
  const pkg = await prisma.subscriptionPackage.findUnique({ where: { code: body.packageCode } })
  if (!pkg || !pkg.active || !def) {
    return NextResponse.json({ message: 'Unknown package' }, { status: 404 })
  }

  const period = body.period ?? 'MONTH'
  const amount = amountFor(def, period)
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
  const domainNote = checkoutRedirectIsLocalhost(origin)
    ? ' PUBLIC_APP_URL / NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL must match the ZiniPay brand website in production.'
    : ''
  if (!zinipayConfigured()) {
    return NextResponse.json({
      subscriptionId: sub.id,
      paymentRail: 'zinipay_web',
      checkoutUrl: null,
      months: monthsForPeriod(period),
      message: 'ZINIPAY_API_KEY সেট নেই — পেমেন্ট লাইভ নয়। অ্যাডমিন ম্যানুয়াল অ্যাক্টিভেট ব্যবহার করুন।' + domainNote,
      redirectOriginLocalhost: checkoutRedirectIsLocalhost(origin),
    })
  }

  const created = await createZiniInvoice({
    cusName: user.name,
    cusEmail: checkoutCustomerEmail(user),
    amountBdt: amount,
    metadata: {
      subscriptionId: sub.id,
      packageCode: pkg.code,
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
      message: created.message,
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
