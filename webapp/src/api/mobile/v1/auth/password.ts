import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import {
  isValidUsername,
  normalizeBdPhone,
  passwordIssues,
  signupEmailIssue,
  signupNameIssue,
  signupPasswordIssue,
  signupPhoneIssue,
  suggestUsername,
  takenAccountMessage,
} from '@/lib/identity'
import {
  buildLoginEnvelope,
  createPersonalWorkspace,
  hashPassword,
  issueSession,
  rotateRefreshToken,
  revokeSessionByRefreshToken,
  verifyPassword,
} from '@/lib/auth/session'
import { applyReferralCode } from '@/lib/referral'
import { hashToken, randomOpaqueToken } from '@/lib/crypto-tokens'
import { sendEmail } from '@/lib/email'
import { appBaseUrl } from '@/lib/app-url'
import {
  anonymizeDeletedUser,
  isWithinDeletionGrace,
  purgeAtFrom,
} from '@/lib/auth/account-deletion'
import {
  collapseName,
  findActiveUsersByName,
  nameAmbiguousMessageBn,
  nameTakenMessageBn,
} from '@/lib/auth/login-name'
import { freeUsername, SignupConflict, signupConflictMessage } from '@/lib/auth/signup-guard'
import { logAuthFailure, signupFailureMessage, signingSecretMissing } from '@/lib/auth/signup-failure'

class NameTakenError extends Error {}

const deviceSchema = z
  .object({
    deviceId: z.string().optional(),
    label: z.string().optional(),
    platform: z.string().optional(),
    appVersion: z.string().optional(),
    osVersion: z.string().optional(),
  })
  .optional()

function isDev() {
  return process.env.NODE_ENV === 'development'
}

async function lockedOut(identifier: string, ip: string): Promise<boolean> {
  if (isDev()) return false
  const since = new Date(Date.now() - 15 * 60 * 1000)
  const fails = await prisma.loginAttempt.count({
    where: {
      success: false,
      createdAt: { gte: since },
      OR: [{ ip }, { username: identifier }, { phone: identifier }],
    },
  })
  return fails >= 20
}

export async function POST_login(req: NextRequest) {
  try {
    return await loginWithPassword(req)
  } catch (err) {
    logAuthFailure(err, process.env, 'login failed')
    return NextResponse.json(
      { error: 'server', messageBn: 'লগইন এখন সম্পন্ন হয়নি। আবার চেষ্টা করুন।' },
      { status: 500 },
    )
  }
}

