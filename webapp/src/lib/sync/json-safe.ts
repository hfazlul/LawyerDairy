const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)
const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER)

/** Prisma BigInt fields (fee paisa, file size) crash JSON.stringify and fail the whole download. */
export function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (typeof v === 'bigint') {
        if (v <= MAX_SAFE && v >= MIN_SAFE) return Number(v)
        return v.toString()
      }
      return v
    }),
  ) as T
}

/** Field names the installed phone reads while applying a pull row. */
export function shapeSyncRow(entity: string, row: unknown): unknown {
  const safe = jsonSafe(row)
  if (!safe || typeof safe !== 'object' || Array.isArray(safe)) return safe
  const data = { ...(safe as Record<string, unknown>) }
  if (entity === 'fee') {
    const paisa = typeof data.amountPaisa === 'number' ? data.amountPaisa : 0
    if (data.amount == null) data.amount = paisa / 100
    if (data.type == null) data.type = data.kind ?? 'received'
    if (data.date == null) data.date = data.dueDate ?? data.createdAt ?? null
  }
  if (entity === 'payment') {
    const paisa = typeof data.amountPaisa === 'number' ? data.amountPaisa : 0
    if (data.amount == null) data.amount = paisa / 100
    if (data.date == null) data.date = data.paidAt ?? data.createdAt ?? null
  }
  if (entity === 'document') {
    if (data.storageKey == null && data.remoteKey != null) data.storageKey = data.remoteKey
  }
  if (entity === 'case' && data.courtName == null && data.courtNameFree != null) {
    data.courtName = data.courtNameFree
  }
  return data
}
