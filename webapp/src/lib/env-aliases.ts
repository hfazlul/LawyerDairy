/**
 * Read first non-placeholder env among aliases.
 * Never log values. Comments in .env are not loaded by Node — named vars only.
 */

const PLACEHOLDER =
  /your-sms-api-key|your-sms-api|sms-gateway\.com|change-me|your-cloudflare|your-r2|your-store/i

export function envTrim(name: string): string {
  return (process.env[name] || '').trim()
}

export function looksPlaceholder(value: string): boolean {
  if (!value) return true
  return PLACEHOLDER.test(value)
}

export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

/** Key pasted into a URL-named var (common sms.net.bd mix-up). */
export function looksLikeKeyNotUrl(value: string): boolean {
  if (!value || looksPlaceholder(value) || looksLikeUrl(value)) return false
  if (/\s/.test(value)) return false
  return value.length >= 16
}

export function firstConfigured(names: readonly string[]): string {
  for (const n of names) {
    const v = envTrim(n)
    if (v && !looksPlaceholder(v)) return v
  }
  return ''
}

export const ZINIPAY_KEY_ALIASES = [
  'ZINIPAY_API_KEY',
  'ZINI_API_KEY',
  'ZINIPAY_KEY',
  'ZINI_PAY_API_KEY',
  'ZINIPAY_SECRET',
  'ZINI_PAY_KEY',
  'ZINIPAY_TOKEN',
] as const

export const PUBLIC_URL_ALIASES = [
  'PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_URL',
  'APP_URL',
  'SITE_URL',
] as const

export const SMS_NET_BD_KEY_ALIASES = [
  'SMS_NET_BD_API_KEY',
  'SMS_NETBD_API_KEY',
  'SMSNET_BD_API_KEY',
  'SMS_NET_API_KEY',
  'SMSNET_API_KEY',
] as const

export const BULKSMS24_KEY_ALIASES = [
  'BULKSMS24_API_KEY',
  'BULKSMS_24_API_KEY',
  'BULK_SMS24_API_KEY',
  'SMS_24BULK_API_KEY',
  'BULKSMSBD_API_KEY',
  'SMS24_API_KEY',
  'SMS_FAILOVER_KEY',
  'BULK_SMS_API_KEY',
] as const

export function zinipayApiKeyFromEnv(): string {
  return firstConfigured(ZINIPAY_KEY_ALIASES)
}

export function publicAppUrlFromEnv(): string {
  return firstConfigured(PUBLIC_URL_ALIASES).replace(/\/$/, '')
}

export function smsNetBdUrlFromEnv(): string {
  const explicit = firstConfigured(['SMS_NET_BD_URL', 'SMS_NETBD_URL', 'SMSNET_BD_URL'])
  if (explicit && looksLikeUrl(explicit)) return explicit.replace(/\/$/, '')
  const primary = envTrim('SMS_API_URL')
  if (looksLikeUrl(primary) && /sms\.net\.bd/i.test(primary) && !looksPlaceholder(primary)) {
    return primary.replace(/\/$/, '')
  }
  return 'https://api.sms.net.bd/sendsms'
}

export function smsNetBdKeyFromEnv(): string {
  const named = firstConfigured(SMS_NET_BD_KEY_ALIASES)
  if (named) return named
  const url = envTrim('SMS_API_URL')
  const key = envTrim('SMS_API_KEY')
  if (looksLikeKeyNotUrl(url)) return url
  if (/sms\.net\.bd/i.test(url) && key && !looksPlaceholder(key)) return key
  if (looksPlaceholder(url) && looksLikeKeyNotUrl(key)) return key
  return ''
}

/** Different text per recipient. The same-text endpoint is not used. */
export const BULKSMS24_DYNAMIC_URL = 'https://www.24bulksmsbd.com/api/DynamicSMSApi'

export function bulkSms24UrlFromEnv(): string {
  const named = firstConfigured(['BULKSMS24_URL', 'SMS_FAILOVER_URL', 'BULKSMSBD_URL', 'SMS24_URL'])
  if (named && looksLikeUrl(named) && /DynamicSMSApi/i.test(named)) return named.replace(/\/$/, '')
  return BULKSMS24_DYNAMIC_URL
}

/** Single/Multiple endpoint. The provider asked for OTP to go here, one number per call. */
export const BULKSMS24_SINGLE_URL = 'https://www.24bulksmsbd.com/api/smsSendApi'

export function bulkSms24SingleUrlFromEnv(): string {
  const named = firstConfigured(['BULKSMS24_URL', 'SMS_FAILOVER_URL', 'BULKSMSBD_URL', 'SMS24_URL'])
  if (named && looksLikeUrl(named) && /smsSendApi/i.test(named)) return named.replace(/\/$/, '')
  return BULKSMS24_SINGLE_URL
}

export function bulkSms24KeyFromEnv(): string {
  return firstConfigured(BULKSMS24_KEY_ALIASES)
}

/** Names that still need a real value (never the value). */
export function missingSecretNames(): string[] {
  const missing: string[] = []
  if (!zinipayApiKeyFromEnv()) missing.push('ZINIPAY_API_KEY')
  if (!smsNetBdKeyFromEnv()) missing.push('SMS_NET_BD_API_KEY')
  if (!bulkSms24KeyFromEnv()) missing.push('BULKSMS24_API_KEY')
  return missing
}
