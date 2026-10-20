import { publicAppUrlFromEnv } from './env-aliases'

/** Public origin for redirects (ZiniPay return, mail links). */
export function appBaseUrl(reqUrl?: string): string {
  const fromEnv = publicAppUrlFromEnv()
  if (fromEnv) return fromEnv
  if (reqUrl) {
    try {
      const u = new URL(reqUrl)
      return `${u.protocol}//${u.host}`
    } catch {
      /* ignore */
    }
  }
  return 'http://localhost:3000'
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
