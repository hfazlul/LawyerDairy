import { prisma } from '@/lib/prisma'
import { dhakaYmd } from '../habit'

export type OtpSendChannel = 'email' | 'phone'

const sentKeys = new Set<string>()

/** user + channel + Asia/Dhaka calendar day. Email and phone do not share a slot. */
export function otpSendKey(userId: string, channel: OtpSendChannel, now: Date): string {
  return `${userId}:${channel}:${dhakaYmd(now)}`
}

export function resetOtpSendMemoryForTests(): void {
  sentKeys.clear()
}

export async function hasPasswordOtpSend(
  userId: string,
  channel: OtpSendChannel,
  now: Date,
): Promise<boolean> {
  const key = otpSendKey(userId, channel, now)
  if (sentKeys.has(key)) return true
  try {
    const row = await prisma.passwordOtpDailySend.findFirst({
      where: { userId, channel, dhakaDay: dhakaYmd(now) },
      select: { id: true },
    })
    if (row) sentKeys.add(key)
    return Boolean(row)
  } catch {
    return false
  }
}

/** Call only after Gmail, Brevo, or the SMS provider accepts the message. */
export async function recordPasswordOtpSend(
  userId: string,
  channel: OtpSendChannel,
  now: Date,
): Promise<void> {
  const key = otpSendKey(userId, channel, now)
  sentKeys.add(key)
  try {
    await prisma.passwordOtpDailySend.create({
      data: { userId, channel, dhakaDay: dhakaYmd(now) },
    })
  } catch {
    // Duplicate row, or the table is not on this database yet. This process still counts the handoff.
  }
}
