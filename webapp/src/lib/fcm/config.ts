export function fcmConfigured(): boolean {
  const json = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim()
  const path = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim()
  return Boolean(json || path)
}

export function parseServiceAccountJson(): Record<string, unknown> | null {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}
