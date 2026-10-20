/** Oldest professional profile first. Verification is not a rank. */

export type DirectoryRankRow = {
  id?: string
  verificationStatus?: string | null
  verifiedAt?: Date | string | null
  profilePublishedAt?: Date | string | null
  createdAt?: Date | string | null
  completenessPct?: number | null
}

export function isDirectoryVerified(row: DirectoryRankRow): boolean {
  const st = String(row.verificationStatus || '').toUpperCase()
  if (st === 'VERIFIED' && row.verifiedAt) return true
  return false
}

function asDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function cmpDate(a: Date | null, b: Date | null): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.getTime() - b.getTime()
}

/** Matches mobile `FindLawyerRank.compare`: earlier profile first. */
export function compareDirectoryRows(a: DirectoryRankRow, b: DirectoryRankRow): number {
  const fifoA = asDate(a.profilePublishedAt) ?? asDate(a.createdAt)
  const fifoB = asDate(b.profilePublishedAt) ?? asDate(b.createdAt)
  const c2 = cmpDate(fifoA, fifoB)
  if (c2 !== 0) return c2
  return String(a.id || '').localeCompare(String(b.id || ''))
}

export const PRACTICE_LABELS: Record<string, { bn: string; en: string }> = {
  civil: { bn: 'দেওয়ানি', en: 'Civil' },
  criminal: { bn: 'ফৌজদারি', en: 'Criminal' },
  family: { bn: 'পারিবারিক', en: 'Family' },
  land: { bn: 'ভূমি', en: 'Land' },
  labour: { bn: 'শ্রম', en: 'Labour' },
  cheque: { bn: 'চেক', en: 'Cheque' },
}

export function practiceLabel(ids: string[]): string {
  const names = ids
    .map((id) => PRACTICE_LABELS[id]?.bn || '')
    .filter(Boolean)
  return names.join(' · ')
}
