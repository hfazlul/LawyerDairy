/** Nikah registrar fees from S.R.O. 377-Law/2022 (DPP PDF). */

export const KABIN_SRO = {
  noBn: 'এস. আর. ও. নং ৩৭৭-আইন/২০২২',
  noEn: 'S.R.O. No. 377-Law/2022',
  dateBn: '২১ ডিসেম্বর ২০২২',
  dateEn: '21 December 2022',
  gazetteBn: '২৯ ডিসেম্বর ২০২২',
  gazetteEn: '29 December 2022',
  pdf: 'https://www.dpp.gov.bd/bgpress/bangla/index.php/home/download_file/gazettes/47247_17806.pdf',
} as const

export const KABIN_RATE_PER_THOUSAND = 14
export const KABIN_FIRST_BAND = 500_000
export const KABIN_EXCESS_PER_LAKH = 100
export const KABIN_MIN = 200
export const KABIN_DIVORCE = 1_000

export type KabinFeeResult = {
  kind: 'marriage' | 'divorce'
  dower: number
  fee: number
  breakdownBn: string
  breakdownEn: string
}

export function computeKabinMarriageFee(dower: number): KabinFeeResult {
  const v = !Number.isFinite(dower) || dower < 0 ? 0 : dower
  const first = Math.min(v, KABIN_FIRST_BAND)
  const firstUnits = first <= 0 ? 0 : Math.ceil(first / 1000)
  let fee = firstUnits * KABIN_RATE_PER_THOUSAND
  let excessUnits = 0
  if (v > KABIN_FIRST_BAND) {
    excessUnits = Math.ceil((v - KABIN_FIRST_BAND) / 100_000)
    fee += excessUnits * KABIN_EXCESS_PER_LAKH
  }
  const raw = fee
  if (fee < KABIN_MIN) fee = KABIN_MIN
  const partsBn = [
    `প্রথম ৳৫,০০,০০০: প্রতি ১,০০০৳ × ১৪৳ = ৳${firstUnits * KABIN_RATE_PER_THOUSAND}`,
  ]
  const partsEn = [`First Tk 5,00,000: Tk 14 per Tk 1,000 = Tk ${firstUnits * KABIN_RATE_PER_THOUSAND}`]
  if (excessUnits > 0) {
    partsBn.push(`অতিরিক্ত লক্ষ × ১০০৳ × ${excessUnits}`)
    partsEn.push(`Excess Tk 100 per lakh × ${excessUnits}`)
  }
  if (raw < KABIN_MIN) {
    partsBn.push('ন্যূনতম ৳২০০')
    partsEn.push('Floor Tk 200')
  }
  partsBn.push(`মোট ৳${fee}`)
  partsEn.push(`Total Tk ${fee}`)
  return { kind: 'marriage', dower: v, fee, breakdownBn: partsBn.join(' · '), breakdownEn: partsEn.join(' · ') }
}

export function computeKabinDivorceFee(): KabinFeeResult {
  return {
    kind: 'divorce',
    dower: 0,
    fee: KABIN_DIVORCE,
    breakdownBn: 'তালাক নিবন্ধন ফি ৳১,০০০ (বিধি ২১(২))',
    breakdownEn: 'Divorce registration Tk 1,000 (Rule 21(2))',
  }
}

export const KABIN_LICENCE_ROWS: [string, string][] = [
  ['বিধি ৬(৮)(ক)', '২০,০০০৳'],
  ['বিধি ৬(৮)(খ)(অ)', '৪,০০০৳'],
  ['বিধি ৬(৮)(খ)(আ)', '১,৪০০৳'],
  ['বিধি ৬(৮)(খ)(ই)', '১,০০০৳'],
  ['বিধি ৭(১)(ক)', '১০,০০০৳'],
  ['বিধি ৭(১)(খ)', '২,০০০৳'],
  ['বিধি ৭(১)(গ)', '১,০০০৳'],
  ['বিধি ৭(১)(ঘ)', '২০০৳'],
  ['বিধি ২১(৭)(ক)', 'সিটি কর্পোরেশন ওয়ার্ড ১৬,০০০৳'],
  ['বিধি ২১(৭)(খ)', '৪,০০০৳'],
  ['বিধি ২১(৭)(গ)', '২,০০০৳'],
]
