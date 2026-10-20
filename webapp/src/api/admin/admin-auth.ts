import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/jwt'
import { hashPassword, verifyPassword, createPersonalWorkspace } from '@/lib/auth/session'
import { normalizeBdPhone } from '@/lib/identity'
import { hashToken } from '@/lib/crypto-tokens'
import { ADMIN_COOKIE } from '@/lib/admin-session'
import { originAllowed } from '@/lib/csrf'

function cookieBase() {
  const secure =
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production')
  return { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' }
}

function sameHost(req: NextRequest, path: string) {
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim()
  const proto = (req.headers.get('x-forwarded-proto') || 'http').split(',')[0].trim()
  return new URL(path, host ? `${proto}://${host}` : req.nextUrl.origin)
}

function fail(req: NextRequest, path: string, message: string) {
  const res = NextResponse.redirect(sameHost(req, path), 303)
  res.cookies.set('mq_admin_notice', message.slice(0, 200), {
    ...cookieBase(),
    path: '/hfazlul',
    maxAge: 30,
  })
  return res
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
  res.cookies.set(ADMIN_COOKIE, token, { ...cookieBase(), maxAge: 8 * 60 * 60 })
  return res
}

export async function POST_logout(req: NextRequest) {
  const res = NextResponse.redirect(sameHost(req, '/hfazlul/login'), 303)
  res.cookies.set(ADMIN_COOKIE, '', { ...cookieBase(), maxAge: 0 })
  return res
}

export async function POST_signup(req: NextRequest) {
  if (!originAllowed(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const body = await readForm(req)
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
  if (!phone) return fail(req, '/hfazlul/signup', 'সঠিক মোবাইল')
  const password = body.password || ''
  if (password.length < 10) return fail(req, '/hfazlul/signup', 'পাসওয়ার্ড ১০+')
  const username = (body.username || '').trim().toLowerCase()
  const email = (body.email || '').trim().toLowerCase()

  // User identities are shared by web users and admins. Report every
  // collision up front instead of hiding each database constraint in turn.
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
    return fail(
      req,
      '/hfazlul/signup',
      `${[...conflicts].join(', ')} আগে থেকেই ব্যবহৃত`,
    )
  }
  try {
    const { user, token } = await prisma.$transaction(async (tx) => {
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
      return { user: created, token: signJwt({ sub: created.id, kind: 'admin' }, '8h') }
    })
    const res = NextResponse.redirect(sameHost(req, '/hfazlul'), 303)
    res.cookies.set(ADMIN_COOKIE, token, { ...cookieBase(), maxAge: 8 * 60 * 60 })
    return res
  } catch {
    return fail(req, '/hfazlul/signup', 'তৈরি ব্যর্থ')
  }
}
