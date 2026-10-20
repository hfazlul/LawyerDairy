import type { SubscriptionPackage } from '@prisma/client'
import { PACKAGE_DEFS, isSellablePackage } from './plans'

export type PackagePeriod = 'free' | 'month' | 'year'

export type MobilePackageDto = {
  code: string
  nameBn: string
  nameEn: string
  priceBdt: number
  yearlyBdt: number | null
  features: string[]
  period: PackagePeriod
  smsMonthly: number
  smsYearly: number
  teamSeats: number
  autoHearingSms: boolean
  careerFull: boolean
  adsOff: boolean
  active: boolean
}

const FALLBACK: MobilePackageDto[] = PACKAGE_DEFS.filter(
  (p) => p.code === 'FREE' || isSellablePackage(p.code),
).map((p) => ({
  code: p.code,
  nameBn: p.nameBn,
  nameEn: p.nameEn,
  priceBdt: p.priceBdt,
  yearlyBdt: p.yearlyBdt,
  features: p.featuresJson,
  period: p.priceBdt <= 0 ? 'free' : 'month',
  smsMonthly: p.smsMonthly,
  smsYearly: p.smsYearly,
  teamSeats: p.teamSeats,
  autoHearingSms: p.autoHearingSms,
  careerFull: p.careerFull,
  adsOff: p.adsOff,
  active: p.active,
}))

export function packagePeriod(code: string, priceBdt: number): PackagePeriod {
  if (code === 'FREE' || priceBdt <= 0) return 'free'
  return 'month'
}

export function featuresOf(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x))
  return []
}

/** Play APK catalog — never include a chargeable checkoutUrl. */
export function toMobilePackageDto(row: SubscriptionPackage): MobilePackageDto {
  return {
    code: row.code,
    nameBn: row.nameBn,
    nameEn: row.nameEn,
    priceBdt: row.priceBdt,
    yearlyBdt: row.yearlyBdt,
    features: featuresOf(row.featuresJson),
    period: packagePeriod(row.code, row.priceBdt),
    smsMonthly: row.smsMonthly,
    smsYearly: row.smsYearly,
    teamSeats: row.teamSeats,
    autoHearingSms: row.autoHearingSms,
    careerFull: row.careerFull,
    adsOff: row.adsOff,
    active: row.active,
  }
}

export function mobileCatalogFromRows(rows: SubscriptionPackage[]): MobilePackageDto[] {
  const mapped = rows
    .filter((r) => r.active && (r.code === 'FREE' || isSellablePackage(r.code)))
    .map(toMobilePackageDto)
    .sort((a, b) => {
      const order = ['FREE', 'STARTER', 'PRO', 'PRO_ADVANCE', 'ADVANCE']
      return order.indexOf(a.code) - order.indexOf(b.code)
    })
  return mapped.length ? mapped : FALLBACK
}

export function fallbackMobileCatalog(): MobilePackageDto[] {
  return FALLBACK
}

export function webSellableFromRows(rows: SubscriptionPackage[]) {
  return rows
    .filter((r) => r.active && isSellablePackage(r.code))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}
