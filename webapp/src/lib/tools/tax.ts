/** Individual income tax AY 2026-27 — NBR Nirdeshika 2026-27. */

export const TAX_SOURCE =
  'আয়কর নির্দেশিকা ২০২৬-২০২৭, NBR (প্রকাশ ২ সেপ্টেম্বর ২০২৬) · https://nbr.gov.bd/uploads/publications/আয়কর_নির্দেশিকা_২০২৬-২০২৭.pdf'

const REST: [number, number][] = [
  [300_000, 0.10],
  [400_000, 0.15],
  [500_000, 0.20],
  [2_000_000, 0.25],
]
const TOP = 0.30
const SAL_CAP = 500_000
const REBATE_INC = 0.03
const REBATE_INV = 0.10
const REBATE_CAP = 750_000
const MIN_TAX = 5_000
const MIN_FIRST = 1_000
const DISABLED_CHILD = 50_000

export function exemptionThreshold(kind: string, disabledDependents = 0) {
  const base = kind === 'woman' ? 450_000 : kind === 'disabled' ? 525_000 : kind === 'freedom' ? 550_000 : 400_000
  return base + Math.max(0, Math.min(20, disabledDependents)) * DISABLED_CHILD
}

function slabTax(income: number, nilBand: number) {
  if (income <= 0) return 0
  let remaining = income
  let tax = 0
  const first = Math.min(remaining, nilBand)
  remaining -= first
  for (const [width, rate] of REST) {
    if (remaining <= 0) break
    const take = Math.min(remaining, width)
    tax += take * rate
    remaining -= take
  }
  if (remaining > 0) tax += remaining * TOP
  return tax
}

export function salaryHeadExemption(salary: number) {
  if (salary <= 0) return 0
  return Math.min(salary / 3, SAL_CAP)
}

export function computeIndividualTax(opts: {
  kind?: string
  salary?: number
  otherIncome?: number
  investment?: number
  disabledDependents?: number
  firstTimeFiler?: boolean
}) {
  const kind = opts.kind ?? 'general'
  const salary = Math.max(0, opts.salary ?? 0)
  const other = Math.max(0, opts.otherIncome ?? 0)
  const invest = Math.max(0, opts.investment ?? 0)
  const salEx = salaryHeadExemption(salary)
  const total = salary - salEx + other
  const nilBand = exemptionThreshold(kind, opts.disabledDependents ?? 0)
  const tax0 = slabTax(total, nilBand)
  const rebateRaw = invest <= 0 ? 0 : Math.min(total * REBATE_INC, invest * REBATE_INV, REBATE_CAP)
  let after = Math.max(0, tax0 - rebateRaw)
  const minTax = total > nilBand ? (opts.firstTimeFiler ? MIN_FIRST : MIN_TAX) : 0
  const payable = total > nilBand ? Math.max(after, minTax) : 0
  return { nilBand, salEx, total, tax0, rebate: rebateRaw, minTax, payable }
}
