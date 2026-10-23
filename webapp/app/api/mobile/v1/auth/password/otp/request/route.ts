import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { normalizeBdPhone } from '@/lib/identity'
import { issuePasswordOtp, OTP_ACCOUNT_MISMATCH_BN, type PasswordOtpInput } from '@/lib/auth/issue-password-otp'

const UNIFORM = {
  ok: true,
  expiresInSec: 300,
}

function wait(): NextResponse {
  return NextResponse.json(
    { error: 'rate_limited', messageBn: 'একটু পরে আবার চেষ্টা করুন।' },
    { status: 429 },
  )
}

async function readFields(req: NextRequest): Promise<{ channel: 'email' | 'phone'; email: string; phone: string }> {
  const contentType = req.headers.get('content-type') || ''
  let channel = ''
  let email = ''
  let phone = ''
  try {
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const fd = await req.formData()
      channel = String(fd.get('channel') || '')
      email = String(fd.get('email') || '')
      phone = String(fd.get('phone') || fd.get('identifier') || '')
    } else {
      const body = (await req.json()) as { channel?: string; email?: string; phone?: string; identifier?: string }
      channel = String(body.channel || '')
      email = String(body.email || '')
      phone = String(body.phone || body.identifier || '')
    }
  } catch {
    channel = ''
  }
  const picked: 'email' | 'phone' = channel === 'email' || (email && !phone) ? 'email' : 'phone'
  return { channel: picked, email, phone }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  if (!rateLimit(`otp-req-ip:${ip}`, 10, 60 * 60_000).ok) return wait()

  const fields = await readFields(req)
  const emailKey = fields.email.trim().toLowerCase()
  const phoneKey = normalizeBdPhone(fields.phone)
  if (emailKey && !rateLimit(`otp-req-email:${emailKey}`, 5, 60 * 60_000).ok) return wait()
  if (phoneKey) {
    if (!rateLimit(`otp-req-phone:${phoneKey}`, 1, 60_000).ok) return wait()
    if (!rateLimit(`otp-req-hour:${phoneKey}`, 5, 60 * 60_000).ok) return wait()
  }

  const input: PasswordOtpInput = fields.channel === 'email'
    ? { channel: 'email', email: fields.email }
    : { channel: 'phone', email: fields.email, phone: fields.phone }

  const issued = await issuePasswordOtp(input)
  if (!issued.ok) {
    return NextResponse.json(
      { error: issued.error, messageBn: issued.error === 'mismatch' ? OTP_ACCOUNT_MISMATCH_BN : issued.messageBn },
      { status: issued.status },
    )
  }
  return NextResponse.json({ ...UNIFORM, expiresInSec: issued.expiresInSec })
}
