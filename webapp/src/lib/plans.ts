import type { Plan } from '@prisma/client'

/** Canonical 13 Sep 2026 catalog. Seed, APIs, and tests must use this. */
export const PAID_SKU_CODES = [
  'STARTER',
  'PRO',
  // Paused paid tiers. The definitions stay below, commented out. Do not delete them.
  // 'PRO_ADVANCE',
  // 'ADVANCE',
] as const
export type PaidSku = (typeof PAID_SKU_CODES)[number]

export type PlanDef = {
  code: string
  nameBn: string
  nameEn: string
  priceBdt: number
  yearlyBdt: number | null
  featuresJson: string[]
  smsMonthly: number
  smsYearly: number
  teamSeats: number
  autoHearingSms: boolean
  careerFull: boolean
  adsOff: boolean
  active: boolean
  sortOrder: number
}

export const PACKAGE_DEFS: PlanDef[] = [
  {
    code: 'FREE',
    nameBn: 'ফ্রি',
    nameEn: 'Free',
    priceBdt: 0,
    yearlyBdt: 0,
    featuresJson: [
      'notifications',
      'law_books',
      'calculators',
      'templates',
      'career_20',
      'ads_on',
    ],
    smsMonthly: 0,
    smsYearly: 0,
    teamSeats: 1,
    autoHearingSms: false,
    careerFull: false,
    adsOff: false,
    active: true,
    sortOrder: 0,
  },
  {
    code: 'STARTER',
    nameBn: 'স্টার্টার',
    nameEn: 'Starter',
    priceBdt: 49,
    yearlyBdt: 530,
    featuresJson: ['ads_off', 'unlimited_diary', 'career_full', 'team_2', 'no_auto_sms'],
    smsMonthly: 0,
    smsYearly: 0,
    teamSeats: 2,
    autoHearingSms: false,
    careerFull: true,
    adsOff: true,
    active: true,
    sortOrder: 1,
  },
  {
    code: 'PRO',
    nameBn: 'প্রো',
    nameEn: 'Pro',
    priceBdt: 99,
    yearlyBdt: 1069,
    featuresJson: ['ads_off', 'unlimited_diary', 'career_full', 'team_5', 'sms_150'],
    smsMonthly: 150,
    smsYearly: 1800,
    teamSeats: 5,
    autoHearingSms: true,
    careerFull: true,
    adsOff: true,
    active: true,
    sortOrder: 2,
  },
  /* Paused paid tiers. Uncomment to sell them again. Do not delete.
  {
    code: 'PRO_ADVANCE',
    nameBn: 'প্রো অ্যাডভান্স',
    nameEn: 'Pro Advance',
    priceBdt: 149,
    yearlyBdt: 1600,
    featuresJson: ['ads_off', 'unlimited_diary', 'career_full', 'team_7', 'sms_280'],
    smsMonthly: 280,
    smsYearly: 3360,
    teamSeats: 7,
    autoHearingSms: true,
    careerFull: true,
    adsOff: true,
    active: true,
    sortOrder: 3,
  },
  {
    code: 'ADVANCE',
    nameBn: 'অ্যাডভান্স',
    nameEn: 'Advance',
    priceBdt: 199,
    yearlyBdt: 2150,
    featuresJson: ['ads_off', 'unlimited_diary', 'career_full', 'team_7', 'sms_400'],
    smsMonthly: 400,
    smsYearly: 4800,
    teamSeats: 7,
    autoHearingSms: true,
    careerFull: true,
    adsOff: true,
    active: true,
    sortOrder: 4,
  },
  {
    code: 'CHAMBER',
    nameBn: 'চেম্বার (পুরনো)',
    nameEn: 'Chamber (legacy)',
    priceBdt: 799,
    yearlyBdt: null,
    featuresJson: ['legacy_not_sold'],
    smsMonthly: 280,
    smsYearly: 3360,
    teamSeats: 7,
    autoHearingSms: true,
    careerFull: true,
    adsOff: true,
    active: false,
    sortOrder: 90,
  },
  {
    code: 'SMS_500',
    nameBn: '৫০০ এসএমএস (পুরনো)',
    nameEn: '500 SMS (legacy)',
    priceBdt: 399,
    yearlyBdt: null,
    featuresJson: ['legacy_not_sold'],
    smsMonthly: 0,
    smsYearly: 0,
    teamSeats: 0,
    autoHearingSms: false,
    careerFull: false,
    adsOff: true,
    active: false,
    sortOrder: 91,
  },
  */
]

