/** Central agent starts once per Asia/Dhaka day, at or after 09:00 (03:00 UTC). */
export const AGENT_START_HOUR_DHAKA = 9

export function dhakaParts(now = new Date()): { ymd: string; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const parts = Object.fromEntries(fmt.formatToParts(now).map((part) => [part.type, part.value]))
  let hour = Number(parts.hour)
  if (hour === 24) hour = 0
  return {
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
    hour,
    minute: Number(parts.minute),
  }
}

/** True when today's set time has arrived and this Dhaka day has not already started the agent. */
export function agentDue(hour: number, doneToday: boolean): boolean {
  return hour >= AGENT_START_HOUR_DHAKA && !doneToday
}

export function dayDone(detail: string | null | undefined, ymd: string): boolean {
  if (!detail) return false
  const day = /day=(\d{4}-\d{2}-\d{2})/.exec(detail)?.[1]
  if (day !== ymd) return false
  return /(?:^|\s)done=1(?:\s|$)/.test(detail)
}

export function dayRuns(detail: string | null | undefined, ymd: string): number {
  if (!detail) return 0
  const day = /day=(\d{4}-\d{2}-\d{2})/.exec(detail)?.[1]
  if (day !== ymd) return 0
  return Math.max(0, Math.trunc(Number(/runs=(\d+)/.exec(detail)?.[1] || 0)))
}

export function parseAgentResult(tail: string): { http: number; processed: number; resolved: number } | null {
  const lines = tail
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('{'))
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]) as {
        code?: number
        body?: { processed?: number; resolved?: number }
      }
      if (parsed.body == null && parsed.code == null) continue
      return {
        http: Number(parsed.code || 0),
        processed: Math.max(0, Math.trunc(Number(parsed.body?.processed || 0))),
        resolved: Math.max(0, Math.trunc(Number(parsed.body?.resolved || 0))),
      }
    } catch {
      continue
    }
  }
  return null
}

/** Strip credential-shaped fragments before a job tail is stored. */
export function redactJobTail(text: string): string {
  return text
    .replace(/key=[^&\s'"]+/gi, 'key=redacted')
    .replace(/Bearer\s+\S+/gi, 'Bearer redacted')
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, '[redacted-key]')
}
