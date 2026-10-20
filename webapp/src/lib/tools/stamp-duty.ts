/** Stamp Act Sch. I (Finance Act 2022) + Registration Table of Fees S.R.O. 254-Law/2014. */

export const STAMP_SOURCES = {
  schIPdf: 'http://bdlaws.minlaw.gov.bd/upload/act/2022-07-18-11-25-48-77___Schedule.pdf',
  financeAct2022: 'https://bdlaws.minlaw.gov.bd/act-1409/chapter-details-2323.html',
  regFee2014Pdf: 'https://www.dpp.gov.bd/upload_file/gazettes/11900_98090.pdf',
  s78a: 'https://bdlaws.minlaw.gov.bd/act-print-90/section-print-27913.html',
  nbrFinanceActs: 'https://nbr.gov.bd/regulations/acts/finance-acts/eng',
} as const

export type DeedKind =
  | 'conveyance'
  | 'contractForSale'
  | 'hebaClose'
  | 'giftOther'
  | 'mortgageTp59'
  | 'partition'
  | 'irrevocablePoa'
  | 'affidavit'
  | 'will'

export const DEED_KINDS: { kind: DeedKind; titleBn: string; titleEn: string; needsValue: boolean }[] = [
  { kind: 'conveyance', titleBn: 'বিক্রয় দলিল (Conveyance)', titleEn: 'Sale deed', needsValue: true },
  { kind: 'contractForSale', titleBn: 'বিক্রয়চুক্তি / বায়না', titleEn: 'Contract for sale', needsValue: true },
  { kind: 'hebaClose', titleBn: 'হেবা — নিকট আত্মীয়', titleEn: 'Heba — close relatives', needsValue: false },
  { kind: 'giftOther', titleBn: 'দান — অন্য ব্যক্তি', titleEn: 'Gift — other', needsValue: true },
  { kind: 'mortgageTp59', titleBn: 'বন্ধক — ধারা ৫৯', titleEn: 'Mortgage T.P. Act s.59', needsValue: true },
  { kind: 'partition', titleBn: 'বণ্টননামা', titleEn: 'Partition', needsValue: true },
  { kind: 'irrevocablePoa', titleBn: 'অপ্রত্যাহারযোগ্য আমমোক্তারনামা', titleEn: 'Irrevocable PoA', needsValue: true },
  { kind: 'affidavit', titleBn: 'হলফনামা', titleEn: 'Affidavit', needsValue: false },
  { kind: 'will', titleBn: 'ইচ্ছাপত্র নিবন্ধন', titleEn: 'Will registration', needsValue: false },
]

export type DeedFeeResult = {
  kind: DeedKind
  value: number
  stamp: number | null
  registration: number | null
  stampNoteBn: string
  stampNoteEn: string
  regNoteBn: string
  regNoteEn: string
}

function pct(v: number, rate: number, cap?: number, min?: number) {
  let x = v * rate
  if (cap != null && x > cap) x = cap
  if (min != null && x < min) x = min
  return x
}

function ordinaryReg2014(v: number) {
  const raw = v * 0.02
  if (v <= 5000) return raw < 100 ? 100 : raw
  return raw
}

function contractForSaleReg(v: number) {
  if (v <= 500_000) return 500
  if (v <= 5_000_000) return 1000
  return 2000
}

function mortgageReg78Ac(v: number) {
  if (v <= 500_000) return Math.min(500, Math.max(200, v * 0.01))
  if (v <= 2_000_000) return Math.min(2000, Math.max(1500, v * 0.0025))
  return Math.min(5000, Math.max(3000, v * 0.001))
}

function partitionReg78B(v: number) {
  if (v <= 300_000) return 500
  if (v <= 1_000_000) return 700
  if (v <= 3_000_000) return 1200
  if (v <= 5_000_000) return 1800
  return 2000
}

