/** Calendar-day streak in Asia/Dhaka (UTC+6, no DST). */

export function dhakaYmd(d: Date): string {
  const shifted = new Date(d.getTime() + 6 * 3600_000)
  return shifted.toISOString().slice(0, 10)
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const utc = Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days)
  return new Date(utc).toISOString().slice(0, 10)
}

/** If studied today keep streak; if yesterday increment; otherwise reset to 1. */
export function nextStreakDays(
  lastStudied: Date | null | undefined,
  current: number,
  now = new Date(),
): number {
  const today = dhakaYmd(now)
  if (!lastStudied) return 1
  const last = dhakaYmd(lastStudied)
  if (last === today) return Math.max(1, current || 1)
  if (last === addDaysYmd(today, -1)) return (current || 0) + 1
  return 1
}

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.max(0, xp) / 100) + 1)
}
