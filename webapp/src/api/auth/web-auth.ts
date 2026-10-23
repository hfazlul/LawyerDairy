import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/jwt'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import {
  isValidUsername,
  kLoginEmptyMessage,
  kLoginUnknownMessage,
  kLoginWrongPasswordMessage,
  kSignupEmailRequired,
  kSignupPhoneError,
  normalizeBdPhone,
  signupEmailIssue,
  signupNameIssue,
  signupPasswordIssue,
  signupPhoneIssue,
  signupReferralIssue,
  suggestUsername,
  takenAccountMessage,
} from '@/lib/identity'
import {
  createPersonalWorkspace,
  hashPassword,
  issueSession,
  revokeSessionByRefreshToken,
  verifyPassword,
} from '@/lib/auth/session'
import { collapseName, findActiveUsersByName, nameAmbiguousMessageBn, nameTakenMessageBn } from '@/lib/auth/login-name'
import { freeUsername, SignupConflict, signupConflictMessage } from '@/lib/auth/signup-guard'
import {
  logAuthFailure,
  signupFailureMessage,
  signingSecretMissing,
} from '@/lib/auth/signup-failure'
import { applyReferralCode } from '@/lib/referral'

class NameTakenError extends Error {}

/**
 * Web dashboard auth — same User/Workspace model as mobile.
 * Login: name (phone or username still accepted) + password.
 * Signup: name, phone, required email, password. Username is generated server-side.
 * Username is generated server-side. No OTP.
 */

const signupSchema = z.object({
  name: z.string().trim().max(120).optional().default(''),
  username: z.string().trim().min(4).max(24).optional(),
  email: z.string({ required_error: kSignupEmailRequired }).trim().min(1, kSignupEmailRequired).max(200),
  phone: z.string().trim().max(32).optional().default(''),
  password: z.string().max(128).optional().default(''),
  confirmPassword: z.string().max(128).optional(),
  uiLanguage: z.enum(['bn', 'en']).optional(),
  acceptedTerms: z.union([z.boolean(), z.string()]).optional(),
  referralCode: z.string().trim().max(32).optional().or(z.literal('')),
})

const loginSchema = z.object({
  identifier: z.string().trim().optional().default(''),
  email: z.string().trim().optional(),
  username: z.string().trim().optional(),
  password: z.string().optional().default(''),
  next: z.string().optional(),
})

function zodMessage(err: unknown): string {
  if (err instanceof z.ZodError) return err.issues[0]?.message || 'Invalid input'
  return 'Invalid input'
}

function isDev(): boolean {
  return process.env.NODE_ENV === 'development'
}

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

function safeNextPath(raw: unknown, fallback = '/user'): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
    return fallback
  }
  if (raw.startsWith('/hfazlul') || raw.startsWith('/admin')) return '/user'
  return raw
}

function redirectWithError(req: NextRequest, path: string, message: string) {
  const url = sameOriginUrl(req, path)
  url.searchParams.set('error', message)
  return NextResponse.redirect(url, 303)
}

/** Stay on the host the browser used. req.url and nextUrl are often localhost. */
function sameOriginUrl(req: NextRequest, path: string) {
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim()
  const proto = (req.headers.get('x-forwarded-proto') || 'http').split(',')[0].trim()
  const base = host ? `${proto}://${host}` : req.nextUrl.origin
  return new URL(path, base)
}

/** Secure cookies are dropped by browsers on plain HTTP, so a production VPS
 *  on http:// would set a session and then look logged out. */
function requestIsHttps(req: NextRequest): boolean {
  const forwarded = (req.headers.get('x-forwarded-proto') || '').split(',')[0].trim().toLowerCase()
  if (forwarded === 'https') return true
  if (forwarded === 'http') return false
  return req.nextUrl.protocol === 'https:'
}

