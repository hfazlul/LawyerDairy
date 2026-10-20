import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { activatePaidSubscription } from '@/lib/billing'
import { readSslForm, validateSslcommerzPayment } from '@/lib/sslcommerz'

export async function POST(req: NextRequest) {
  const body = await readSslForm(req)
  const valId = body.val_id || body.valId || ''
  const tranId = body.tran_id || body.tranId || ''
  if (!valId || !tranId) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const check = await validateSslcommerzPayment(valId)
  if (!check.valid || (check.tranId && check.tranId !== tranId)) {
    return NextResponse.json({ ok: false, status: check.status || 'invalid' }, { status: 400 })
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: tranId },
    include: { package: true },
  })
  if (!sub) return NextResponse.json({ ok: false, reason: 'unknown_tran' }, { status: 404 })
  if (check.amount != null && Math.round(check.amount) !== sub.package.priceBdt) {
    return NextResponse.json({ ok: false, reason: 'amount_mismatch' }, { status: 400 })
  }

  await prisma.$transaction((tx) =>
    activatePaidSubscription(tx, { subscriptionId: tranId, gatewayRef: valId }),
  )
  return NextResponse.json({ ok: true })
}
