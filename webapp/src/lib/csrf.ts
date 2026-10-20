import { NextRequest } from 'next/server'
import { publicAppUrlFromEnv } from './env-aliases'

/** Same-origin mutating requests only. Cookies are SameSite=Lax. */
export function originAllowed(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) {
    const sec = req.headers.get('sec-fetch-site')
    if (sec === 'same-origin' || sec === 'none' || !sec) return true
    return false
  }
  try {
    const o = new URL(origin)
    const host = req.headers.get('host') || ''
    if (o.host === host) return true
    const app = publicAppUrlFromEnv()
    if (app) return o.origin === new URL(app).origin
  } catch {
    return false
  }
  return false
}
