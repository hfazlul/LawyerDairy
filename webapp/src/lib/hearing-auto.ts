import { dhakaHour } from './dhaka-hours'
import { isFullAccessAccount } from './full-access'
import { formatHearingDate, hearingSms } from './hearing-sms'
import { normalizeBdPhone } from './identity'

/**
 * Day chips the lawyer saved. D-1 stays on until they turn that chip off.
 * D-2 and D-3 stay off until turned on.
 * smsD1 defaults to true on every workspace, so this list is not an allow-list.
 * Only the full-access account's workspaces may be passed in for a real send.
 */
export function hearingOffsets(flags: { smsD1: boolean; smsD2: boolean; smsD3: boolean }): number[] {
  const days: number[] = []
  if (flags.smsD1) days.push(1)
  if (flags.smsD2) days.push(2)
  if (flags.smsD3) days.push(3)
  return days
}

/** Once per day until the lawyer saves another count. */
export const HEARING_TIMES_DEFAULT = 1
export const HEARING_TIMES_MAX = 3

export function hearingTimesPerDay(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return HEARING_TIMES_DEFAULT
  const n = Math.trunc(value)
  if (n < 1) return HEARING_TIMES_DEFAULT
  if (n > HEARING_TIMES_MAX) return HEARING_TIMES_MAX
  return n
}

/** Automatic hearing SMS is this account only. The smsD1 column default does not opt anyone else in. */
export function automaticHearingOwner(owner: {
  username?: string | null
  phone?: string | null
}): boolean {
  return isFullAccessAccount(owner)
}

/**
 * Unset means ON. Only an explicit false, saved by the lawyer, turns sending off.
 * Do not pass autoMessaging here: its schema default is false and must not silence this account.
 */
export function hearingAutomaticOn(explicit: boolean | null | undefined): boolean {
  return explicit !== false
}

/**
 * Primary client phone in +880 form. Missing client phone does not fall back
 * to the lawyer's own number.
 */
export function hearingClientRecipient(clientPhone: string | null | undefined): string | null {
  if (!clientPhone || !clientPhone.trim()) return null
  return normalizeBdPhone(clientPhone)
}

/** Slot 1 keeps the original key so a hearing already sent is not sent again. */
export function hearingIdempotencyKey(
  caseId: string,
  hearingYmd: string,
  offset: number,
  slot: number,
): string {
  const base = `sms|${caseId}|${hearingYmd}|${offset}`
  if (slot <= 1) return base
  return `${base}|${slot}`
}

export type HearingSlotRow = { idempotencyKey: string | null; status: string }

/**
 * Sends still allowed today for one client, hearing, and offset.
 * Sent rows count toward the cap. A failed or queued row is retried and does not open an extra slot.
 */
export function hearingSendSlots(input: {
  caseId: string
  hearingYmd: string
  offset: number
  timesPerDay: number | null | undefined
  existing: HearingSlotRow[]
}): { idem: string; retry: boolean }[] {
  const cap = hearingTimesPerDay(input.timesPerDay)
  const keys = Array.from({ length: cap }, (_, index) =>
    hearingIdempotencyKey(input.caseId, input.hearingYmd, input.offset, index + 1),
  )
  const byKey = new Map<string, HearingSlotRow>()
  for (const row of input.existing) {
    if (row.idempotencyKey && keys.includes(row.idempotencyKey)) byKey.set(row.idempotencyKey, row)
  }
  const sent = keys.filter((key) => byKey.get(key)?.status === 'sent').length
  const room = cap - sent
  if (room <= 0) return []
  const out: { idem: string; retry: boolean }[] = []
  for (const key of keys) {
    if (out.length >= room) break
    const row = byKey.get(key)
    if (row?.status === 'sent') continue
    out.push({ idem: key, retry: Boolean(row) })
  }
  return out
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
