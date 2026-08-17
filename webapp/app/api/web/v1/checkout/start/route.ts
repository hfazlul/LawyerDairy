import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { paymentRailFor, type JurisdictionCode } from '@/lib/jurisdiction'

const schema = z.object({
  packageCode: z.string().min(1),
})

/**
 * Start web checkout — BD only (SSLCommerz).
 * IN/PK use Play Billing on mobile; do not steer them to web pay.
 */
export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const jurisdiction = user.chamber.jurisdiction as JurisdictionCode
  const rail = paymentRailFor(jurisdiction)

  if (rail !== 'sslcommerz_web') {
    return NextResponse.json(
      {
        message:
          'Web checkout is only for Bangladesh (SSLCommerz). Use Google Play Billing in the Android app for IN/PK.',
        code: 'WRONG_PAYMENT_RAIL',
        paymentRail: rail,
        jurisdiction,
      },
      { status: 403 },
    )
  }

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const pkg = await prisma.subscriptionPackage.findUnique({
    where: { code: body.packageCode },
  })
  if (!pkg || !pkg.active) {
    return NextResponse.json({ message: 'Unknown package' }, { status: 404 })
  }

  const sub = await prisma.subscription.create({
    data: {
      chamberId: user.chamberId,
      packageId: pkg.id,
      status: 'PENDING',
      gateway: 'SSLCommerz',
    },
  })

  // TODO: create SSLCommerz session when SSLCOMMERZ_STORE_ID is set
  const hasGateway = Boolean(process.env.SSLCOMMERZ_STORE_ID?.trim())
  return NextResponse.json({
    subscriptionId: sub.id,
    paymentRail: rail,
    checkoutUrl: null,
    message: hasGateway
      ? 'Gateway credentials present — SSLCommerz session create TODO'
      : 'Subscription pending; configure SSLCommerz to get checkout URL',
  })
}