async function loginWithPassword(req: NextRequest) {
  const ip = clientIp(req.headers)
  if (!isDev()) {
    const rl = rateLimit(`mlogin:${ip}`, 10, 60_000)
    if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let raw: Record<string, unknown> = {}
  try {
    const text = await Promise.race([
      req.text(),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('body-timeout')), 8000)
      }),
    ])
    const parsed = text ? JSON.parse(text) : {}
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      raw = parsed as Record<string, unknown>
    }
  } catch {
    raw = {}
  }
  const identifier = String(raw.identifier ?? raw.username ?? raw.name ?? raw.email ?? raw.phone ?? '').trim()
  const password = typeof raw.password === 'string' ? raw.password : ''
  const deviceParsed = deviceSchema.safeParse(raw.device)
  if (!identifier || !password) {
    return NextResponse.json(
      { error: 'validation', messageBn: 'নাম ও পাসওয়ার্ড দিন' },
      { status: 422 },
    )
  }
  const body = { identifier, password, device: deviceParsed.success ? deviceParsed.data : undefined }

  if (await lockedOut(body.identifier, ip)) {
    return NextResponse.json(
      { error: 'account_locked', retryAfterSeconds: 900, messageBn: 'অনেকবার ভুল হয়েছে — পরে চেষ্টা করুন' },
      { status: 423 },
    )
  }

  const ident = body.identifier.trim()
  const phone = normalizeBdPhone(ident)
  const unknownAccountMessageBn = 'নাম বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।'
  const wrongPasswordMessageBn = 'পাসওয়ার্ড ভুল।'
  const byName = await findActiveUsersByName(ident)

  let user: Awaited<ReturnType<typeof prisma.user.findFirst>> = null
  if (byName.length > 0) {
    const passwordHits: typeof byName = []
    for (const candidate of byName) {
      if (await verifyPassword(body.password, candidate.passwordHash)) {
        passwordHits.push(candidate)
      }
    }
    if (passwordHits.length > 1) {
      return NextResponse.json(
        { error: 'name_ambiguous', messageBn: nameAmbiguousMessageBn },
        { status: 409 },
      )
    }
    if (passwordHits.length === 0) {
      await prisma.loginAttempt.create({
        data: {
          userId: byName.length === 1 ? byName[0].id : undefined,
          username: ident,
          phone: phone ?? undefined,
          ip,
          success: false,
        },
      })
      return NextResponse.json(
        { error: 'invalid_credentials', messageBn: wrongPasswordMessageBn },
        { status: 401 },
      )
    }
    user = passwordHits[0]
  } else {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: ident.toLowerCase() },
          ...(phone ? [{ phone }] : []),
        ],
      },
    })
  }

  if (user?.deletedAt) {
    if (isWithinDeletionGrace(user.deletedAt)) {
      return NextResponse.json(
        {
          error: 'account_pending_deletion',
          purgeAt: purgeAtFrom(user.deletedAt).toISOString(),
          messageBn: 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ চলছে। ৩০ দিনের মধ্যে পুনরুদ্ধার করুন।',
        },
        { status: 403 },
      )
    }
    if (!user.username.startsWith('deleted_')) {
      await anonymizeDeletedUser(user.id)
    }
    return NextResponse.json(
      { error: 'invalid_credentials', messageBn: unknownAccountMessageBn },
      { status: 401 },
    )
  }

  const ok =
    byName.length > 0
      ? user != null
      : user
        ? await verifyPassword(body.password, user.passwordHash)
        : false
  await prisma.loginAttempt.create({
    data: {
      userId: user?.id,
      username: ident,
      phone: phone ?? undefined,
      ip,
      success: ok,
    },
  })

  if (!ok || !user) {
    return NextResponse.json(
      { error: 'invalid_credentials', messageBn: unknownAccountMessageBn },
      { status: 401 },
    )
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  const tokens = await issueSession({
    userId: user.id,
    device: body.device,
    ip,
    userAgent: req.headers.get('user-agent') || undefined,
  })
  const envelope = await buildLoginEnvelope(user.id)
  return NextResponse.json({ ...tokens, ...envelope })
}

