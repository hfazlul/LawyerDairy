import type { Plan } from '@prisma/client'
import { normalizeBdPhone } from '@/lib/identity'

/** Hearing bulk SMS stays behind this account until the feature opens for everyone. */
export const FULL_ACCESS_USERNAME = 'fazlul_3601'
export const FULL_ACCESS_PHONE = '+8801858173601'

export const COMING_SOON_BN = 'এই ফিচারটি খুব শীঘ্রই আসবে ইনশাআল্লাহ'

export function isFullAccessAccount(user: {
  username?: string | null
  phone?: string | null
}): boolean {
  const username = (user.username || '').trim().toLowerCase()
  if (username === FULL_ACCESS_USERNAME) return true
  if (!user.phone) return false
  return normalizeBdPhone(user.phone) === FULL_ACCESS_PHONE
}

/** Effective plan for gates. The stored workspace plan is left unchanged. */
export function fullAccessPlan(user: { username?: string | null; phone?: string | null }, plan: Plan): Plan {
  return isFullAccessAccount(user) ? 'PRO' : plan
}

export function fullAccessExpiry(
  user: { username?: string | null; phone?: string | null },
  endsAt: Date | null,
): Date | null {
  return isFullAccessAccount(user) ? null : endsAt
}

/** Stored plan stays in the database. Gates use this effective plan and expiry. */
export function accountBilling(
  account: { username?: string | null; phone?: string | null } | null | undefined,
  plan: Plan,
  endsAt: Date | null | undefined,
): { plan: Plan; endsAt: Date | null } {
  const who = account ?? {}
  return {
    plan: fullAccessPlan(who, plan),
    endsAt: fullAccessExpiry(who, endsAt ?? null),
  }
}