export const SELLABLE_CODES = new Set<string>(PAID_SKU_CODES)

export function isSellablePackage(code: string): boolean {
  return SELLABLE_CODES.has(code)
}

export function planFromPackageCode(code: string): Plan | null {
  if (code === 'STARTER') return 'STARTER'
  if (code === 'PRO') return 'PRO'
  if (code === 'PRO_ADVANCE') return 'PRO_ADVANCE'
  if (code === 'ADVANCE') return 'ADVANCE'
  if (code === 'CHAMBER') return 'CHAMBER'
  return null
}

export function defFor(code: string): PlanDef | undefined {
  return PACKAGE_DEFS.find((p) => p.code === code)
}

export function monthsForPeriod(period: 'MONTH' | 'YEAR' | string): number {
  return period === 'YEAR' ? 12 : 1
}

export function amountFor(def: PlanDef, period: 'MONTH' | 'YEAR' | string): number {
  if (period === 'YEAR') return def.yearlyBdt ?? def.priceBdt * 12
  return def.priceBdt
}

export const FEATURE_MATRIX: { key: string; labelBn: string; free: string; starter: string; pro: string; proAdvance: string; advance: string }[] = [
  { key: 'ads', labelBn: 'বিজ্ঞাপন', free: 'নেটিভ অ্যাড', starter: 'বন্ধ', pro: 'বন্ধ', proAdvance: 'বন্ধ', advance: 'বন্ধ' },
  { key: 'diary', labelBn: 'মামলা / মক্কেল / শুনানি', free: 'মাস ১: ২০; পরে ১০ নতুন', starter: 'সীমাহীন', pro: 'সীমাহীন', proAdvance: 'সীমাহীন', advance: 'সীমাহীন' },
  { key: 'sms', labelBn: 'অটো শুনানি এসএমএস', free: 'নেই', starter: 'নেই', pro: '১৫০/মাস বা ১৮০০/বছর', proAdvance: '২৮০/মাস বা ৩৩৬০/বছর', advance: '৪০০/মাস বা ৪৮০০/বছর' },
  { key: 'career', labelBn: 'লিগ্যাল ক্যারিয়ার', free: '২০% লোকাল', starter: 'পূর্ণ', pro: 'পূর্ণ', proAdvance: 'পূর্ণ', advance: 'পূর্ণ' },
  { key: 'team', labelBn: 'টিম সিট (মালিক ছাড়া)', free: 'ট্রায়ালে ১', starter: '২', pro: '৫', proAdvance: '৭', advance: '৭' },
  { key: 'fl_lawyer', labelBn: 'আইনজীবী খুঁজুন (গ্রহণ)', free: 'মাস ১: ৫; পরে ৩', starter: 'সীমাহীন', pro: 'সীমাহীন', proAdvance: 'সীমাহীন', advance: 'সীমাহীন' },
  { key: 'fl_client', labelBn: 'মক্কেল যোগাযোগ', free: '৩ আইনজীবী', starter: 'সীমাহীন', pro: 'সীমাহীন', proAdvance: 'সীমাহীন', advance: 'সীমাহীন' },
  { key: 'tools', labelBn: 'আইন বই / ক্যালকুলেটর / খসড়া', free: 'হ্যাঁ', starter: 'হ্যাঁ', pro: 'হ্যাঁ', proAdvance: 'হ্যাঁ', advance: 'হ্যাঁ' },
  { key: 'notif', labelBn: 'নোটিফিকেশন', free: 'হ্যাঁ', starter: 'হ্যাঁ', pro: 'হ্যাঁ', proAdvance: 'হ্যাঁ', advance: 'হ্যাঁ' },
]
