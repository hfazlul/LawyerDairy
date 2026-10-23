import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { normalizeBdPhone } from '@/lib/identity'
import { issuePasswordOtp, type PasswordOtpInput } from '@/lib/auth/issue-password-otp'
import { logAuthFailure } from '@/lib/auth/signup-failure'

function isDev(): boolean {
  return process.env.NODE_ENV === 'development'
}

function wantsJson(req: NextRequest, contentType: string): boolean {
  if (contentType.includes('application/json')) return true
  return (req.headers.get('accept') || '').includes('application/json')
}

function sameOrigin(req: NextRequest, path: string) {
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim()
  const proto = (req.headers.get('x-forwarded-proto') || 'http').split(',')[0].trim()
  const base = host ? `${proto}://${host}` : req.nextUrl.origin
  return new URL(path, base)
}

function fail(req: NextRequest, contentType: string, message: string, status: number) {
  if (wantsJson(req, contentType)) {
    return NextResponse.json({ message, messageBn: message }, { status })
  }
  const url = sameOrigin(req, '/user/forgot')
  url.searchParams.set('error', message)
  return NextResponse.redirect(url, 303)
}

function succeed(req: NextRequest, contentType: string, expiresInSec: number) {
  if (wantsJson(req, contentType)) {
    return NextResponse.json({ ok: true, expiresInSec })
  }
  return NextResponse.redirect(sameOrigin(req, '/user/forgot?sent=1'), 303)
}

type Fields = { channel: 'email' | 'phone'; email: string; phone: string }

async function readFields(req: NextRequest, contentType: string): Promise<Fields> {
  let channel = ''
  let email = ''
  let phone = ''
  let identifier = ''
  try {
    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { channel?: string; email?: string; phone?: string; identifier?: string }
      channel = String(body.channel || '')
      email = String(body.email || '')
      phone = String(body.phone || '')
      identifier = String(body.identifier || '')
    } else {
      const fd = await req.formData()
      channel = String(fd.get('channel') || '')
      email = String(fd.get('email') || '')
      phone = String(fd.get('phone') || '')
      identifier = String(fd.get('identifier') || '')
    }
  } catch {
    channel = ''
  }
  if (!phone) phone = identifier
  const picked: 'email' | 'phone' = channel === 'email' || (email && !phone) ? 'email' : 'phone'
  return { channel: picked, email, phone }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const contentType = req.headers.get('content-type') || ''
  const fields = await readFields(req, contentType)

  if (!isDev()) {
    const rl = rateLimit(`pwreset:${ip}`, 3, 60 * 60_000)
    if (!rl.ok) return fail(req, contentType, 'একটু পরে আবার চেষ্টা করুন।', 429)
  }
  const phoneKey = normalizeBdPhone(fields.phone)
  if (phoneKey) {
    const rlPhone = rateLimit(`pwreset-phone:${phoneKey}`, 5, 60 * 60_000)
    if (!rlPhone.ok) return fail(req, contentType, 'একটু পরে আবার চেষ্টা করুন।', 429)
  }
  const emailKey = fields.email.trim().toLowerCase()
  if (emailKey) {
    const rlEmail = rateLimit(`pwreset-email:${emailKey}`, 5, 60 * 60_000)
    if (!rlEmail.ok) return fail(req, contentType, 'একটু পরে আবার চেষ্টা করুন।', 429)
  }

  const input: PasswordOtpInput = fields.channel === 'email'
    ? { channel: 'email', email: fields.email }
    : { channel: 'phone', email: fields.email, phone: fields.phone }

  try {
    const issued = await issuePasswordOtp(input)
    if (!issued.ok) return fail(req, contentType, issued.messageBn, issued.status)
    return succeed(req, contentType, issued.expiresInSec)
  } catch (err) {
    logAuthFailure(err, process.env, 'password reset failed')
    return fail(req, contentType, 'কোড পাঠানো যায়নি। আবার চেষ্টা করুন।', 500)
  }
}
