import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, clientIp } from './lib/edge-rate-limit'

/** Strict bucket for auth *API* only — never HTML /login|/signup (RSC/HMR burns the budget). */
const AUTH_API_PREFIXES = ['/api/auth', '/api/mobile/v1/auth']

function applySecurityHeaders(res: NextResponse) {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-src https://www.youtube.com https://youtube.com; connect-src 'self' https:",
  )
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  return res
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = clientIp(req.headers)
  const isDev = process.env.NODE_ENV === 'development'

  const isAuthApi = AUTH_API_PREFIXES.some((p) => pathname.startsWith(p))
  const isApi = pathname.startsWith('/api/')
  // Auth APIs: higher default — login page polls + retries must not lock users out in dev.
  const limit = isAuthApi
    ? Number(process.env.RATE_LIMIT_AUTH_PER_MIN || 60)
    : Number(process.env.RATE_LIMIT_API_PER_MIN || 120)

  // Never rate-limit auth in development (page reloads / form retries must not 429).
  if (!isDev && (isAuthApi || isApi)) {
    const rl = rateLimit(`${ip}:${isAuthApi ? 'auth' : 'api'}`, limit, 60_000)
    if (!rl.ok) {
      const res = NextResponse.json(
        { message: 'Too many requests — একটু পরে চেষ্টা করুন' },
        { status: 429 },
      )
      res.headers.set('Retry-After', String(Math.ceil((rl.resetAt - Date.now()) / 1000)))
      return applySecurityHeaders(res)
    }
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('ldb_access')?.value
    if (!token) {
      const login = new URL('/login', req.url)
      login.searchParams.set('next', pathname)
      return applySecurityHeaders(NextResponse.redirect(login))
    }
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    // Keep login/signup for security headers only (no rate limit on HTML).
    '/login',
    '/signup',
  ],
}
