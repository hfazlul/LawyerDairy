import { dhakaHour } from './dhaka-hours'
import { formatHearingDate, hearingSms } from './hearing-sms'

/** D-1 is on unless the lawyer turned that chip off. D-2 and D-3 stay off until turned on. */
export function hearingOffsets(flags: { smsD1: boolean; smsD2: boolean; smsD3: boolean }): number[] {
  const days: number[] = []
  if (flags.smsD1) days.push(1)
  if (flags.smsD2) days.push(2)
  if (flags.smsD3) days.push(3)
  return days
}

/** Auto hearing SMS runs from 10:00 through 20:59 Asia/Dhaka. Quiet hours wait. */
export function hearingAutoWindowOpen(now = new Date()): boolean {
  const hour = dhakaHour(now)
  return hour >= 10 && hour < 21
}

export function hearingClientMessage(input: {
  client: string
  ymd: string
  court: string
  lawyer: string
  gender?: string | null
}): string {
  const [, month, day] = input.ymd.split('-').map(Number)
  return hearingSms({
    gender: input.gender,
    client: input.client,
    date: formatHearingDate(day || 1, month || 1),
    court: input.court,
    lawyer: input.lawyer,
  })
}

/** Obvious whitelist test in the real hearing shape. Not a case. */
export function hearingWhitelistProbeMessage(): string {
  return hearingSms({
    client: 'হোয়াইটলিস্ট',
    date: formatHearingDate(25, 10),
    court: 'টেস্ট',
    lawyer: 'টেস্ট',
  })
}
