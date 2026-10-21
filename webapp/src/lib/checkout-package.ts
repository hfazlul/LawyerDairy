import { PACKAGE_DEFS, amountFor, defFor, isSellablePackage, type PlanDef } from './plans'

/** Shown when the posted id is not a real paid catalog plan. */
export const UNKNOWN_PACKAGE_BN = 'এই প্যাকেজ এখন নেই। আবার বাছাই করুন।'

export type CheckoutSelection = {
  code: string
  period: 'MONTH' | 'YEAR'
  amountBdt: number
  def: PlanDef
}

const CYCLE_SUFFIX = /^(.*?)(?:[\s_\-:])(month|year|monthly|yearly)$/i
const PRICE_LABEL = /\s*[—–-]\s*৳[\s\S]*$/

function sellablePaid(def: PlanDef | undefined): def is PlanDef {
  return Boolean(def && def.active && isSellablePackage(def.code) && def.priceBdt > 0)
}

function explicitPeriod(raw?: string | null): 'MONTH' | 'YEAR' | null {
  if (raw == null) return null
  const value = raw.trim().toUpperCase()
  if (!value) return null
  if (value === 'YEAR' || value === 'YEARLY' || value === 'ANNUAL') return 'YEAR'
  if (value === 'MONTH' || value === 'MONTHLY') return 'MONTH'
  return null
}

function peelCycle(raw: string): { body: string; period: 'MONTH' | 'YEAR' | null } {
  const match = raw.trim().match(CYCLE_SUFFIX)
  if (!match) return { body: raw.trim(), period: null }
  const word = match[2].toLowerCase()
  return {
    body: match[1].trim(),
    period: word.startsWith('year') ? 'YEAR' : 'MONTH',
  }
}

/** Map a posted code, display name, or code-plus-cycle back to one catalog id. */
function matchSellable(rawBody: string): PlanDef | null {
  const body = rawBody.replace(PRICE_LABEL, '').trim()
  if (!body) return null

  const compact = body.toUpperCase().replace(/[\s-]+/g, '_')
  const exact = defFor(compact)
  if (sellablePaid(exact)) return exact

  const paid = PACKAGE_DEFS.filter(sellablePaid).sort(
    (a, b) => b.nameEn.length - a.nameEn.length || b.nameBn.length - a.nameBn.length,
  )
  const lower = body.toLowerCase()
  return paid.find((plan) => lower === plan.nameEn.toLowerCase() || body === plan.nameBn) ?? null
}

/**
 * The buy form posts a catalog code such as PRO. Accept that id, and also a
 * display label or a cycle suffix, then price it from PACKAGE_DEFS.
 * Amount is always the catalog price and must be greater than 0.
 */
export function resolveCheckoutPackage(
  rawCode: string,
  rawPeriod?: string | null,
): CheckoutSelection | null {
  const peeled = peelCycle(rawCode || '')
  const def = matchSellable(peeled.body)
  if (!def) return null
  const period = explicitPeriod(rawPeriod) ?? peeled.period ?? 'MONTH'
  const amountBdt = amountFor(def, period)
  if (!(amountBdt > 0)) return null
  return { code: def.code, period, amountBdt, def }
}

/** Fields written so a missing SubscriptionPackage row matches the catalog. */
export function catalogPackageFields(def: PlanDef) {
  return {
    code: def.code,
    nameBn: def.nameBn,
    nameEn: def.nameEn,
    priceBdt: def.priceBdt,
    yearlyBdt: def.yearlyBdt,
    featuresJson: def.featuresJson,
    smsMonthly: def.smsMonthly,
    smsYearly: def.smsYearly,
    teamSeats: def.teamSeats,
    autoHearingSms: def.autoHearingSms,
    careerFull: def.careerFull,
    adsOff: def.adsOff,
    sortOrder: def.sortOrder,
    active: true,
  }
}

function looksSensitive(text: string): boolean {
  return /ZINIPAY_|PUBLIC_APP_URL|NEXT_PUBLIC_|process\.env|\.env\b|at\s+\S+\s+\(|stack trace/i.test(text)
}

/** Last line of defense so the buy button never renders the English package error. */
export function buyerFacingCheckoutMessage(message: string | undefined | null, httpOk: boolean): string {
  const text = (message || '').trim()
  if (/unknown package/i.test(text) || /this package is not sold/i.test(text)) return UNKNOWN_PACKAGE_BN
  if (!text || looksSensitive(text)) {
    return httpOk
      ? 'পেমেন্ট এখন উপলব্ধ নয়। সাপোর্ট বা অ্যাডমিন অ্যাক্টিভেট ব্যবহার করুন।'
      : 'পেমেন্ট এখন শুরু করা যায়নি। একটু পরে আবার চেষ্টা করুন।'
  }
  return text
}
