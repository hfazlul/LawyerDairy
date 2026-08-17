// Next.js Route Handler — /api/mobile/v1/auth/otp/[action]/route.ts
// Supports: POST /request  POST /verify  POST /token/refresh

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signJwt, verifyJwt } from '@/lib/jwt'
import { sendOtp } from '@/lib/sms-otp'
import { z } from 'zod'

// ── OTP Request ───────────────────────────────────────────────────────────────
export async function POST_request(req: NextRequest) {
  const { phone } = z.object({ phone: z.string().min(11) }).parse(await req.json())

  // Rate limit: max 3 OTP per 10 minutes per phone
  const recent = await prisma.otpLog.count({
    where: { phone, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
  })
  if (recent >= 3) {
    return NextResponse.json({ message: '১০ মিনিটে সর্বোচ্চ ৩টি OTP' }, { status: 429 })
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const exp = new Date(Date.now() + 5 * 60 * 1000) // 5 min expiry

  await prisma.otpLog.create({ data: { phone, otp, expiresAt: exp } })
  await sendOtp(phone, `আইনজীবী ডায়েরি BD: আপনার OTP কোড ${otp}। ৫ মিনিটে মেয়াদ শেষ।`)

  return NextResponse.json({ success: true })
}

// ── OTP Verify ────────────────────────────────────────────────────────────────
export async function POST_verify(req: NextRequest) {
  const { phone, otp } = z.object({
    phone: z.string(), otp: z.string().length(6),
  }).parse(await req.json())

  const record = await prisma.otpLog.findFirst({
    where: { phone, otp, used: false, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!record) {
    return NextResponse.json({ message: 'ভুল বা মেয়াদোত্তীর্ণ OTP' }, { status: 401 })
  }

  await prisma.otpLog.update({ where: { id: record.id }, data: { used: true } })

  // Upsert user
  let user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    // Create a default chamber for new users
    const chamber = await prisma.chamber.create({
      data: { name: `${phone} এর চেম্বার`, plan: 'FREE' },
    })
    user = await prisma.user.create({
      data: { phone, chamberId: chamber.id, name: phone, role: 'OWNER' },
    })
  }

  const { accessToken, refreshToken } = await _issueTokens(user)

  return NextResponse.json({
    user: {
      id: user.id, chamberId: user.chamberId, name: user.name,
      phone: user.phone, role: user.role, barRegNo: user.barRegNo,
      accessToken, refreshToken,
      tokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  })
}

// ── Token Refresh ─────────────────────────────────────────────────────────────
export async function POST_refresh(req: NextRequest) {
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(await req.json())

  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ message: 'সেশন মেয়াদোত্তীর্ণ' }, { status: 401 })
  }

  const { accessToken, refreshToken: newRefresh } = await _issueTokens(session.user)
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: newRefresh, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  })

  return NextResponse.json({
    user: {
      id: session.user.id, chamberId: session.user.chamberId,
      name: session.user.name, phone: session.user.phone,
      role: session.user.role, accessToken, refreshToken: newRefresh,
      tokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  })
}

async function _issueTokens(user: any) {
  const accessToken  = signJwt({ sub: user.id, chamberId: user.chamberId }, '15m')
  const refreshToken = crypto.randomUUID()
  await prisma.session.create({
    data: {
      userId: user.id, refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  return { accessToken, refreshToken }
}
