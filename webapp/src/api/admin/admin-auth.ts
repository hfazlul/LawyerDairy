import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/jwt'
import { hashPassword, verifyPassword, createPersonalWorkspace } from '@/lib/auth/session'
import { normalizeBdPhone } from '@/lib/identity'
import { hashToken } from '@/lib/crypto-tokens'
import { ADMIN_COOKIE } from '@/lib/admin-session'
import { originAllowed } from '@/lib/csrf'
import {
  kSignupMissingSecretMessage,
  signupFailureMessage,
  signingSecretMissing,
} from '@/lib/auth/signup-failure'

function requestIsHttps(req: NextRequest): boolean {
  const forwarded = (req.headers.get('x-forwarded-proto') || '').split(',')[0].trim().toLowerCase()
  if (forwarded === 'https') return true
  if (forwarded === 'http') return false
  return req.nextUrl.protocol === 'https:'
}

function cookieBase(req: NextRequest) {
  const secure = process.env.COOKIE_SECURE === 'false' ? false : requestIsHttps(req)
  return { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' }
}

function sameHost(req: NextRequest, path: string) {
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim()
  const proto = (req.headers.get('x-forwarded-proto') || 'http').split(',')[0].trim()
  return new URL(path, host ? `${proto}://${host}` : req.nextUrl.origin)
}

function wantsJson(req: NextRequest): boolean {
  return (req.headers.get('content-type') || '').includes('application/json')
}

function fail(req: NextRequest, path: string, message: string, status = 400) {
  if (wantsJson(req)) return NextResponse.json({ message }, { status })
  const res = NextResponse.redirect(sameHost(req, path), 303)
  res.cookies.set('mq_admin_notice', message.slice(0, 200), {
    ...cookieBase(req),
    path: '/hfazlul',
    maxAge: 30,
  })
  return res
}

async function readBody(req: NextRequest): Promise<Record<string, string>> {
  if (wantsJson(req)) {
    const json = await req.json()
    const out: Record<string, string> = {}
    if (json && typeof json === 'object') {
      for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
        if (typeof value === 'string') out[key] = value
      }
    }
    return out
  }
  return readForm(req)
}

async function readForm(req: NextRequest): Promise<Record<string, string>> {
  const fd = await req.formData()
  const out: Record<string, string> = {}
  fd.forEach((v, k) => {
    if (typeof v === 'string') out[k] = v
  })
  return out
}

export async function POST_login(req: NextRequest) {
  if (!originAllowed(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const body = await readForm(req)
  const ident = (body.identifier || '').trim()
  const password = body.password || ''
  const phone = normalizeBdPhone(ident)
  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      appRole: 'ADMIN',
      OR: [
        { username: ident.toLowerCase() },
        { email: ident.toLowerCase() },
        ...(phone ? [{ phone }] : []),
      ],
    },
  })
  const ok = user ? await verifyPassword(password, user.passwordHash) : false
  if (!ok || !user) return fail(req, '/hfazlul/login', 'ভুল লগইন')
  const token = signJwt({ sub: user.id, kind: 'admin' }, '8h')
  const res = NextResponse.redirect(sameHost(req, '/hfazlul'), 303)
  res.cookies.set(ADMIN_COOKIE, token, { ...cookieBase(req), maxAge: 8 * 60 * 60 })
  return res
}

export async function POST_logout(req: NextRequest) {
  const res = NextResponse.redirect(sameHost(req, '/hfazlul/login'), 303)
  res.cookies.set(ADMIN_COOKIE, '', { ...cookieBase(req), maxAge: 0 })
  return res
}

export async function POST_signup(req: NextRequest) {
  try {
    if (!originAllowed(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    const body = await readBody(req)
    const adminN = await prisma.user.count({ where: { appRole: 'ADMIN', deletedAt: null } })
    let adminInviteId: string | null = null
    if (adminN > 0) {
      const invite = body.invite || ''
      if (!invite) return fail(req, '/hfazlul/login', 'ইনভাইট লাগবে')
      const hashed = hashToken(invite)
      const row = await prisma.adminInvite.findFirst({
        where: { tokenHash: hashed, usedAt: null, expiresAt: { gt: new Date() } },
      })
      if (!row) return fail(req, '/hfazlul/signup', 'ইনভাইট অবৈধ')
      adminInviteId = row.id
    }
    const phone = normalizeBdPhone(body.phone || '')
    if (!phone) return fail(req, '/hfazlul/signup', 'সঠিক মোবাইল নম্বর দিন।')
    const password = body.password || ''
    // Admin passwords stay at least 10 characters and are not limited to digits.
    if (password.length < 10) {
      return fail(req, '/hfazlul/signup', 'পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।')
    }
    if (signingSecretMissing()) {
      return fail(req, '/hfazlul/signup', kSignupMissingSecretMessage, 500)
    }
    const username = (body.username || '').trim().toLowerCase()
    const email = (body.email || '').trim().toLowerCase()

    const existing = await prisma.user.findMany({
      where: { OR: [{ username }, { email }, { phone }] },
      select: { username: true, email: true, phone: true },
    })
    const conflicts = new Set<string>()
    for (const user of existing) {
      if (user.username === username) conflicts.add('ইউজারনেম')
      if (user.email === email) conflicts.add('ইমেইল')
      if (user.phone === phone) conflicts.add('মোবাইল')
    }
    if (conflicts.size > 0) {
      return fail(req, '/hfazlul/signup', `${[...conflicts].join(', ')} আগে থেকেই ব্যবহৃত`)
    }
    const { token } = await prisma.$transaction(async (tx) => {
      if (adminInviteId) {
        const consumed = await tx.adminInvite.updateMany({
          where: { id: adminInviteId, usedAt: null, expiresAt: { gt: new Date() } },
          data: { usedAt: new Date() },
        })
        if (consumed.count !== 1) throw new Error('Admin invite is no longer valid')
      }
      const created = await tx.user.create({
        data: {
          username,
          name: body.name || 'Admin',
          email,
          phone,
          passwordHash: await hashPassword(password),
          appRole: 'ADMIN',
        },
      })
      await tx.adminUser.create({ data: { userId: created.id, bootstrap: adminN === 0 } })
      await createPersonalWorkspace(tx, created.id, created.name)
      return { token: signJwt({ sub: created.id, kind: 'admin' }, '8h') }
    })
    const res = wantsJson(req)
      ? NextResponse.json({ ok: true })
      : NextResponse.redirect(sameHost(req, '/hfazlul'), 303)
    res.cookies.set(ADMIN_COOKIE, token, { ...cookieBase(req), maxAge: 8 * 60 * 60 })
    return res
  } catch (err) {
    if (err instanceof Error && err.message === 'Admin invite is no longer valid') {
      return fail(req, '/hfazlul/signup', 'ইনভাইট অবৈধ')
    }
    console.error('admin signup failed', err)
    return fail(req, '/hfazlul/signup', signupFailureMessage(err), 500)
  }
}
