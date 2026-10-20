import { randomInt } from 'crypto'
import { hashToken } from '@/lib/crypto-tokens'

export function generateNumericOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashPasswordOtp(phone: string, otp: string): string {
  const pepper = process.env.JWT_SECRET || 'otp-pepper'
  return hashToken(`${phone}:${otp}:${pepper}`)
}

export const OTP_TTL_MS = 10 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5

/** Public site people see in SMS. Not the API host. */
export const MAMLAQ_PUBLIC_SITE = 'https://mamlaq.com'

export function otpRequestMessage(otp: string): string {
  return `MAMLAQ-Lawyer Dairy\nYour 6 digit OTP is : ${otp}\n${MAMLAQ_PUBLIC_SITE}`
}
