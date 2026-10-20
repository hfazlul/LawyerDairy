/** Limitation Act 1908 First Schedule (BD) — mirror of mobile LimitationEngine. */

export type LimitationRule = { days?: number; years?: number; ruleRefBn: string; ruleRefEn: string; labelBn: string; labelEn: string }

export const LIMITATION_RULES: Record<string, LimitationRule> = {
  appealDistrictJudge: { days: 30, labelBn: 'আপিল — জেলা জজ', labelEn: 'Appeal — District Judge', ruleRefBn: 'অনু. ১৫২ · ৩০ দিন', ruleRefEn: 'Art. 152 · 30 days' },
  appealHighCourtCivil: { days: 90, labelBn: 'আপিল — হাইকোর্ট দেওয়ানি', labelEn: 'Appeal — HCD civil', ruleRefBn: 'অনু. ১৫৬ · ৯০ দিন', ruleRefEn: 'Art. 156 · 90 days' },
  appealHighCourtCriminal: { days: 60, labelBn: 'আপিল — হাইকোর্ট ফৌজদারি', labelEn: 'Appeal — HCD criminal', ruleRefBn: 'অনু. ১৫৫ · ৬০ দিন', ruleRefEn: 'Art. 155 · 60 days' },
  appealCriminalOther: { days: 30, labelBn: 'আপিল — অন্য ফৌজদারি', labelEn: 'Appeal — other criminal', ruleRefBn: 'অনু. ১৫৪ · ৩০ দিন', ruleRefEn: 'Art. 154 · 30 days' },
  leaveAppellateDivision: { days: 90, labelBn: 'আপিল বিভাগে অনুমতি', labelEn: 'Leave to AD', ruleRefBn: 'অনু. ১৭৯ · ৯০ দিন', ruleRefEn: 'Art. 179 · 90 days' },
  reviewSmallCause: { days: 15, labelBn: 'রিভিউ — স্মল কজ', labelEn: 'Review — Small Cause', ruleRefBn: 'অনু. ১৬১ · ১৫ দিন', ruleRefEn: 'Art. 161 · 15 days' },
  reviewHighCourtOriginal: { days: 20, labelBn: 'রিভিউ — হাইকোর্ট মূল', labelEn: 'Review — HC original', ruleRefBn: 'অনু. ১৬২ · ২০ দিন', ruleRefEn: 'Art. 162 · 20 days' },
  reviewOther: { days: 90, labelBn: 'রিভিউ — অন্য আদালত', labelEn: 'Review — other court', ruleRefBn: 'অনু. ১৭৩ · ৯০ দিন', ruleRefEn: 'Art. 173 · 90 days' },
  setAsideExParte: { days: 30, labelBn: 'একতরফা ডিক্রি বাতিল', labelEn: 'Set aside ex parte', ruleRefBn: 'অনু. ১৬৪ · ৩০ দিন', ruleRefEn: 'Art. 164 · 30 days' },
  executionDecree: { years: 3, labelBn: 'ডিক্রি জারি', labelEn: 'Execution of decree', ruleRefBn: 'অনু. ১৮২ · ৩ বছর', ruleRefEn: 'Art. 182 · 3 years' },
  moneyLent: { years: 3, labelBn: 'ধার দেওয়া টাকা', labelEn: 'Money lent', ruleRefBn: 'অনু. ৫৭ · ৩ বছর', ruleRefEn: 'Art. 57 · 3 years' },
  contractBreachUnreg: { years: 3, labelBn: 'অনিবন্ধিত চুক্তি লঙ্ঘন', labelEn: 'Unregistered contract', ruleRefBn: 'অনু. ১১৫ · ৩ বছর', ruleRefEn: 'Art. 115 · 3 years' },
  mortgageChargeSuit: { years: 12, labelBn: 'দায়যুক্ত টাকার মামলা', labelEn: 'Charge on immovable', ruleRefBn: 'অনু. ১৩২ · ১২ বছর', ruleRefEn: 'Art. 132 · 12 years' },
  residualApplication: { years: 3, labelBn: 'অবশিষ্ট আবেদন / রিভিশন', labelEn: 'Residual application', ruleRefBn: 'অনু. ১৮১ · ৩ বছর', ruleRefEn: 'Art. 181 · 3 years' },
  niActCheque: { days: 30, labelBn: 'চেক — নোটিশের পর', labelEn: 'NI s.138 after notice', ruleRefBn: 'ধারা ১৩৮ · ৩০ দিন', ruleRefEn: 's.138 · 30 days' },
}

const ALIASES: Record<string, string> = {
  appealSupremeCourt: 'leaveAppellateDivision',
  revisionCivil: 'residualApplication',
  revisionCriminal: 'residualApplication',
  reviewCivil: 'reviewOther',
  reviewHighCourt: 'reviewHighCourtOriginal',
  moneySuit: 'moneyLent',
  contractBreach: 'contractBreachUnreg',
  executionMortgage: 'mortgageChargeSuit',
}

function ymd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isClosed(d: Date) {
  const w = d.getDay() // 0 Sun … 5 Fri 6 Sat
  return w === 5 || w === 6
}

function addCalendarYears(base: Date, years: number) {
  const y = base.getFullYear() + years
  const month = base.getMonth()
  const last = new Date(y, month + 1, 0).getDate()
  const day = Math.min(base.getDate(), last)
  return new Date(y, month, day)
}

export type LimitationResult = {
  kind: string
  baseDate: Date
  days: number
  dueDate: Date
  ruleRefBn: string
  isExpired: boolean
  daysRemaining: number
}

export function computeLimitation(kind: string, baseDate: Date, now = new Date()): LimitationResult | null {
  const key = ALIASES[kind] ?? kind
  const rule = LIMITATION_RULES[key]
  if (!rule) return null
  const base = ymd(baseDate)
  let due: Date
  let prescribedDays: number
  if (rule.years != null) {
    due = addCalendarYears(base, rule.years)
    prescribedDays = Math.round((due.getTime() - base.getTime()) / 86_400_000)
  } else {
    prescribedDays = rule.days ?? 0
    due = new Date(base.getTime() + prescribedDays * 86_400_000)
  }
  due = ymd(due)
  while (isClosed(due)) {
    due = new Date(due.getFullYear(), due.getMonth(), due.getDate() + 1)
  }
  const remaining = Math.round((due.getTime() - ymd(now).getTime()) / 86_400_000)
  return {
    kind,
    baseDate: base,
    days: prescribedDays,
    dueDate: due,
    ruleRefBn: rule.ruleRefBn,
    isExpired: remaining < 0,
    daysRemaining: remaining,
  }
}

export function isoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
