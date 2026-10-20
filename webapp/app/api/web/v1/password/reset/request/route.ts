import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { kPhoneNotRegisteredMessage, kSignupPhoneError, normalizeBdPhone, signupPhoneIssue } from '@/lib/identity'
import { hashToken, randomOpaqueToken } from '@/lib/crypto-tokens'
import { sendEmail } from '@/lib/email'
import { appBaseUrl } from '@/lib/app-url'
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
  if (wantsJson(req, contentType)) return NextResponse.json({ message }, { status })
  const url = sameOrigin(req, '/user/forgot')
  url.searchParams.set('error', message)
  return NextResponse.redirect(url, 303)
}

function succeed(req: NextRequest, contentType: string) {
  if (wantsJson(req, contentType)) return NextResponse.json({ ok: true })
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
    if (!rl.ok) return fail(req, contentType, 'Rate limited — try again later', 429)
  }

  const phone = normalizeBdPhone(identifier)
  if (!phone) return fail(req, contentType, kSignupPhoneError, 400)

  try {
    const user = await prisma.user.findFirst({
      where: { deletedAt: null, phone },
      select: { id: true, email: true },
    })
    if (!user) return fail(req, contentType, kPhoneNotRegisteredMessage, 404)

    if (user.email) {
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

    return succeed(req, contentType)
  } catch (err) {
    logAuthFailure(err, process.env, 'password reset failed')
    return fail(req, contentType, 'রিসেট লিংক পাঠানো যায়নি। আবার চেষ্টা করুন।', 500)
  }
}
