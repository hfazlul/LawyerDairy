import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/jwt'
import { rateLimit, clientIp } from '@/lib/rate-limit'

/**
 * Web auth choice:
 * - Mobile: phone OTP (existing /api/mobile/v1/auth/otp/*)
 * - Web dashboard: email + password (this module) — same User/Chamber models
 * Optional later: link phone after signup for mobile sync.
 *
 * Progressive enhancement: native HTML form POST → Set-Cookie + 303 redirect
 * (same pattern as logout). JSON fetch still supported for API clients.
 */

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().email('Enter a valid email').transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .min(11, 'Phone must be at least 11 digits (e.g. 017XXXXXXXX)')
    .max(20),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  jurisdiction: z.enum(['BD', 'PK', 'IN']).optional(),
  uiLanguage: z.enum(['bn', 'en', 'ur']).optional(),
})

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email').transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
  next: z.string().optional(),
})

function zodMessage(err: unknown): string {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message || 'Invalid input'
  }
  return 'Invalid input'
}

function isDev(): boolean {
  return process.env.NODE_ENV === 'development'
}

/** Form POSTs and browsers sending Accept: text/html get redirects, not JSON. */
function wantsHtmlRedirect(req: NextRequest, contentType: string): boolean {
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    return true
  }
  const accept = req.headers.get('accept') || ''
  return accept.includes('text/html')
}

async function readBodyObject(req: NextRequest): Promise<Record<string, unknown>> {
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const json = await req.json()
    return json && typeof json === 'object' ? (json as Record<string, unknown>) : {}
  }
  const fd = await req.formData()
  const out: Record<string, unknown> = {}
  fd.forEach((value, key) => {
    if (typeof value === 'string') out[key] = value
  })
  return out
}

function safeNextPath(raw: unknown, fallback = '/dashboard'): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
    return fallback
  }
  return raw
}

function redirectWithError(req: NextRequest, path: string, message: string) {
  const url = new URL(path, req.url)
  url.searchParams.set('error', message)
  return NextResponse.redirect(url, 303)
}

async function issueTokens(userId: string) {
  const accessToken = signJwt({ sub: userId }, '15m')
  const refreshToken = signJwt({ sub: userId, typ: 'refresh' }, '30d')
  await prisma.session.create({
    data: {
      userId,
      refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  return { accessToken, refreshToken }
}

/** Localhost HTTP needs Secure=false; only enable Secure in production HTTPS. */
function authCookieBase() {
  const secure =
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production')
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
  }
}

function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  const base = authCookieBase()
  res.cookies.set('ldb_access', accessToken, {
    ...base,
    maxAge: 15 * 60,
  })
  res.cookies.set('ldb_refresh', refreshToken, {
    ...base,
    maxAge: 30 * 24 * 60 * 60,
  })
}

/** Must mirror setAuthCookies attrs or browsers keep the old cookie. */
function clearAuthCookies(res: NextResponse) {
  const base = authCookieBase()
  res.cookies.set('ldb_access', '', { ...base, maxAge: 0 })
  res.cookies.set('ldb_refresh', '', { ...base, maxAge: 0 })
}

function authFail(
  req: NextRequest,
  wantsHtml: boolean,
  backPath: string,
  message: string,
  status: number,
) {
  if (wantsHtml) return redirectWithError(req, backPath, message)
  return NextResponse.json({ message }, { status })
}

export async function POST_signup(req: NextRequest) {
  const ip = clientIp(req.headers)
  const contentType = req.headers.get('content-type') || ''
  const wantsHtml = wantsHtmlRedirect(req, contentType)

  if (!isDev()) {
    const rl = rateLimit(`signup:${ip}`, 10, 60_000)
    if (!rl.ok) {
      return authFail(req, wantsHtml, '/signup', 'Rate limited — try again in a minute', 429)
    }
  }

  let raw: Record<string, unknown>
  try {
    raw = await readBodyObject(req)
  } catch {
    return authFail(req, wantsHtml, '/signup', 'Invalid form body', 400)
  }

  let body: z.infer<typeof signupSchema>
  try {
    body = signupSchema.parse(raw)
  } catch (err) {
    return authFail(req, wantsHtml, '/signup', zodMessage(err), 400)
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: body.email }, { phone: body.phone }] },
  })
  if (existing) {
    return authFail(req, wantsHtml, '/signup', 'Email বা ফোন ইতিমধ্যে ব্যবহৃত', 409)
  }

  const passwordHash = await bcrypt.hash(body.password, 12)
  const jurisdiction = body.jurisdiction ?? 'BD'
  const uiLanguage = body.uiLanguage ?? 'bn'

  let user: { id: string; name: string; email: string | null; appRole: string }
  try {
    user = await prisma.$transaction(async (tx) => {
      const chamber = await tx.chamber.create({
        data: {
          name: `${body.name} এর চেম্বার`,
          plan: 'FREE',
          jurisdiction,
          jurisdictionConfirmed: Boolean(body.jurisdiction),
        },
      })
      return tx.user.create({
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          passwordHash,
          chamberId: chamber.id,
          appRole: 'USER',
          role: 'OWNER',
          uiLanguage,
        },
      })
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return authFail(req, wantsHtml, '/signup', 'Email বা ফোন ইতিমধ্যে ব্যবহৃত', 409)
    }
    console.error('signup failed', err)
    return authFail(req, wantsHtml, '/signup', 'Signup failed — try again', 500)
  }

  const tokens = await issueTokens(user.id)
  await prisma.loginAttempt.create({
    data: { userId: user.id, email: body.email, ip, success: true },
  })

  if (wantsHtml) {
    const res = NextResponse.redirect(new URL('/dashboard', req.url), 303)
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken)
    return res
  }

  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, appRole: user.appRole },
  })
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken)
  return res
}

