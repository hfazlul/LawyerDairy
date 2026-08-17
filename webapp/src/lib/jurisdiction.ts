/**
 * Jurisdiction × UI language (orthogonal) + payment rails.
 * Law packs: BD | PK | IN (IN = West Bengal/Tripura belt — one India pack).
 * UK skipped for now.
 */

export type JurisdictionCode = 'BD' | 'PK' | 'IN'
export type UiLanguage = 'bn' | 'en' | 'ur'
export type PaymentRail = 'sslcommerz_web' | 'play_billing' | 'ads_only'

export const JURISDICTIONS: JurisdictionCode[] = ['BD', 'PK', 'IN']
export const UI_LANGUAGES: UiLanguage[] = ['bn', 'en', 'ur']

export interface JurisdictionMeta {
  code: JurisdictionCode
  nameEn: string
  nameNative: string
  flag: string // emoji flag for UI
  paymentRail: PaymentRail
  /** Remote Config / env key for guide video */
  guideVideoKey: 'guide_bd' | 'guide_in' | 'guide_pk'
  /** Soft-mention web pay in guide video content? */
  guideMayMentionWebPay: boolean
  /** BD-only tools (খতিয়ান / warish) */
  bdOnlyTools: boolean
}

export const JURISDICTION_META: Record<JurisdictionCode, JurisdictionMeta> = {
  BD: {
    code: 'BD',
    nameEn: 'Bangladesh',
    nameNative: 'বাংলাদেশ',
    flag: '🇧🇩',
    paymentRail: 'sslcommerz_web',
    guideVideoKey: 'guide_bd',
    guideMayMentionWebPay: true,
    bdOnlyTools: true,
  },
  PK: {
    code: 'PK',
    nameEn: 'Pakistan',
    nameNative: 'پاکستان',
    flag: '🇵🇰',
    paymentRail: 'play_billing',
    guideVideoKey: 'guide_pk',
    guideMayMentionWebPay: false,
    bdOnlyTools: false,
  },
  IN: {
    code: 'IN',
    nameEn: 'India (WB/Tripura)',
    nameNative: 'भारत',
    flag: '🇮🇳',
    paymentRail: 'play_billing',
    guideVideoKey: 'guide_in',
    guideMayMentionWebPay: false,
    bdOnlyTools: false,
  },
}

export function isJurisdiction(v: unknown): v is JurisdictionCode {
  return v === 'BD' || v === 'PK' || v === 'IN'
}

export function isUiLanguage(v: unknown): v is UiLanguage {
  return v === 'bn' || v === 'en' || v === 'ur'
}

export function paymentRailFor(code: JurisdictionCode): PaymentRail {
  return JURISDICTION_META[code].paymentRail
}

/** Soft multi-signal suggest — never auto-apply. User must confirm. */
export function suggestJurisdiction(hints: {
  timezone?: string | null
  acceptLanguage?: string | null
  countryHeader?: string | null
}): JurisdictionCode {
  const tz = (hints.timezone || '').toLowerCase()
  const al = (hints.acceptLanguage || '').toLowerCase()
  const cc = (hints.countryHeader || '').toUpperCase()

  if (cc === 'BD' || tz.includes('dhaka') || al.startsWith('bn-bd')) return 'BD'
  if (cc === 'PK' || tz.includes('karachi') || al.startsWith('ur')) return 'PK'
  if (cc === 'IN' || tz.includes('kolkata') || tz.includes('calcutta')) return 'IN'
  if (al.startsWith('bn')) return 'BD' // Bangla often BD; still requires confirm
  return 'BD'
}

export function guideVideoEmbedUrl(code: JurisdictionCode): string {
  const meta = JURISDICTION_META[code]
  const envKey = `NEXT_PUBLIC_${meta.guideVideoKey.toUpperCase()}_EMBED`
  const fromEnv = process.env[envKey]?.trim()
  if (fromEnv) return fromEnv
  // Fallback placeholders (YouTube embed) — replace per jurisdiction in env
  const defaults: Record<string, string> = {
    guide_bd: process.env.NEXT_PUBLIC_GUIDE_BD_EMBED || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    guide_in: process.env.NEXT_PUBLIC_GUIDE_IN_EMBED || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    guide_pk: process.env.NEXT_PUBLIC_GUIDE_PK_EMBED || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  }
  return defaults[meta.guideVideoKey]
}

export function playStoreUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ||
    'https://play.google.com/store/apps/details?id=com.lawyerdiary.bd'
  )
}
