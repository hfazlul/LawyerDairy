import type { Plan } from '@prisma/client'
import {
  extraTeamSeatsAllowed,
  monthlySmsCredits,
  planCareerFull,
  planHasAutoHearingSms,
  storageQuotaBytes,
  yearlySmsCredits,
} from './permissions'
import { freeMonthNumber, freeCapsForMonth } from './free-caps'
import { appBaseUrl } from './app-url'

const PAID: Plan[] = ['STARTER', 'PRO', 'PRO_ADVANCE', 'ADVANCE', 'CHAMBER']

export function isPremiumActive(plan: Plan, endsAt: Date | null | undefined): boolean {
  if (plan === 'FREE') return false
  if (!PAID.includes(plan)) return false
  if (!endsAt) return true
  return endsAt.getTime() > Date.now()
}

export function isPaidPlan(plan: Plan): boolean {
  return PAID.includes(plan)
}

export function webTrialActive(createdAt: Date, trialEndsAt?: Date | null): boolean {
  const end = trialEndsAt ?? new Date(createdAt.getTime() + 7 * 86400000)
  return end.getTime() > Date.now()
}

export function hasWebDiaryView(
  plan: Plan,
  endsAt: Date | null | undefined,
  userCreatedAt: Date,
  trialEndsAt?: Date | null,
): boolean {
  if (isPremiumActive(plan, endsAt)) return true
  return webTrialActive(userCreatedAt, trialEndsAt)
}

export function hasCauseListAccess(
  plan: Plan,
  endsAt: Date | null | undefined,
  userCreatedAt?: Date,
  trialEndsAt?: Date | null,
): boolean {
  if (isPremiumActive(plan, endsAt)) return true
  if (userCreatedAt) return webTrialActive(userCreatedAt, trialEndsAt)
  return true
}

export function hasCaseManageAccess(plan: Plan, endsAt: Date | null | undefined): boolean {
  return isPremiumActive(plan, endsAt)
}

export function hasProAdvance(plan: Plan, endsAt: Date | null | undefined): boolean {
  return isPremiumActive(plan, endsAt)
}

export function maxTeamMembers(
  plan: Plan,
  endsAt?: Date | null,
  opts?: { userCreatedAt?: Date; trialEndsAt?: Date | null },
): number {
  const paid = isPremiumActive(plan, endsAt)
  const trial = opts?.userCreatedAt
    ? webTrialActive(opts.userCreatedAt, opts.trialEndsAt)
    : plan === 'FREE'
  return extraTeamSeatsAllowed(plan, { paid, trialActive: trial })
}

export function smsCreditsForPlan(plan: Plan): number {
  return monthlySmsCredits(plan)
}

export function storageLimitBytes(plan: Plan): number {
  return storageQuotaBytes(plan)
}

export function publicSiteUrl(): string {
  return appBaseUrl()
}

export function entitlementPayload(
  plan: Plan,
  endsAt: Date | null | undefined,
  opts?: { userCreatedAt?: Date; trialEndsAt?: Date | null },
) {
  const active = isPremiumActive(plan, endsAt)
  const created = opts?.userCreatedAt ?? new Date()
  const trial = webTrialActive(created, opts?.trialEndsAt)
  const caps = freeCapsForMonth(freeMonthNumber(created))
  const seats = extraTeamSeatsAllowed(plan, { paid: active, trialActive: trial })
  return {
    plan,
    expiresAt: endsAt?.toISOString() ?? null,
    accountCreatedAt: created.toISOString(),
    accountMonth: freeMonthNumber(created),
    features: {
      ads: !active,
      adsOff: active,
      reports: active,
      ocr: active,
      listing: active,
      caseManageWeb: false,
      causeList: true,
      careerFull: active && planCareerFull(plan),
      autoHearingSms: active && planHasAutoHearingSms(plan),
      showPlayBillingCta: false,
      showWebBuyCta: true,
    },
    limits: {
      maxTeamMembers: seats,
      maxTeamTotal: seats + 1,
      smsCreditsPerMonth: monthlySmsCredits(plan),
      smsCreditsPerYear: yearlySmsCredits(plan),
      storageBytes: storageQuotaBytes(plan),
      caseCountCap: active ? null : caps.cases,
      clientCountCap: active ? null : caps.clients,
      hearingCountCap: active ? null : caps.hearings,
      findLawyerReceiveCap: active ? null : caps.findLawyerReceive,
      findLawyerClientContactCap: active ? null : 3,
      careerLocalPct: active ? 100 : 20,
      webTrialDays: 7,
    },
    payOnWebUrl: `${publicSiteUrl()}/package`,
    paymentHelp: {
      visitWeb: true,
      noInAppWalletNumbers: true,
    },
  }
}
