import type { Plan } from '@prisma/client'

/**
 * Tier model: FREE | STARTER | PRO | PRO_ADVANCE (+ legacy CHAMBER).
 *
 * Web gates:
 * - STARTER / PRO → cause-list + stats/payment visuals + team size 1
 * - PRO_ADVANCE / CHAMBER → case manage + cause-list + team 2–3
 * - Documents/scan → phone only (web shows placeholder)
 */

const PAID: Plan[] = ['STARTER', 'PRO', 'PRO_ADVANCE', 'CHAMBER']
const CASE_MGMT: Plan[] = ['PRO_ADVANCE', 'CHAMBER']
const CAUSE_LIST: Plan[] = ['STARTER', 'PRO', 'PRO_ADVANCE', 'CHAMBER']

export function isPremiumActive(plan: Plan, endsAt: Date | null | undefined): boolean {
  if (plan === 'FREE') return false
  if (!endsAt) return true
  return endsAt.getTime() > Date.now()
}

export function isPaidPlan(plan: Plan): boolean {
  return PAID.includes(plan)
}

/** Cause-list + dashboard stats for Starter/Pro+. */
export function hasCauseListAccess(plan: Plan, endsAt: Date | null | undefined): boolean {
  if (!isPremiumActive(plan, endsAt)) return false
  return CAUSE_LIST.includes(plan)
}

/** Full web case management — Pro-Advance only. */
export function hasCaseManageAccess(plan: Plan, endsAt: Date | null | undefined): boolean {
  if (!isPremiumActive(plan, endsAt)) return false
  return CASE_MGMT.includes(plan)
}

/** Alias for case-manage gate (legacy name). */
export function hasProAdvance(plan: Plan, endsAt: Date | null | undefined): boolean {
  return hasCaseManageAccess(plan, endsAt)
}

export function maxTeamMembers(plan: Plan, endsAt: Date | null | undefined): number {
  if (!isPremiumActive(plan, endsAt)) return 1
  if (CASE_MGMT.includes(plan)) return 3
  if (CAUSE_LIST.includes(plan)) return 1
  return 1
}
