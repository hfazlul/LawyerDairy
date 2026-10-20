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

export function otpRequestMessage(otp: string): string {
  return `MAMLAQ পাসওয়ার্ড কোড ${otp}। ১০ মিনিট। কোড কাউকে দেবেন না।`
}
