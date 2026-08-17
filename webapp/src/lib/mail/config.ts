import type { MailFromKind, MailProviderName } from './types'

const DEFAULT_DOMAIN = 'lawyerdiarybd.com'

export function mailDomain(): string {
  return (process.env.MAIL_DOMAIN || DEFAULT_DOMAIN).trim()
}

export function hasBrevoKey(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim())
}

export function hasResendKey(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim())
}

export function mailDailyLimit(): number {
  const n = Number(process.env.MAIL_DAILY_LIMIT || 300)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 300
}

/** EMAIL_PROVIDER=brevo|resend|auto (default auto). */
export function emailProviderMode(): 'brevo' | 'resend' | 'auto' {
  const v = (process.env.EMAIL_PROVIDER || 'auto').trim().toLowerCase()
  if (v === 'brevo' || v === 'resend' || v === 'auto') return v
  return 'auto'
}

export function emailPrimary(): MailProviderName {
  const v = (process.env.EMAIL_PRIMARY || 'brevo').trim().toLowerCase()
  return v === 'resend' ? 'resend' : 'brevo'
}

export function emailFallback(): MailProviderName {
  const v = (process.env.EMAIL_FALLBACK || 'resend').trim().toLowerCase()
  return v === 'brevo' ? 'brevo' : 'resend'
}

const DEFAULT_FROM: Record<MailFromKind, string> = {
  deals: `Lawyer Diary BD <deals@${DEFAULT_DOMAIN}>`,
  noreply: `Lawyer Diary BD <noreply@${DEFAULT_DOMAIN}>`,
  support: `Lawyer Diary BD <support@${DEFAULT_DOMAIN}>`,
}

export function resolveFromAddress(kind: MailFromKind = 'noreply'): string {
  const envMap: Record<MailFromKind, string | undefined> = {
    deals: process.env.MAIL_FROM_DEALS,
    noreply: process.env.MAIL_FROM_NOREPLY || process.env.EMAIL_FROM,
    support: process.env.MAIL_FROM_SUPPORT,
  }
  const raw = envMap[kind]?.trim()
  if (raw) return raw
  const domain = mailDomain()
  if (domain === DEFAULT_DOMAIN) return DEFAULT_FROM[kind]
  return `Lawyer Diary BD <${kind}@${domain}>`
}

/** Parse `Name <email@domain>` or bare email into Brevo-style sender. */
export function parseFromAddress(from: string): { name: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (m) {
    return { name: m[1].trim() || 'Lawyer Diary BD', email: m[2].trim() }
  }
  return { name: 'Lawyer Diary BD', email: from.trim() }
}

export function providerHasKey(provider: MailProviderName): boolean {
  return provider === 'brevo' ? hasBrevoKey() : hasResendKey()
}

/**
 * Ordered list of providers to try for this send.
 * Forced provider → single item; mode=brevo|resend → that only; auto → primary then fallback.
 */
export function resolveProviderOrder(forced?: MailProviderName): MailProviderName[] {
  if (forced) return [forced]
  const mode = emailProviderMode()
  if (mode === 'brevo') return ['brevo']
  if (mode === 'resend') return ['resend']
  const primary = emailPrimary()
  const fallback = emailFallback()
  if (primary === fallback) return [primary]
  return [primary, fallback]
}
