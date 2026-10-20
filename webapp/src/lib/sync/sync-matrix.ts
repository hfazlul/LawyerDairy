/** Pure sync-policy helpers for the §6.2 offline matrix (no DB). */

export const PUSH_PAGE_SIZE = 200
export const ENTITLEMENT_GRACE_DAYS = 8

export function outboxPagesNeeded(pendingCount: number, pageSize = PUSH_PAGE_SIZE): number {
  if (pendingCount <= 0) return 0
  return Math.ceil(pendingCount / pageSize)
}

export function isStaleBaseVersion(baseVersion: number, serverVersion: number): boolean {
  return baseVersion < serverVersion
}

export function replayOpId(priorLogged: boolean): 'skip_applied' | 'apply' {
  return priorLogged ? 'skip_applied' : 'apply'
}

/** A rejected or conflicted op must be tried again. Only a real apply is done. */
export function replayDecision(priorResult: string | null | undefined): 'skip_applied' | 'apply' {
  return priorResult === 'applied' ? 'skip_applied' : 'apply'
}

export function employeeMaySeeCase(
  scopeMode: 'ALL' | 'ASSIGNED_ONLY',
  assignedCaseIds: string[],
  caseId: string,
): boolean {
  if (scopeMode === 'ALL') return true
  return assignedCaseIds.includes(caseId)
}

export function entitlementStillValid(offlineDays: number, graceDays = ENTITLEMENT_GRACE_DAYS): boolean {
  return offlineDays <= graceDays
}

export function conflictKeepLocalNeedsNewOpId(conflictedOpId: string, nextOpId: string): boolean {
  return conflictedOpId !== nextOpId && nextOpId.length >= 8
}