export async function POST_login(req: NextRequest) {
  const ip = clientIp(req.headers)
  const contentType = req.headers.get('content-type') || ''
  const wantsHtml = wantsHtmlRedirect(req, contentType)

  if (!isDev()) {
    const rl = rateLimit(`login:${ip}`, 20, 60_000)
    if (!rl.ok) {
      return authFail(req, wantsHtml, '/login', 'Rate limited — try again in a minute', 429)
    }
  }

  // Brute-force: block IP after 20 fails / 15 min (skip in development)
  if (!isDev()) {
    const fails = await prisma.loginAttempt.count({
      where: {
        ip,
        success: false,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    })
    if (fails >= 20) {
      return authFail(req, wantsHtml, '/login', 'Temporarily locked — try again later', 429)
    }
  }

  let raw: Record<string, unknown>
  try {
    raw = await readBodyObject(req)
  } catch {
    return authFail(req, wantsHtml, '/login', 'Invalid form body', 400)
  }

  let body: z.infer<typeof loginSchema>
  try {
    body = loginSchema.parse(raw)
  } catch (err) {
    return authFail(req, wantsHtml, '/login', zodMessage(err), 400)
  }

  const nextPath = safeNextPath(body.next, '/dashboard')

  const user = await prisma.user.findUnique({ where: { email: body.email } })
  const ok =
    user?.passwordHash &&
    (await bcrypt.compare(body.password, user.passwordHash))

  await prisma.loginAttempt.create({
    data: {
      userId: user?.id,
      email: body.email,
      ip,
      success: Boolean(ok),
    },
  })

  if (!ok || !user) {
    if (wantsHtml) {
      const url = new URL('/login', req.url)
      if (nextPath !== '/dashboard') url.searchParams.set('next', nextPath)
      url.searchParams.set('error', 'ভুল ইমেইল বা পাসওয়ার্ড')
      return NextResponse.redirect(url, 303)
    }
    return NextResponse.json({ message: 'ভুল ইমেইল বা পাসওয়ার্ড' }, { status: 401 })
  }

  const tokens = await issueTokens(user.id)
  const dest =
    user.appRole === 'ADMIN' && nextPath === '/dashboard' ? '/admin' : nextPath

  if (wantsHtml) {
    const res = NextResponse.redirect(new URL(dest, req.url), 303)
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken)
    return res
  }

  const res = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      appRole: user.appRole,
      chamberId: user.chamberId,
    },
  })
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken)
  return res
}

export async function POST_logout(req: NextRequest) {
  const refresh = req.cookies.get('ldb_refresh')?.value
  if (refresh) {
    await prisma.session.deleteMany({ where: { refreshToken: refresh } }).catch(() => undefined)
  }

  // Form navigations need 303→GET /login; fetch clients still get JSON.
  const wantsHtml = (req.headers.get('accept') || '').includes('text/html')
  const res = wantsHtml
    ? NextResponse.redirect(new URL('/login', req.url), 303)
    : NextResponse.json({ ok: true })
  clearAuthCookies(res)
  return res
}
