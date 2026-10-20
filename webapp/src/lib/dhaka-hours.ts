import { ymdInDhaka } from '@/lib/fcm/dhaka'

/** Quiet hours 21:00–08:00 Asia/Dhaka. OTP is not gated by this. */
export function dhakaHour(now = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    hour12: false,
  }).format(now)
  return Number(hour)
}

export function isDhakaQuietHours(now = new Date()): boolean {
  const h = dhakaHour(now)
  return h >= 21 || h < 8
}

/** Sunday-start Sun–Thu week used by diary print. */
export function weekRangeFromStart(weekStartYmd: string): { start: Date; end: Date; days: string[] } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartYmd)) {
    throw new Error('invalid_week_start')
  }
  const [y, m, d] = weekStartYmd.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 6 * 3600_000)
  const days: string[] = []
  for (let i = 0; i < 5; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i))
    days.push(dt.toISOString().slice(0, 10))
  }
  const end = new Date(Date.UTC(y, m - 1, d + 4, 23, 59, 59) + 6 * 3600_000)
  return { start, end, days }
}

export { ymdInDhaka }