export function computeDeedFees(kind: DeedKind, value: number): DeedFeeResult {
  const v = !Number.isFinite(value) || value < 0 ? 0 : value
  switch (kind) {
    case 'conveyance':
      return {
        kind, value: v, stamp: pct(v, 0.015, 20_000_000), registration: ordinaryReg2014(v),
        stampNoteBn: 'অনু. ২২: ১.৫%, সর্বোচ্চ ২ কোটি৳', stampNoteEn: 'Art. 22: 1.5%, max Tk 2 crore',
        regNoteBn: '২০১৪ ছক ক(১): ২%', regNoteEn: '2014 table A(1): 2%',
      }
    case 'contractForSale':
      return {
        kind, value: v, stamp: 300, registration: contractForSaleReg(v),
        stampNoteBn: 'অনু. ৫(গ): ৩০০৳', stampNoteEn: 'Art. 5(c): Tk 300',
        regNoteBn: 'ধারা ৭৮ক(ক): ৫০০ / ১,০০০ / ২,০০০', regNoteEn: 's.78A(a): 500 / 1,000 / 2,000',
      }
    case 'hebaClose':
      return {
        kind, value: v, stamp: 1000, registration: 100,
        stampNoteBn: 'অনু. ৩২(i): ১,০০০৳', stampNoteEn: 'Art. 32(i): Tk 1,000',
        regNoteBn: 'ধারা ৭৮ক(খ): ১০০৳', regNoteEn: 's.78A(b): Tk 100',
      }
    case 'giftOther':
      return {
        kind, value: v, stamp: v * 0.015, registration: ordinaryReg2014(v),
        stampNoteBn: 'অনু. ৩২(ii): ১.৫%', stampNoteEn: 'Art. 32(ii): 1.5%',
        regNoteBn: '২০১৪ ছক ক(১): ২%', regNoteEn: '2014 table A(1): 2%',
      }
    case 'mortgageTp59':
      return {
        kind, value: v, stamp: pct(v, 0.015, 50_000_000), registration: mortgageReg78Ac(v),
        stampNoteBn: 'অনু. ৩৯: ১.৫%, সর্বোচ্চ ৫ কোটি৳', stampNoteEn: 'Art. 39: 1.5%, max Tk 5 crore',
        regNoteBn: 'ধারা ৭৮ক(গ): ১% / ০.২৫% / ০.১০%', regNoteEn: 's.78A(c): 1% / 0.25% / 0.10%',
      }
    case 'partition':
      return {
        kind, value: v, stamp: 100, registration: partitionReg78B(v),
        stampNoteBn: 'অনু. ৪৪: ১০০৳', stampNoteEn: 'Art. 44: Tk 100',
        regNoteBn: 'ধারা ৭৮খ স্ল্যাব', regNoteEn: 's.78B slabs',
      }
    case 'irrevocablePoa': {
      const stamp = Math.min(100_000, Math.max(10_000, v * 0.015))
      const registration = Math.min(40_000, Math.max(100, v * 0.02))
      return {
        kind, value: v, stamp, registration,
        stampNoteBn: 'অনু. ৪৮: ১.৫% (১০ হাজার–১ লক্ষ)', stampNoteEn: 'Art. 48: 1.5% (10k–1 lakh)',
        regNoteBn: '২০১৪ ক(৩): ২% সর্বোচ্চ ৪০,০০০', regNoteEn: '2014 A(3): 2% cap 40,000',
      }
    }
    case 'affidavit':
      return {
        kind, value: 0, stamp: 300, registration: null,
        stampNoteBn: 'অনু. ৪: ৩০০৳', stampNoteEn: 'Art. 4: Tk 300',
        regNoteBn: 'সাধারণ নিবন্ধন ছকে নয়', regNoteEn: 'Not ordinary registration',
      }
    case 'will':
      return {
        kind, value: 0, stamp: null, registration: 200,
        stampNoteBn: 'উইল স্ট্যাম্প এখানে নেই', stampNoteEn: 'Will stamp not computed',
        regNoteBn: '২০১৪ ছক গ(iii): ২০০৳', regNoteEn: '2014 C(iii): Tk 200',
      }
  }
}
