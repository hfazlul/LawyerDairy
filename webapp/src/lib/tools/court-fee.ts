/** Court Fees Act 1870 — Schedule I Table B (S.R.O. 326-Law/2010) + selected Sch. II. */

export type CourtFeeKind = 'pctCap' | 'adValorem' | 'fixed' | 'per500' | 'hcRevisionOrder' | 'probate' | 'succession'

export type CourtFeeItem = {
  id: string
  titleBn: string
  titleEn: string
  kind: CourtFeeKind
  needsValue: boolean
  section35a: boolean
  pct?: number
  cap?: number
  fixed?: number
}

export const COURT_FEE_ITEMS: CourtFeeItem[] = [
  { id: 'family_plaint', titleBn: 'পারিবারিক আরজি (২০২৩ ধারা ২৫)', titleEn: 'Family plaint s.25', kind: 'fixed', fixed: 200, needsValue: false, section35a: false },
  { id: 'money', titleBn: 'টাকা আদায় — ছক খ ২.৫%', titleEn: 'Money suit Table B 2.5%', kind: 'pctCap', pct: 2.5, cap: 50_000, needsValue: true, section35a: true },
  { id: 'property', titleBn: 'সম্পত্তি — ২%', titleEn: 'Property 2%', kind: 'pctCap', pct: 2, cap: 40_000, needsValue: true, section35a: true },
  { id: 'ad_valorem', titleBn: 'দেওয়ানি — ছক খ (অর্থ)', titleEn: 'Civil Table B money', kind: 'adValorem', needsValue: true, section35a: true },
  { id: 'set_aside', titleBn: 'ডিক্রি বাতিল — প্রতি ৫০০৳-এ ১৳', titleEn: 'Set aside — Tk 1 per 500', kind: 'per500', needsValue: true, section35a: true },
  { id: 'declaratory', titleBn: 'ঘোষণামূলক (পরিণতি ছাড়া) ৩০০৳', titleEn: 'Declaratory (no consequential) Tk 300', kind: 'fixed', fixed: 300, needsValue: false, section35a: false },
  { id: 'hc_rev', titleBn: 'হাইকোর্ট রিভিশন আদেশ', titleEn: 'HC revision of order', kind: 'hcRevisionOrder', needsValue: true, section35a: true },
  { id: 'probate', titleBn: 'প্রোবেট অনু. ১০', titleEn: 'Probate Art. 10', kind: 'probate', needsValue: true, section35a: true },
  { id: 'copy', titleBn: 'সার্টিফাইড কপি (নির্দেশক ১০৳/১০০ শব্দ নয় — নির্ধারিত ২০৳ আবেদন)', titleEn: 'Copy application court-fee Tk 20', kind: 'fixed', fixed: 20, needsValue: false, section35a: false },
]

export type CourtFeeResult = { amount: number; breakdownBn: string; breakdownEn: string; section35a: boolean }

function tableBMoney(v: number) {
  const raw = v * 2.5 / 100
  return raw > 50_000 ? 50_000 : raw
}

function probateFee(v: number) {
  if (v <= 5000) return 0
  let fee = 0
  const b1 = Math.min(v, 50_000)
  fee += b1 * 0.03
  if (v > 50_000) fee += (Math.min(v, 100_000) - 50_000) * 0.05
  if (v > 100_000) fee += (Math.min(v, 250_000) - 100_000) * 0.06
  if (v > 250_000) fee += (Math.min(v, 300_000) - 250_000) * 0.07
  if (v > 300_000) fee += (Math.min(v, 500_000) - 300_000) * 0.08
  if (v > 500_000) fee += (v - 500_000) * 0.09
  return fee
}

export function computeCourtFee(item: CourtFeeItem, value?: number): CourtFeeResult | null {
  switch (item.kind) {
    case 'fixed': {
      const f = item.fixed ?? 0
      return { amount: f, breakdownBn: `নির্ধারিত ৳${f}`, breakdownEn: `Fixed Tk ${f}`, section35a: item.section35a }
    }
    case 'pctCap': {
      if (value == null) return null
      const raw = value * (item.pct ?? 0) / 100
      const capped = item.cap == null ? raw : Math.min(raw, item.cap)
      return {
        amount: capped,
        breakdownBn: `${item.pct}%${item.cap ? ` · সর্বোচ্চ ৳${item.cap}` : ''}`,
        breakdownEn: `${item.pct}%${item.cap ? ` · cap Tk ${item.cap}` : ''}`,
        section35a: item.section35a,
      }
    }
    case 'per500': {
      if (value == null) return null
      const n = Math.max(1, Math.ceil(value / 500))
      return { amount: n, breakdownBn: `প্রতি ৫০০৳-এ ১৳ × ${n}`, breakdownEn: `Tk 1 per 500 × ${n}`, section35a: item.section35a }
    }
    case 'hcRevisionOrder': {
      if (value == null) return null
      const f = value < 2000 ? 20 : 40
      return { amount: f, breakdownBn: value < 2000 ? '২,০০০৳-এর নিচে' : '২,০০০৳ বা বেশি', breakdownEn: value < 2000 ? 'under Tk 2,000' : 'Tk 2,000+', section35a: item.section35a }
    }
    case 'probate': {
      if (value == null) return null
      const fee = probateFee(value)
      return { amount: fee, breakdownBn: 'অনু. ১০ ধাপস্কেল (২০১০)', breakdownEn: 'Art. 10 stepped % (2010)', section35a: item.section35a }
    }
    case 'succession':
      return null
    case 'adValorem': {
      if (value == null) return null
      const fee = tableBMoney(value)
      return { amount: fee, breakdownBn: 'ছক খ (অর্থ) ২.৫% · সর্বোচ্চ ৫০,০০০৳', breakdownEn: 'Table B money 2.5% · cap 50,000', section35a: item.section35a }
    }
  }
}

export const COURT_FEE_SOURCE_BN =
  'কোর্ট ফি আইন ১৮৭০ তফসিল ১ ছক খ — এস. আর. ও. ৩২৬-Law/2010। পারিবারিক আরজি: পারিবারিক আদালত আইন ২০২৩ ধারা ২৫। নির্দেশক — পরবর্তী গেজেট মিলান।'
export const COURT_FEE_SOURCE_EN =
  'Court Fees Act 1870 Sch. I Table B — S.R.O. 326-Law/2010. Family plaint: Family Courts Act 2023 s.25. Indicative — check later gazettes.'
