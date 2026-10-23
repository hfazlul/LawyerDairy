import { prisma } from '@/lib/prisma'
import { sendViaGmail } from '../mail/providers/gmail'
import { sendSmsHybrid } from '@/lib/sms-hybrid'
import { kSignupPhoneError, normalizeBdPhone } from '@/lib/identity'
import { generateNumericOtp, hashPasswordOtp, otpRequestMessage, OTP_TTL_MS } from '@/lib/auth/password-otp'
import { hasPasswordOtpSend, recordPasswordOtpSend, type OtpSendChannel } from './password-otp-quota'

export const OTP_EXPIRED_MESSAGE_BN = 'কোডের মেয়াদ শেষ। আবার চেষ্টা করুন।'
export const OTP_SMS_FAILED_MESSAGE_BN = 'এসএমএস পাঠানো যায়নি। আবার চেষ্টা করুন।'
export const OTP_EMAIL_FAILED_MESSAGE_BN = 'ইমেইল পাঠানো যায়নি। আবার চেষ্টা করুন।'
export const OTP_DAILY_LIMIT_BN = 'আজকের কোড নেওয়া হয়ে গেছে। কাল আবার চেষ্টা করুন।'
/** Same text for an unknown phone, an unknown email, and a mismatch. */
export const OTP_ACCOUNT_MISMATCH_BN = 'ইমেইল ও ফোন নম্বর মিলছে না।'

export type OtpIssueResult =
  | { ok: true; expiresInSec: number }
  | { ok: false; status: number; error: string; messageBn: string }

export type PasswordOtpInput =
  | { channel: 'email'; email: string }
  | { channel: 'phone'; email: string; phone: string }

type OtpUser = { id: string; phone: string; email: string | null }

export type PasswordOtpDeps = {
  findUserByEmail: (email: string) => Promise<OtpUser | null>
  findUserByEmailAndPhone: (email: string, phone: string) => Promise<OtpUser | null>
  storeChallenge: (row: { userId: string; phone: string; otp: string; expiresAt: Date }) => Promise<void>
  sendSms: (phone: string, message: string) => Promise<{ ok: boolean }>
  sendEmail: (to: string, subject: string, html: string) => Promise<{ ok: boolean }>
  alreadySent: (userId: string, channel: OtpSendChannel, now: Date) => Promise<boolean>
  recordSent: (userId: string, channel: OtpSendChannel, now: Date) => Promise<void>
  now: () => Date
  generateOtp: () => string
}

const selectUser = { id: true, phone: true, email: true } as const

function defaultDeps(): PasswordOtpDeps {
  return {
    now: () => new Date(),
    generateOtp: generateNumericOtp,
    async findUserByEmail(email) {
      return prisma.user.findFirst({
        where: { email, deletedAt: null },
        select: selectUser,
      })
    },
    async findUserByEmailAndPhone(email, phone) {
      return prisma.user.findFirst({
        where: { email, phone, deletedAt: null },
        select: selectUser,
      })
    },
    async storeChallenge(row) {
      await prisma.passwordOtpChallenge.updateMany({
        where: { userId: row.userId, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      })
      await prisma.passwordOtpChallenge.create({
        data: {
          userId: row.userId,
          phone: row.phone,
          otpHash: hashPasswordOtp(row.phone, row.otp),
          expiresAt: row.expiresAt,
        },
      })
    },
    async sendSms(phone, message) {
      const sent = await sendSmsHybrid({ phone, message, kind: 'password_otp', otp: true })
      return { ok: sent.ok }
    },
    async sendEmail(to, subject, html) {
      try {
        const sent = await sendViaGmail({ to, subject, html })
        return { ok: sent.ok === true && sent.dryRun === false }
      } catch {
        return { ok: false }
      }
    },
    alreadySent: hasPasswordOtpSend,
    recordSent: recordPasswordOtpSend,
  }
}

function dailyLimited(): OtpIssueResult {
  return { ok: false, status: 429, error: 'otp_daily_limit', messageBn: OTP_DAILY_LIMIT_BN }
}

function uniformOk(): OtpIssueResult {
  return { ok: true, expiresInSec: Math.round(OTP_TTL_MS / 1000) }
}

function mismatch(): OtpIssueResult {
  return { ok: false, status: 422, error: 'mismatch', messageBn: OTP_ACCOUNT_MISMATCH_BN }
}

function emailBody(otp: string): string {
  return `<p>আপনার ৬ সংখ্যার কোড: ${otp}</p><p>৫ মিনিটের মধ্যে ব্যবহার করুন।</p>`
}

/**
 * Stores a 5-minute OTP.
 * Email sends mail only. Phone sends SMS only after email and phone match one account.
 * Each channel is handed to Gmail or SMS once per Asia/Dhaka day, and only after the provider accepts it.
 */
export async function issuePasswordOtp(
  input: PasswordOtpInput,
  deps: Partial<PasswordOtpDeps> = {},
): Promise<OtpIssueResult> {
  const d: PasswordOtpDeps = { ...defaultDeps(), ...deps }
  if (input.channel === 'email') {
    const email = input.email.trim().toLowerCase()
    if (!email.includes('@') || !email.includes('.')) return uniformOk()
    const user = await d.findUserByEmail(email)
    if (!user?.phone || !user.email) return uniformOk()
    const now = d.now()
    if (await d.alreadySent(user.id, 'email', now)) return dailyLimited()
    const otp = d.generateOtp()
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS)
    await d.storeChallenge({ userId: user.id, phone: user.phone, otp, expiresAt })
    const sent = await d.sendEmail(user.email, 'MAMLAQ — পাসওয়ার্ড কোড', emailBody(otp))
    if (!sent.ok) {
      return { ok: false, status: 502, error: 'email_failed', messageBn: OTP_EMAIL_FAILED_MESSAGE_BN }
    }
    await d.recordSent(user.id, 'email', now)
    return uniformOk()
  }

  const email = input.email.trim().toLowerCase()
  const phone = normalizeBdPhone(input.phone)
  const local = phone ? `0${phone.slice(4)}` : ''
  if (!phone || !/^01[3-9]\d{8}$/.test(local)) {
    return { ok: false, status: 400, error: 'invalid_phone', messageBn: kSignupPhoneError }
  }
  if (!email.includes('@') || !email.includes('.')) return mismatch()
  const user = await d.findUserByEmailAndPhone(email, phone)
  if (!user?.phone) return mismatch()

  const now = d.now()
  if (await d.alreadySent(user.id, 'phone', now)) return dailyLimited()
  const otp = d.generateOtp()
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS)
  await d.storeChallenge({ userId: user.id, phone: user.phone, otp, expiresAt })
  const sent = await d.sendSms(user.phone, otpRequestMessage(otp))
  if (!sent.ok) {
    return { ok: false, status: 502, error: 'sms_failed', messageBn: OTP_SMS_FAILED_MESSAGE_BN }
  }
  await d.recordSent(user.id, 'phone', now)
  return uniformOk()
}