export async function POST_signup(req: NextRequest) {
  const ip = clientIp(req.headers)
  if (!isDev()) {
    const rl = rateLimit(`msignup:${ip}`, 5, 60 * 60_000)
    if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const body = z
    .object({
      name: z.string().trim().min(1).max(80),
      username: z.string().trim().min(4).max(24).optional(),
      phone: z.string().min(1).max(20),
      email: z.string().trim().max(200).optional().nullable(),
      password: z.string().max(128),
      confirmPassword: z.string().max(128),
      acceptedTerms: z.boolean(),
      uiLanguage: z.enum(['bn', 'en']).optional(),
      referralCode: z.string().trim().max(32).optional(),
      device: deviceSchema,
    })
    .safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json(
      { error: 'validation', messageBn: 'নাম, ১১ সংখ্যার মোবাইল ও কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন' },
      { status: 422 },
    )
  }
  const parsed = body.data

  if (!parsed.acceptedTerms) {
    return NextResponse.json({ error: 'validation', fieldErrors: { acceptedTerms: 'শর্তাবলী মেনে নিন' } }, { status: 422 })
  }
  const nameIssue = signupNameIssue(parsed.name)
  if (nameIssue) {
    return NextResponse.json({ error: 'validation', messageBn: nameIssue, fieldErrors: { name: nameIssue } }, { status: 422 })
  }
  const phoneIssue = signupPhoneIssue(parsed.phone)
  if (phoneIssue) {
    return NextResponse.json({ error: 'validation', messageBn: phoneIssue, fieldErrors: { phone: phoneIssue } }, { status: 422 })
  }
  const mailIssue = signupEmailIssue(parsed.email || '')
  if (mailIssue) {
    return NextResponse.json({ error: 'validation', messageBn: mailIssue, fieldErrors: { email: mailIssue } }, { status: 422 })
  }
  const pwErr = signupPasswordIssue(parsed.password)
  if (pwErr) {
    return NextResponse.json({ error: 'validation', messageBn: pwErr, fieldErrors: { password: pwErr } }, { status: 422 })
  }
  if (parsed.password !== parsed.confirmPassword) {
    return NextResponse.json({ error: 'validation', messageBn: 'পাসওয়ার্ড মিলেনি', fieldErrors: { confirmPassword: 'পাসওয়ার্ড মিলেনি' } }, { status: 422 })
  }

  const phone = normalizeBdPhone(parsed.phone)
  if (!phone) {
    return NextResponse.json({ error: 'validation', messageBn: '১১ সংখ্যার মোবাইল নম্বর দিন, যেমন 01XXXXXXXXX', fieldErrors: { phone: '১১ সংখ্যার মোবাইল নম্বর দিন, যেমন 01XXXXXXXXX' } }, { status: 422 })
  }

  const username = (parsed.username || suggestUsername(parsed.name, phone)).toLowerCase()
  if (!isValidUsername(username)) {
    return NextResponse.json({ error: 'validation', messageBn: 'ইউজারনেম ৪–২৪ অক্ষর, a-z দিয়ে শুরু', fieldErrors: { username: 'ইউজারনেম ৪–২৪ অক্ষর, a-z দিয়ে শুরু' } }, { status: 422 })
  }

  const email = parsed.email?.trim().toLowerCase() || null
  const name = collapseName(parsed.name)

  if (signingSecretMissing()) {
    logAuthFailure(new Error('signup blocked'), process.env, 'signup failed')
    return NextResponse.json({ error: 'server_error', messageBn: signupFailureMessage() }, { status: 500 })
  }

  try {
    const earlyConflict = await signupConflictMessage(prisma, { name, phone, email })
    if (earlyConflict) {
      return NextResponse.json({ error: 'conflict', messageBn: earlyConflict }, { status: 409 })
    }

    const { tokens, envelope, pendingInvites } = await prisma.$transaction(async (tx) => {
      const conflict = await signupConflictMessage(tx, { name, phone, email })
      if (conflict) throw new SignupConflict(conflict)
      const openUsername = await freeUsername(tx, username)
      const created = await tx.user.create({
        data: {
          username: openUsername,
          name,
          phone,
          email,
          passwordHash: await hashPassword(parsed.password),
          uiLanguage: parsed.uiLanguage ?? 'bn',
          webTrialEndsAt: new Date(Date.now() + 7 * 86400000),
        },
      })
      await createPersonalWorkspace(tx, created.id, parsed.name)
      if (parsed.referralCode && parsed.referralCode.trim()) {
        await applyReferralCode(tx, {
          referredUserId: created.id,
          code: parsed.referralCode,
        })
      }
      await tx.auditLog.create({
        data: {
          workspaceId: (await tx.workspace.findFirstOrThrow({ where: { ownerUserId: created.id, kind: 'PERSONAL' } })).id,
          actorUserId: created.id,
          action: 'user.signed_up',
          summaryBn: 'নতুন অ্যাকাউন্ট তৈরি',
        },
      })
      const sessionTokens = await issueSession({
        userId: created.id,
        device: parsed.device,
        ip,
        userAgent: req.headers.get('user-agent') || undefined,
        tx,
      })
      const loginEnvelope = await buildLoginEnvelope(created.id, tx)
      const invites = await tx.invite.findMany({
        where: {
          status: 'PENDING',
          OR: [{ phone }, ...(email ? [{ email }] : [])],
        },
        include: { workspace: true },
      })
      return { tokens: sessionTokens, envelope: loginEnvelope, pendingInvites: invites }
    })
    return NextResponse.json(
      {
        ...tokens,
        ...envelope,
        pendingInvites: pendingInvites.map((i) => ({
          inviteId: i.id,
          workspaceName: i.workspace.name,
          role: i.role.toLowerCase(),
        })),
      },
      { status: 201 },
    )
  } catch (err) {
    if (err instanceof SignupConflict) {
      return NextResponse.json({ error: 'conflict', messageBn: err.message }, { status: 409 })
    }
    if (err instanceof NameTakenError) {
      return NextResponse.json(
        { error: 'name_taken', messageBn: nameTakenMessageBn, fieldErrors: { name: nameTakenMessageBn } },
        { status: 409 },
      )
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(',') ?? ''
      const messageBn = takenAccountMessage(target)
      const error = target.includes('username')
        ? 'username_taken'
        : target.includes('email')
          ? 'email_taken'
          : 'phone_taken'
      return NextResponse.json({ error, messageBn }, { status: 409 })
    }
    logAuthFailure(err, process.env, 'signup failed')
    return NextResponse.json({ error: 'server_error', messageBn: signupFailureMessage(err) }, { status: 500 })
  }
}