function authCookieBase(req: NextRequest) {
  const secure = process.env.COOKIE_SECURE === 'false' ? false : requestIsHttps(req)
  return { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' }
}

function setAuthCookies(req: NextRequest, res: NextResponse, accessToken: string, refreshToken: string) {
  const base = authCookieBase(req)
  res.cookies.set('ldb_access', accessToken, { ...base, maxAge: 15 * 60 })
  res.cookies.set('ldb_refresh', refreshToken, { ...base, maxAge: 30 * 24 * 60 * 60 })
}

function clearAuthCookies(req: NextRequest, res: NextResponse) {
  const base = authCookieBase(req)
  res.cookies.set('ldb_access', '', { ...base, maxAge: 0 })
  res.cookies.set('ldb_refresh', '', { ...base, maxAge: 0 })
}

function authFail(req: NextRequest, wantsHtml: boolean, backPath: string, message: string, status: number) {
  if (wantsHtml) return redirectWithError(req, backPath, message)
  return NextResponse.json({ message }, { status })
}

function signupCaught(req: NextRequest, wantsHtml: boolean, err: unknown) {
  if (err instanceof SignupConflict) {
    return authFail(req, wantsHtml, '/user/signup', err.message, 409)
  }
  if (err instanceof NameTakenError) {
    return authFail(req, wantsHtml, '/user/signup', nameTakenMessageBn, 409)
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(',') ?? ''
    return authFail(req, wantsHtml, '/user/signup', takenAccountMessage(target), 409)
  }
  logAuthFailure(err, process.env, 'signup failed')
  return authFail(req, wantsHtml, '/user/signup', signupFailureMessage(err), 500)
}

export async function POST_signup(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  const wantsHtml = wantsHtmlRedirect(req, contentType)
  try {
    const ip = clientIp(req.headers)

    if (!isDev()) {
      const rl = rateLimit(`signup:${ip}`, 5, 60 * 60_000)
      if (!rl.ok) return authFail(req, wantsHtml, '/user/signup', 'Rate limited — try again later', 429)
    }

    const raw = await readBodyObject(req)
    const body = signupSchema.parse(raw)

    const termsRaw = String(body.acceptedTerms ?? raw.acceptedTerms ?? '').trim().toLowerCase()
    const accepted = body.acceptedTerms === true || termsRaw === 'on' || termsRaw === 'true'
    if (!accepted) {
      return authFail(req, wantsHtml, '/user/signup', 'শর্তাবলী মেনে নিন', 422)
    }

    if (body.confirmPassword && body.password !== body.confirmPassword) {
      return authFail(req, wantsHtml, '/user/signup', 'পাসওয়ার্ড মিলেনি', 400)
    }

    const nameIssue = signupNameIssue(body.name)
    if (nameIssue) return authFail(req, wantsHtml, '/user/signup', nameIssue, 400)
    const phoneIssue = signupPhoneIssue(body.phone)
    if (phoneIssue) return authFail(req, wantsHtml, '/user/signup', phoneIssue, 400)
    const mailIssue = signupEmailIssue(body.email || '')
    if (mailIssue) return authFail(req, wantsHtml, '/user/signup', mailIssue, 400)
    const referralRaw = (body.referralCode || '').trim()
    const referralErr = signupReferralIssue(referralRaw)
    if (referralErr) return authFail(req, wantsHtml, '/user/signup', referralErr, 400)

    const phone = normalizeBdPhone(body.phone)
    if (!phone) return authFail(req, wantsHtml, '/user/signup', kSignupPhoneError, 400)

    const username = (body.username || suggestUsername(body.name, phone)).toLowerCase()
    if (!isValidUsername(username)) {
      return authFail(req, wantsHtml, '/user/signup', 'ইউজারনেম ৪–২৪ অক্ষর, a-z দিয়ে শুরু', 400)
    }
    const pwErr = signupPasswordIssue(body.password)
    if (pwErr) return authFail(req, wantsHtml, '/user/signup', pwErr, 400)

    if (signingSecretMissing()) {
      logAuthFailure(new Error('signup blocked'), process.env, 'signup failed')
      return authFail(req, wantsHtml, '/user/signup', signupFailureMessage(), 500)
    }

    const email = body.email.trim().toLowerCase()
    const name = collapseName(body.name)

    const earlyConflict = await signupConflictMessage(prisma, { name, phone, email })
    if (earlyConflict) return authFail(req, wantsHtml, '/user/signup', earlyConflict, 409)

    const { user, tokens } = await prisma.$transaction(async (tx) => {
      const conflict = await signupConflictMessage(tx, { name, phone, email })
      if (conflict) throw new SignupConflict(conflict)
      const openUsername = await freeUsername(tx, username)
      const created = await tx.user.create({
        data: {
          username: openUsername,
          name,
          email,
          phone,
          passwordHash: await hashPassword(body.password),
          appRole: 'USER',
          uiLanguage: body.uiLanguage ?? 'bn',
          webTrialEndsAt: new Date(Date.now() + 7 * 86400000),
        },
      })
      await createPersonalWorkspace(tx, created.id, body.name)
      if (referralRaw) {
        await applyReferralCode(tx, { referredUserId: created.id, code: referralRaw })
      }
      const sessionTokens = await issueSession({
        userId: created.id,
        ip,
        device: { platform: 'web' },
        tx,
      })
      await tx.loginAttempt.create({
        data: { userId: created.id, email: email ?? undefined, phone, ip, success: true },
      })
      return { user: created, tokens: sessionTokens }
    })

    if (wantsHtml) {
      const res = NextResponse.redirect(sameOriginUrl(req, '/user'), 303)
      setAuthCookies(req, res, tokens.accessToken, tokens.refreshToken)
      return res
    }
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, username: user.username, email: user.email },
    })
    setAuthCookies(req, res, tokens.accessToken, tokens.refreshToken)
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return authFail(req, wantsHtml, '/user/signup', zodMessage(err), 400)
    }
    if (err instanceof SyntaxError) {
      return authFail(req, wantsHtml, '/user/signup', 'Invalid form body', 400)
    }
    return signupCaught(req, wantsHtml, err)
  }
}

