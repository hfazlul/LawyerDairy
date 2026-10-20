export function canPushDevice(d: {
  pushToken: string | null
  pushEnabled?: boolean | null
  revokedAt: Date | null
}): boolean {
  if (d.revokedAt) return false
  if (d.pushEnabled === false) return false
  if (!d.pushToken) return false
  return true
}

export function hearingOffset(hearingYmd: string, todayYmd: string): 0 | 1 | null {
  const days = diffDays(hearingYmd, todayYmd)
  if (days === 0) return 0
  if (days === 1) return 1
  return null
}

export function premiumOffset(expiresYmd: string, todayYmd: string): 3 | 4 | null {
  const days = diffDays(expiresYmd, todayYmd)
  if (days === 4) return 4
  if (days === 3) return 3
  return null
}

export function notifyUserId(c: {
  assignedToUserId: string | null
  createdByUserId: string
}): string {
  return c.assignedToUserId || c.createdByUserId
}

export function isUnregisteredFcmError(err: unknown): boolean {
  const code =
    typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : ''
  const message = err instanceof Error ? err.message : String(err)
  return (
    code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-registration-token' ||
    /Requested entity was not found/i.test(message) ||
    /UNREGISTERED/i.test(message)
  )
}

function diffDays(later: string, earlier: string): number {
  const [y1, m1, d1] = later.split('-').map(Number)
  const [y0, m0, d0] = earlier.split('-').map(Number)
  const a = Date.UTC(y1, m1 - 1, d1)
  const b = Date.UTC(y0, m0 - 1, d0)
  return Math.round((a - b) / 86_400_000)
}
