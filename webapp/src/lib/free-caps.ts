/** Free-tier monthly caps. Month 1 of account vs every later month. */

export function freeMonthNumber(accountCreatedAt: Date, now = new Date()): number {
  return Math.max(
    1,
    (now.getUTCFullYear() - accountCreatedAt.getUTCFullYear()) * 12 +
      (now.getUTCMonth() - accountCreatedAt.getUTCMonth()) +
      1,
  )
}

export function freeCapsForMonth(monthNumber: number): {
  clients: number
  cases: number
  hearings: number
  findLawyerReceive: number
} {
  if (monthNumber <= 1) {
    return { clients: 20, cases: 20, hearings: 20, findLawyerReceive: 5 }
  }
  return { clients: 10, cases: 10, hearings: 10, findLawyerReceive: 3 }
}

export function findLawyerClientContactCap(isPaid: boolean): number {
  return isPaid ? Number.POSITIVE_INFINITY : 3
}