export async function GET_usernameAvailable(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u')?.trim().toLowerCase() || ''
  if (!isValidUsername(u)) return NextResponse.json({ available: false })
  const existing = await prisma.user.findUnique({ where: { username: u }, select: { id: true } })
  return NextResponse.json({ available: !existing, suggestion: u })
}

export async function POST_refresh(req: NextRequest) {
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(await req.json())
  const rotated = await rotateRefreshToken(refreshToken)
  if (!rotated) {
    return NextResponse.json({ error: 'invalid_refresh' }, { status: 401 })
  }
  const envelope = await buildLoginEnvelope(rotated.user.id)
  return NextResponse.json({
    accessToken: rotated.accessToken,
    refreshToken: rotated.refreshToken,
    accessExpiresAt: rotated.accessExpiresAt,
    refreshExpiresAt: rotated.refreshExpiresAt,
    ...envelope,
  })
}

export async function POST_logout(req: NextRequest) {
  const { refreshToken } = z.object({ refreshToken: z.string().optional() }).parse(
    await req.json().catch(() => ({})),
  )
  if (refreshToken) await revokeSessionByRefreshToken(refreshToken)
  return NextResponse.json({ ok: true })
}

export async function POST_passwordResetRequest(req: NextRequest) {
  const ip = clientIp(req.headers)
  if (!isDev()) {
    const rl = rateLimit(`pwreset:${ip}`, 3, 60 * 60_000)
    if (!rl.ok) return NextResponse.json({ ok: true })
  }
  const { identifier } = z.object({ identifier: z.string().min(1) }).parse(await req.json())
  try {
    const phone = normalizeBdPhone(identifier)
    const byName = await findActiveUsersByName(identifier)
    const user =
      byName.length === 1
        ? byName[0]
        : byName.length > 1
          ? null
          : await prisma.user.findFirst({
              where: {
                deletedAt: null,
                OR: [
                  { username: identifier.trim().toLowerCase() },
                  ...(phone ? [{ phone }] : []),
                  { email: identifier.trim().toLowerCase() },
                ],
              },
            })
    // Always 200 — no enumeration
    if (user?.email) {
      const token = randomOpaqueToken()
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      })
      const base = appBaseUrl()
      const link = `${base}/reset-password?token=${token}`
      await sendEmail({
        to: user.email,
        subject: 'Lawyer Diary — পাসওয়ার্ড রিসেট',
        html: `<p>পাসওয়ার্ড রিসেট করতে লিংকটি ৩০ মিনিটের মধ্যে খুলুন:</p><p><a href="${link}">${link}</a></p>`,
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    logAuthFailure(err, process.env, 'password reset failed')
    return NextResponse.json(
      { error: 'server', messageBn: 'রিসেট লিংক পাঠানো যায়নি। আবার চেষ্টা করুন।' },
      { status: 500 },
    )
  }
}

export async function POST_passwordResetComplete(req: NextRequest) {
  const body = z
    .object({ resetToken: z.string(), password: z.string().min(6).max(128), confirmPassword: z.string().min(6).max(128) })
    .safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: 'validation', messageBn: 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড ব্যবহার করুন' }, { status: 422 })
  }
  if (body.data.password !== body.data.confirmPassword) {
    return NextResponse.json({ error: 'validation', messageBn: 'পাসওয়ার্ড মিলেনি' }, { status: 422 })
  }
  const pwErr = passwordIssues(body.data.password)
  if (pwErr) return NextResponse.json({ error: 'validation', messageBn: pwErr }, { status: 422 })
  try {
    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(body.data.resetToken) },
      include: { user: true },
    })
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      return NextResponse.json({ error: 'invalid_token', messageBn: 'লিংক অবৈধ বা মেয়াদোত্তীর্ণ' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash: await bcrypt.hash(body.data.password, 12) },
      }),
      prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      prisma.session.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ])
    return NextResponse.json({ ok: true })
  } catch (err) {
    logAuthFailure(err, process.env, 'password reset failed')
    return NextResponse.json(
      { error: 'server', messageBn: 'রিসেট লিংক পাঠানো যায়নি। আবার চেষ্টা করুন।' },
      { status: 500 },
    )
  }
}
