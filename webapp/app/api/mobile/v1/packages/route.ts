import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, planOf, planExpires } from '@/lib/auth-middleware'
import { fallbackMobileCatalog, mobileCatalogFromRows } from '@/lib/packages-catalog'
import { entitlementPayload, publicSiteUrl } from '@/lib/entitlement-gates'

/** Reader-safe catalog. No checkoutUrl — Play APK must not open a buy CTA. */
export async function GET(req: NextRequest) {
  let user = null
  try {
    user = await requireAuth(req)
  } catch {
    user = null
  }

  let packages = fallbackMobileCatalog()
  try {
    const rows = await prisma.subscriptionPackage.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    })
    packages = mobileCatalogFromRows(rows)
  } catch {
    packages = fallbackMobileCatalog()
  }

  if (!user) {
    return NextResponse.json({
      packages,
      payOnWebUrl: `${publicSiteUrl()}/package`,
      current: { plan: 'FREE', endsAt: null, features: { showWebBuyCta: true, adsOff: false } },
    })
  }

  const plan = planOf(user)
  const endsAt = planExpires(user)
  const entitlement = entitlementPayload(plan, endsAt, {
    userCreatedAt: user.createdAt,
    trialEndsAt: user.webTrialEndsAt,
  })

  return NextResponse.json({
    packages,
    payOnWebUrl: entitlement.payOnWebUrl,
    current: {
      plan,
      endsAt: endsAt?.toISOString() ?? null,
      features: entitlement.features,
      limits: entitlement.limits,
    },
  })
}
