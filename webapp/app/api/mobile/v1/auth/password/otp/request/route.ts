import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { normalizeBdPhone } from '@/lib/identity'
import { sendSmsHybrid } from '@/lib/sms-hybrid'
import {
  generateNumericOtp,
  hashPasswordOtp,
  otpRequestMessage,
  OTP_TTL_MS,
} from '@/lib/auth/password-otp'

const schema = z.object({ phone: z.string().min(10).max(20) })

const UNIFORM = {
  ok: true,
  expiresInSec: 600,
  messageBn: 'কোড পাঠানো হয়েছে যদি এই নম্বরে অ্যাকাউন্ট থাকে।',
}

const UNKNOWN_PHONE = {
  error: 'unknown_phone',
  messageBn: 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট নেই।',
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const rlIp = rateLimit(`otp-req-ip:${ip}`, 10, 60 * 60_000)
  if (!rlIp.ok) return NextResponse.json(UNIFORM)

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json(UNIFORM)
  }

  const phone = normalizeBdPhone(body.phone)
  if (!phone) return NextResponse.json(UNIFORM)

  const rlPhone = rateLimit(`otp-req-phone:${phone}`, 1, 60_000)
  const rlHour = rateLimit(`otp-req-hour:${phone}`, 5, 60 * 60_000)
  if (!rlPhone.ok || !rlHour.ok) return NextResponse.json(UNIFORM)

  const user = await prisma.user.findFirst({
    where: { phone, deletedAt: null },
    select: { id: true },
  })
  if (!user) return NextResponse.json(UNKNOWN_PHONE, { status: 422 })

  const otp = generateNumericOtp()
  await prisma.passwordOtpChallenge.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  })
  await prisma.passwordOtpChallenge.create({
    data: {
      userId: user.id,
      phone,
      otpHash: hashPasswordOtp(phone, otp),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })

  const sent = await sendSmsHybrid({ phone, message: otpRequestMessage(otp), kind: 'password_otp' })
  if (!sent.ok && process.env.NODE_ENV === 'development') {
    console.log(`[OTP] stored; SMS ${sent.skipped || sent.error || 'failed'}`)
  }

  return NextResponse.json(UNIFORM)
}
