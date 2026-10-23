import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, planOf, planExpires } from '@/lib/auth-middleware'
import { entitlementPayload } from '@/lib/entitlement-gates'
import { isFullAccessAccount } from '@/lib/full-access'
import { JURISDICTION_META } from '@/lib/jurisdiction'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const fullAccess = isFullAccessAccount(user)
  const plan = planOf(user)
  const endsAt = planExpires(user)
  const payload = entitlementPayload(plan, endsAt, {
    userCreatedAt: user.createdAt,
    trialEndsAt: user.webTrialEndsAt,
    fullAccess,
  })
  const meta = JURISDICTION_META['BD']

  const { isPremiumActive } = await import('@/lib/entitlement-gates')
  const active = isPremiumActive(plan, endsAt) || fullAccess

  return NextResponse.json({
    status: active ? 'active' : 'inactive',
    ...payload,
    jurisdiction: 'BD',
    uiLanguage: user.uiLanguage,
    paymentRail: 'zinipay_web',
    country: { name: meta.nameEn, flag: meta.flag },
    guideVideoKey: meta.guideVideoKey,
    smsCredits: user.activeMembership?.workspace.smsCredits ?? 0,
  })
}
