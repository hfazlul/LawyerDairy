import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { normalizeBdPhone, passwordIssues, phoneFieldIssue } from '@/lib/identity'
import { hashPassword } from '@/lib/auth/session'
import { hashPasswordOtp, OTP_MAX_ATTEMPTS } from '@/lib/auth/password-otp'
import { OTP_EXPIRED_MESSAGE_BN } from '@/lib/auth/issue-password-otp'

const schema = z.object({
  phone: z.string().min(1).max(20),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(6).max(128),
  confirmPassword: z.string().min(6).max(128),
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'validation', messageBn: 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড ব্যবহার করুন' }, { status: 422 })
  }
  if (body.newPassword !== body.confirmPassword) {
    return NextResponse.json({ error: 'validation', messageBn: 'পাসওয়ার্ড মিলেনি', fieldErrors: { confirmPassword: 'পাসওয়ার্ড মিলেনি' } }, { status: 422 })
  }

  const phoneIssue = phoneFieldIssue(body.phone)
  if (phoneIssue) {
    return NextResponse.json({ error: 'validation', messageBn: phoneIssue }, { status: 422 })
  }
  const phone = normalizeBdPhone(body.phone)
  if (!phone) {
    return NextResponse.json({ error: 'validation', messageBn: '১১ সংখ্যার মোবাইল নম্বর দিন, যেমন 01XXXXXXXXX' }, { status: 422 })
  }

  const now = new Date()
  const challenge = await prisma.passwordOtpChallenge.findFirst({
    where: { phone, usedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  })
  if (!challenge) {
    const expired = await prisma.passwordOtpChallenge.findFirst({
      where: { phone, usedAt: null, expiresAt: { lte: now } },
      orderBy: { createdAt: 'desc' },
    })
    if (expired) {
      return NextResponse.json(
        { error: 'otp_expired', messageBn: OTP_EXPIRED_MESSAGE_BN },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'invalid_otp', messageBn: 'কোড ভুল বা মেয়াদ শেষ' }, { status: 400 })
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'invalid_otp', messageBn: 'কোড ভুল বা মেয়াদ শেষ' }, { status: 400 })
  }

  const expected = hashPasswordOtp(phone, body.otp)
  if (expected !== challenge.otpHash) {
    await prisma.passwordOtpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    })
    return NextResponse.json({ error: 'invalid_otp', messageBn: 'কোড ভুল বা মেয়াদ শেষ' }, { status: 400 })
  }

  const pwErr = passwordIssues(body.newPassword)
  if (pwErr) {
    return NextResponse.json({ error: 'validation', messageBn: pwErr }, { status: 422 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: challenge.userId },
      data: { passwordHash: await hashPassword(body.newPassword) },
    }),
    prisma.passwordOtpChallenge.update({
      where: { id: challenge.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.updateMany({
      where: { userId: challenge.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ])

  return NextResponse.json({ ok: true })
}
