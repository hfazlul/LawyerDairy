import { mailDailyLimit } from './config'

/**
 * Simple in-memory daily send counter (UTC day).
 * Enough for single-node awareness of Brevo free-tier (~300/day).
 * Not a durable queue — resets on process restart.
 */
type DayBucket = { day: string; count: number }

let bucket: DayBucket = { day: utcDay(), count: 0 }

function utcDay(): string {
  return new Date().toISOString().slice(0, 10)
}

function refresh(): void {
  const day = utcDay()
  if (bucket.day !== day) {
    bucket = { day, count: 0 }
  }
}

export function getDailySendStats(): {
  day: string
  sent: number
  limit: number
  remaining: number
} {
  refresh()
  const limit = mailDailyLimit()
  return {
    day: bucket.day,
    sent: bucket.count,
    limit,
    remaining: Math.max(0, limit - bucket.count),
  }
}

export function canSendWithinDailyLimit(count = 1): boolean {
  refresh()
  return bucket.count + count <= mailDailyLimit()
}

export function recordSends(count = 1): void {
  refresh()
  bucket.count += count
}
