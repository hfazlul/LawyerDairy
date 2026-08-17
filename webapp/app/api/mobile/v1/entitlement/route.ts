import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  isPremiumActive,
  hasCauseListAccess,
  hasCaseManageAccess,
  maxTeamMembers,
} from '@/lib/auth-middleware'
import { paymentRailFor, JURISDICTION_META, type JurisdictionCode } from '@/lib/jurisdiction'

/** Mobile entitlement sync — purchase path depends on jurisdiction. */
export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { chamber } = user
  const active = isPremiumActive(chamber.plan, chamber.subscriptionEndsAt)
  const jurisdiction = chamber.jurisdiction as JurisdictionCode
  const meta = JURISDICTION_META[jurisdiction]
  const rail = paymentRailFor(jurisdiction)

  return NextResponse.json({
    status: active ? 'active' : 'inactive',
    plan: chamber.plan,
    endsAt: chamber.subscriptionEndsAt?.toISOString() ?? null,
    jurisdiction,
    jurisdictionConfirmed: chamber.jurisdictionConfirmed,
    uiLanguage: user.uiLanguage,
    paymentRail: rail,
    country: { name: meta.nameEn, flag: meta.flag },
    guideVideoKey: meta.guideVideoKey,
    features: {
      ads: !active,
      advanced: active,
      causeList: hasCauseListAccess(chamber.plan, chamber.subscriptionEndsAt),
      caseManageWeb: hasCaseManageAccess(chamber.plan, chamber.subscriptionEndsAt),
      maxTeam: maxTeamMembers(chamber.plan, chamber.subscriptionEndsAt),
      /** Mobile: show Play Billing stub only for play_billing rail */
      showPlayBillingCta: rail === 'play_billing' && !active,
      /** Mobile BD: never show buy CTA */
      showWebBuyCta: false,
      bdOnlyTools: meta.bdOnlyTools,
    },
  })
}
