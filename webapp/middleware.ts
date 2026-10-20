import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, clientIp } from './lib/edge-rate-limit'

const AUTH_API_PREFIXES = ['/api/auth', '/api/mobile/v1/auth', '/api/admin/auth']
const ADMIN_NOTICE = 'mq_admin_notice'

function noticeCookie(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/hfazlul',
    maxAge,
  }
}

/** Admin auth URLs stay path-only. `next` and `error` are not left in the address bar. */
function adminAuthUrl(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl
  if (pathname !== '/hfazlul/login' && pathname !== '/hfazlul/signup') return null
  const url = req.nextUrl.clone()
  if (url.searchParams.has('next') || url.searchParams.has('error')) {
    const error = url.searchParams.get('error')
    url.searchParams.delete('next')
    url.searchParams.delete('error')
    const res = NextResponse.redirect(url)
    if (error) res.cookies.set(ADMIN_NOTICE, error.slice(0, 200), noticeCookie(30))
    return res
  }
  const notice = req.cookies.get(ADMIN_NOTICE)?.value
  if (!notice) return null
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-admin-notice', encodeURIComponent(notice.slice(0, 200)))
  const res = NextResponse.next({ request: { headers: requestHeaders } })
  res.cookies.set(ADMIN_NOTICE, '', noticeCookie(0))
  return res
}

function applySecurityHeaders(res: NextResponse) {
  const isDev = process.env.NODE_ENV === 'development'
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com"
    : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com"
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; ${scriptSrc}; frame-src https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com; connect-src 'self' https: https://www.google-analytics.com https://www.googletagmanager.com; frame-ancestors 'none'`,
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
  const limit = isAuthApi
    ? Number(process.env.RATE_LIMIT_AUTH_PER_MIN || 60)
    : Number(process.env.RATE_LIMIT_API_PER_MIN || 120)

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

  const gated = adminAuthUrl(req)
  if (gated) return applySecurityHeaders(gated)

  const adminPublic = pathname === '/hfazlul/login' || pathname === '/hfazlul/signup'
  if (pathname.startsWith('/hfazlul') && !adminPublic) {
    const token = req.cookies.get('mq_admin')?.value
    if (!token) {
      const login = req.nextUrl.clone()
      login.pathname = '/hfazlul/login'
      login.search = ''
      return applySecurityHeaders(NextResponse.redirect(login))
    }
  }

  if (pathname === '/user' || pathname.startsWith('/user/')) {
    const publicUser =
      pathname === '/user/login' || pathname === '/user/signup' || pathname === '/user/forgot'
    if (!publicUser && !req.cookies.get('ldb_access')?.value) {
      const login = new URL('/user/login', req.url)
      login.searchParams.set('next', pathname)
      return applySecurityHeaders(NextResponse.redirect(login))
    }
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('ldb_access')?.value || req.cookies.get('mq_admin')?.value
    if (!token) {
      const login = req.nextUrl.clone()
      login.pathname = pathname.startsWith('/admin') ? '/hfazlul/login' : '/user/login'
      login.search = pathname.startsWith('/admin') ? '' : `next=${encodeURIComponent(pathname)}`
      return applySecurityHeaders(NextResponse.redirect(login))
    }
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    // Mobile login posts a JSON body. Middleware on that path was swallowing
    // the body, so the route never answered and the phone button kept spinning.
    '/api/((?!mobile/v1/auth).*)',
    '/admin/:path*',
    '/dashboard/:path*',
    '/user',
    '/user/:path*',
    '/hfazlul',
    '/hfazlul/:path*',
    '/login',
    '/signup',
  ],
}
