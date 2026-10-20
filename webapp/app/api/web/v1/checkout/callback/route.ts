import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { activatePaidSubscription } from '@/lib/billing'
import { appBaseUrl, readSslForm, validateSslcommerzPayment } from '@/lib/sslcommerz'

async function handle(req: NextRequest) {
  const origin = appBaseUrl(req.url)
  const url = new URL(req.url)
  const statusHint = url.searchParams.get('status') || 'success'

  const fromQuery: Record<string, string> = {}
  url.searchParams.forEach((v, k) => {
    fromQuery[k] = v
  })
  const fromBody = req.method === 'POST' ? await readSslForm(req) : {}
  const body = { ...fromQuery, ...fromBody }

  const fail = () => NextResponse.redirect(`${origin}/user/member?pay=0`, 303)

  if (statusHint === 'fail' || statusHint === 'cancel') {
    return fail()
  }

  const valId = body.val_id || body.valId || ''
  const tranId = body.tran_id || body.tranId || ''
  if (!valId || !tranId) return fail()

  const check = await validateSslcommerzPayment(valId)
  if (!check.valid) return fail()

  const sub = await prisma.subscription.findUnique({
    where: { id: tranId },
    include: { package: true },
  })
  if (!sub) return fail()
  if (check.amount != null && Math.round(check.amount) !== sub.package.priceBdt) return fail()

  await prisma.$transaction((tx) =>
    activatePaidSubscription(tx, { subscriptionId: tranId, gatewayRef: valId }),
  )
  return NextResponse.redirect(`${origin}/user/member?pay=1`, 303)
}

export const GET = handle
export const POST = handle
