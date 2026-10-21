import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { normalizeBdPhone } from '@/lib/identity'
import { issuePasswordOtp } from '@/lib/auth/issue-password-otp'

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

  const issued = await issuePasswordOtp(body.phone)
  if (!issued.ok) {
    if (issued.error === 'unknown_phone') {
      return NextResponse.json(UNKNOWN_PHONE, { status: 422 })
    }
    return NextResponse.json(
      { error: issued.error, messageBn: issued.messageBn },
      { status: issued.status },
    )
  }

  return NextResponse.json(UNIFORM)
}
