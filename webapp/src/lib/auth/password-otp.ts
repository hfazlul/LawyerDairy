import { randomInt } from 'crypto'
import { hashToken } from '@/lib/crypto-tokens'

export function generateNumericOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashPasswordOtp(phone: string, otp: string): string {
  const pepper = process.env.JWT_SECRET || 'otp-pepper'
  return hashToken(`${phone}:${otp}:${pepper}`)
}

export const OTP_TTL_MS = 5 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5

/** Public site for non-OTP texts. */
export const MAMLAQ_PUBLIC_SITE = 'https://mamlaq.com'

/** Provider-whitelisted format: name, OTP line, bare domain. Any change breaks the whitelist. */
export function otpRequestMessage(otp: string): string {
  return `MAMLAQ-Lawyer Dairy\nYour forgot password 6 digit OTP is ${otp}\nmamlaq.com`
}
