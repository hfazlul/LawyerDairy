import { publicAppUrlFromEnv } from './env-aliases'

/** Browser site and ZiniPay brand host. Not the phone API host. */
export const MAMLAQ_PUBLIC_SITE = 'https://mamlaq.com'

const VPS_HTTP_HOST = '187.77.153.28'

function isLoopback(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

/**
 * Loopback stays (local dev). The bare VPS IP and any mamlaq host become https://mamlaq.com.
 * Empty or unparseable values return ''.
 */
export function coercePublicSite(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '')
  if (!trimmed) return ''
  try {
    const u = new URL(trimmed)
    if (isLoopback(u.hostname)) return `${u.protocol}//${u.host}`
    if (u.hostname === VPS_HTTP_HOST || u.hostname === 'mamlaq.com' || u.hostname === 'www.mamlaq.com') {
      return MAMLAQ_PUBLIC_SITE
    }
    return `${u.protocol}//${u.host}`
  } catch {
    return ''
  }
}

/** Public origin for ZiniPay redirect_url / cancel_url / webhook_url and mail links. */
export function appBaseUrl(reqUrl?: string): string {
  const fromEnv = coercePublicSite(publicAppUrlFromEnv())
  if (fromEnv) return fromEnv
  const web = coercePublicSite(process.env.PUBLIC_WEB_URL || '')
  if (web) return web
  if (reqUrl) {
    try {
      const u = new URL(reqUrl)
      if (isLoopback(u.hostname)) return `${u.protocol}//${u.host}`
    } catch {
      /* ignore */
    }
  }
  return MAMLAQ_PUBLIC_SITE
}

/** True when checkout redirects will use localhost (ZiniPay brand-domain mismatch risk). */
export function checkoutRedirectIsLocalhost(origin: string): boolean {
  try {
    const host = new URL(origin).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return true
  }
}
