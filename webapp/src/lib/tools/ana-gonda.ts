const ANA = 1 / 16
const GANDA = 1 / 320
const KORA = 1 / 1280
const KRANTI = 1 / 3840
const TIL = 1 / 76800
export const SQFT_PER_DECIMAL = 435.6

export type AnaGondaShare = { ana?: number; ganda?: number; kora?: number; kranti?: number; til?: number }

export function anaGondaFraction(s: AnaGondaShare) {
  return (s.ana ?? 0) * ANA + (s.ganda ?? 0) * GANDA + (s.kora ?? 0) * KORA + (s.kranti ?? 0) * KRANTI + (s.til ?? 0) * TIL
}

export function shareFromAnaGonda(share: AnaGondaShare, totalShotok: number, kathaDecimal = 1.65) {
  const fraction = anaGondaFraction(share)
  const shotok = totalShotok * fraction
  const kathaRate = kathaDecimal <= 0 ? 1.65 : kathaDecimal
  return {
    fraction,
    shotok,
    katha: shotok / kathaRate,
    bigha: shotok / (20 * kathaRate),
    acre: shotok / 100,
    sqft: shotok * SQFT_PER_DECIMAL,
  }
}

export function khatianShare(totalShotok: number, num: number, den: number, kathaDecimal = 1.65) {
  if (!den) return null
  const share = (totalShotok * num) / den
  const kathaRate = kathaDecimal <= 0 ? 1.65 : kathaDecimal
  return {
    shotok: share,
    katha: share / kathaRate,
    bigha: share / (20 * kathaRate),
    acre: share / 100,
  }
}

export const ANA_GONDA_TABLE: [string, string, string][] = [
  ['১ সম্পূর্ণ', '১৬ আনা', '1'],
  ['১ আনা', '২০ গন্ডা', '1/16'],
  ['১ গন্ডা', '৪ কড়া', '1/320'],
  ['১ কড়া', '৩ ক্রান্তি', '1/1280'],
  ['১ ক্রান্তি', '২০ তিল', '1/3840'],
  ['১ তিল', '—', '1/76800'],
]
