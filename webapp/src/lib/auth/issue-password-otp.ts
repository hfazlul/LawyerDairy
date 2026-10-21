import { prisma } from '@/lib/prisma'
import { kPhoneNotRegisteredMessage, kSignupPhoneError, normalizeBdPhone } from '@/lib/identity'
import { sendSmsHybrid } from '@/lib/sms-hybrid'
import { generateNumericOtp, hashPasswordOtp, otpRequestMessage, OTP_TTL_MS } from '@/lib/auth/password-otp'

export const OTP_EXPIRED_MESSAGE_BN = 'কোডের মেয়াদ শেষ। আবার চেষ্টা করুন।'
export const OTP_SMS_FAILED_MESSAGE_BN = 'এসএমএস পাঠানো যায়নি। আবার চেষ্টা করুন।'

export type OtpIssueResult =
  | { ok: true; expiresInSec: number }
  | { ok: false; status: number; error: string; messageBn: string }

/**
 * Stores a 10-minute OTP and sends one personalized SMS.
 * Unknown or invalid numbers return before any provider call.
 */
export async function issuePasswordOtp(rawPhone: string): Promise<OtpIssueResult> {
  const phone = normalizeBdPhone(rawPhone)
  const local = phone ? `0${phone.slice(4)}` : ''
  if (!phone || !/^01[3-9]\d{8}$/.test(local)) {
    return { ok: false, status: 400, error: 'invalid_phone', messageBn: kSignupPhoneError }
  }

  const user = await prisma.user.findFirst({
    where: { phone, deletedAt: null },
    select: { id: true },
  })
  if (!user) {
    return {
      ok: false,
      status: 422,
      error: 'unknown_phone',
      messageBn: kPhoneNotRegisteredMessage,
    }
  }

  const otp = generateNumericOtp()
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)
  await prisma.passwordOtpChallenge.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  })
  await prisma.passwordOtpChallenge.create({
    data: {
      userId: user.id,
      phone,
      otpHash: hashPasswordOtp(phone, otp),
      expiresAt,
    },
  })

  const sent = await sendSmsHybrid({
    phone,
    message: otpRequestMessage(otp),
    kind: 'password_otp',
  })
  if (!sent.ok) {
    console.error('[otp] sms failed', {
      provider: sent.provider || '',
      skipped: sent.skipped || '',
      error: sent.error || 'failed',
    })
    return { ok: false, status: 502, error: 'sms_failed', messageBn: OTP_SMS_FAILED_MESSAGE_BN }
  }

  return { ok: true, expiresInSec: Math.round(OTP_TTL_MS / 1000) }
}
