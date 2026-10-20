/** Asia/Dhaka calendar helpers. No SMS. */

export function ymdInDhaka(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function addYmd(ymd: string, days: number): string {
  const [y, m, day] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, day + days))
  return dt.toISOString().slice(0, 10)
}

export function diffYmd(later: string, earlier: string): number {
  const [y1, m1, d1] = later.split('-').map(Number)
  const [y0, m0, d0] = earlier.split('-').map(Number)
  const a = Date.UTC(y1, m1 - 1, d1)
  const b = Date.UTC(y0, m0 - 1, d0)
  return Math.round((a - b) / 86_400_000)
}

/** Pad around a Dhaka civil day so UTC-stored timestamps still match. */
export function utcPadAroundDhakaYmd(ymd: string): { gte: Date; lt: Date } {
  const [y, m, d] = ymd.split('-').map(Number)
  // Dhaka is UTC+6; civil midnight ≈ previous day 18:00 UTC.
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 12 * 3600_000)
  const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0) + 12 * 3600_000)
  return { gte: start, lt: end }
}
