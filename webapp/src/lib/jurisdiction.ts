/**
 * Jurisdiction — Bangladesh only.
 * Law pack: BD. UI language: bn | en (orthogonal to content).
 * Payment rail: ZiniPay hosted invoice on the website.
 */

export type JurisdictionCode = 'BD'
export type UiLanguage = 'bn' | 'en'
export type PaymentRail = 'zinipay_web' | 'sslcommerz_web' | 'ads_only'

export const JURISDICTIONS: JurisdictionCode[] = ['BD']
export const UI_LANGUAGES: UiLanguage[] = ['bn', 'en']

export interface JurisdictionMeta {
  code: JurisdictionCode
  nameEn: string
  nameNative: string
  flag: string
  paymentRail: PaymentRail
  guideVideoKey: 'guide_bd'
  guideMayMentionWebPay: boolean
  bdOnlyTools: boolean
}

export const JURISDICTION_META: Record<JurisdictionCode, JurisdictionMeta> = {
  BD: {
    code: 'BD',
    nameEn: 'Bangladesh',
    nameNative: 'বাংলাদেশ',
    flag: '🇧🇩',
    paymentRail: 'zinipay_web',
    guideVideoKey: 'guide_bd',
    guideMayMentionWebPay: true,
    bdOnlyTools: true,
  },
}

export function isJurisdiction(v: unknown): v is JurisdictionCode {
  return v === 'BD'
}

export function isUiLanguage(v: unknown): v is UiLanguage {
  return v === 'bn' || v === 'en'
}

export function paymentRailFor(_code: JurisdictionCode): PaymentRail {
  return 'zinipay_web'
}

/** YouTube watch/embed/short URL → embed src. Empty if not a verified YouTube id. */
export function youtubeEmbedSrc(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  try {
    const u = new URL(trimmed)
    const host = u.hostname.replace(/^www\./, '')
    let id = ''
    if (host === 'youtu.be') {
      id = u.pathname.replace(/^\//, '').split('/')[0] ?? ''
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2] ?? ''
      else id = u.searchParams.get('v') ?? ''
    }
    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return ''
    return `https://www.youtube.com/embed/${id}`
  } catch {
    return ''
  }
}

export function guideVideoEmbedUrl(_code: JurisdictionCode): string {
  const embed = process.env.NEXT_PUBLIC_GUIDE_BD_EMBED?.trim() || ''
  if (embed) return youtubeEmbedSrc(embed)
  return youtubeEmbedSrc(process.env.GUIDE_BD_URL?.trim() || '')
}

export function playStoreUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ||
    'https://play.google.com/store/apps/details?id=com.mamlaq.app'
  )
}