const kLoginServerMessage = 'লগইন এখন সম্পন্ন হয়নি। আবার চেষ্টা করুন।'

export async function POST_login(req: NextRequest) {
  try {
    return await postLogin(req)
  } catch (err) {
    logAuthFailure(err, process.env, 'login failed')
    const contentType = req.headers.get('content-type') || ''
    return authFail(req, wantsHtmlRedirect(req, contentType), '/user/login', kLoginServerMessage, 500)
  }
}

async function postLogin(req: NextRequest) {
  const ip = clientIp(req.headers)
  const contentType = req.headers.get('content-type') || ''
  const wantsHtml = wantsHtmlRedirect(req, contentType)

  if (!isDev()) {
    const rl = rateLimit(`login:${ip}`, 10, 60_000)
    if (!rl.ok) return authFail(req, wantsHtml, '/user/login', 'Rate limited', 429)
    const fails = await prisma.loginAttempt.count({
      where: { ip, success: false, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
    })
    if (fails >= 20) return authFail(req, wantsHtml, '/user/login', 'Temporarily locked', 423)
  }

  let raw: Record<string, unknown>
  try {
    raw = await readBodyObject(req)
  } catch {
    return authFail(req, wantsHtml, '/user/login', 'Invalid form body', 400)
  }

  let body: z.infer<typeof loginSchema>
  try {
    body = loginSchema.parse(raw)
  } catch (err) {
    return authFail(req, wantsHtml, '/user/login', zodMessage(err), 400)
  }

  const nextPath = safeNextPath(body.next, '/user')
  const ident = (body.identifier || body.username || body.email || '').trim()
  const password = body.password
  if (!ident || !password) {
    return authFail(req, wantsHtml, '/user/login', kLoginEmptyMessage, 400)
  }
  const phone = normalizeBdPhone(ident)
  const byName = await findActiveUsersByName(ident)
  let user: (typeof byName)[number] | null = null
  if (byName.length > 0) {
    const passwordHits: typeof byName = []
    for (const candidate of byName) {
      if (await verifyPassword(password, candidate.passwordHash)) passwordHits.push(candidate)
    }
    if (passwordHits.length > 1) {
      await prisma.loginAttempt.create({ data: { username: ident, ip, success: false } })
      return authFail(req, wantsHtml, '/user/login', nameAmbiguousMessageBn, 409)
    }
    if (passwordHits.length === 0) {
      await prisma.loginAttempt.create({
        data: { userId: byName.length === 1 ? byName[0].id : undefined, username: ident, ip, success: false },
      })
      return authFail(req, wantsHtml, '/user/login', kLoginWrongPasswordMessage, 401)
    }
    user = passwordHits[0]
  } else {
    const found = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { username: ident.toLowerCase() },
          { email: ident.toLowerCase() },
          ...(phone ? [{ phone }] : []),
        ],
      },
    })
    const passwordOk = found ? await verifyPassword(password, found.passwordHash) : false
    if (!passwordOk || !found) {
      await prisma.loginAttempt.create({
        data: { userId: found?.id, username: ident, ip, success: false },
      })
      return authFail(req, wantsHtml, '/user/login', kLoginUnknownMessage, 401)
    }
    user = found
  }
  await prisma.loginAttempt.create({
    data: { userId: user.id, username: ident, ip, success: true },
  })

  const tokens = await issueSession({ userId: user.id, ip, device: { platform: 'web' } })
  const dest = nextPath

  if (wantsHtml) {
    const res = NextResponse.redirect(sameOriginUrl(req, dest), 303)
    setAuthCookies(req, res, tokens.accessToken, tokens.refreshToken)
    return res
  }
  const res = NextResponse.json({
    user: { id: user.id, name: user.name, username: user.username, email: user.email, appRole: user.appRole },
  })
  setAuthCookies(req, res, tokens.accessToken, tokens.refreshToken)
  return res
}

export async function POST_logout(req: NextRequest) {
  const refresh = req.cookies.get('ldb_refresh')?.value
  if (refresh) await revokeSessionByRefreshToken(refresh)
  const wantsHtml = (req.headers.get('accept') || '').includes('text/html')
  const res = wantsHtml
    ? NextResponse.redirect(sameOriginUrl(req, '/user/login'), 303)
    : NextResponse.json({ ok: true })
  clearAuthCookies(req, res)
  return res
}

/** Kept so existing cookie refresh still works if a JWT refresh cookie is leftover. */
export function issueAccessOnly(userId: string) {
  return signJwt({ sub: userId }, '15m')
}
