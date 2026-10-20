export const JoinApiAlphabet = 'ABCDEFGHJKLMNPQRTVWXYZ0123456789'

export function normalizeJoinCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

export function isPlausibleJoinCode(code: string): boolean {
  return /^[A-HJ-NP-TV-Z0-9]{6,8}$/i.test(normalizeJoinCode(code))
}
