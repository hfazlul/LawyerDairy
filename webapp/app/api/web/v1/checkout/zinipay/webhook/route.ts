import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { activatePaidSubscription } from '@/lib/billing'
import { verifyZiniInvoice, extractInvoiceId, shouldActivateFromVerify } from '@/lib/zinipay'
import { appBaseUrl } from '@/lib/app-url'

async function fulfill(invoiceId: string, subscriptionId?: string) {
  const verified = await verifyZiniInvoice(invoiceId)
  if (!verified.ok) return { ok: false as const, reason: verified.message }
  if (!shouldActivateFromVerify(verified)) return { ok: false as const, reason: verified.status }
  const sub =
    (subscriptionId
      ? await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { package: true } })
      : null) ||
    (await prisma.subscription.findFirst({
      where: { gatewayRef: invoiceId },
      include: { package: true },
    }))
  if (!sub) return { ok: false as const, reason: 'missing_sub' }
  if (verified.amount != null && sub.amountBdt != null && Math.round(verified.amount) !== sub.amountBdt) {
    return { ok: false as const, reason: 'amount_mismatch' }
  }
  await prisma.$transaction(async (tx) =>
    activatePaidSubscription(tx, {
      subscriptionId: sub.id,
      gatewayRef: verified.transactionId || invoiceId,
      gateway: 'ZiniPay',
      months: sub.billingPeriod === 'YEAR' ? 12 : 1,
    }),
  )
  return { ok: true as const }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  const url = new URL(req.url)
  url.searchParams.forEach((v, k) => {
    body[k] = v
  })
  try {
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('json')) {
      Object.assign(body, (await req.json()) as Record<string, unknown>)
    } else if (ct.includes('form')) {
      const fd = await req.formData()
      fd.forEach((v, k) => {
        body[k] = String(v)
      })
    } else {
      const text = await req.text()
      if (text) {
        try {
          Object.assign(body, JSON.parse(text) as Record<string, unknown>)
        } catch {
          new URLSearchParams(text).forEach((v, k) => {
            body[k] = v
          })
        }
      }
    }
  } catch {
    /* query-string invoice_id still used */
  }
  const invoiceId = String(body.invoice_id || body.invoiceId || extractInvoiceId(body) || '')
  if (!invoiceId) return NextResponse.json({ ok: false }, { status: 400 })
  // Never fulfill from webhook status:true alone — fulfill() always calls /verify.
  const result = await fulfill(invoiceId)
  return NextResponse.json(result)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const origin = appBaseUrl(req.url)
  const invoiceId = url.searchParams.get('invoice_id') || ''
  const subscriptionId = url.searchParams.get('subscriptionId') || ''
  if (!invoiceId && !subscriptionId) {
    return NextResponse.redirect(`${origin}/user/member?pay=0`, 303)
  }
  let id = invoiceId
  if (!id && subscriptionId) {
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } })
    id = sub?.gatewayRef || ''
  }
  if (!id) return NextResponse.redirect(`${origin}/user/member?pay=0`, 303)
  const result = await fulfill(id, subscriptionId || undefined)
  return NextResponse.redirect(`${origin}/user/member?pay=${result.ok ? '1' : '0'}`, 303)
}
