import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { signupPhoneIssue } from '@/lib/identity'
import { issuePasswordOtp } from '@/lib/auth/issue-password-otp'
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

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const contentType = req.headers.get('content-type') || ''
  let identifier = ''
  try {
    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { identifier?: string; phone?: string }
      identifier = String(body.identifier || body.phone || '')
    } else {
      const fd = await req.formData()
      identifier = String(fd.get('identifier') || fd.get('phone') || '')
    }
  } catch {
    identifier = ''
  }

  const phoneIssue = signupPhoneIssue(identifier)
  if (phoneIssue) return fail(req, contentType, phoneIssue, 400)

  if (!isDev()) {
    const rl = rateLimit(`pwreset:${ip}`, 3, 60 * 60_000)
    if (!rl.ok) return fail(req, contentType, 'একটু পরে আবার চেষ্টা করুন।', 429)
  }

  try {
    const issued = await issuePasswordOtp(identifier)
    if (!issued.ok) return fail(req, contentType, issued.messageBn, issued.status)
    return succeed(req, contentType, issued.expiresInSec)
  } catch (err) {
    logAuthFailure(err, process.env, 'password reset failed')
    return fail(req, contentType, 'এসএমএস পাঠানো যায়নি। আবার চেষ্টা করুন।', 500)
  }
}
