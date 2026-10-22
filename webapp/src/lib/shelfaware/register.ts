import { prisma } from '@/lib/prisma'

function clip(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  return value.slice(0, max)
}

export async function upsertShelfDevice(body: Record<string, unknown>) {
  const installId = clip(body.installId, 80)?.trim() || ''
  if (!installId) throw new Error('bad_install')
  const data: {
    fcmToken?: string
    country?: string
    language?: string
    appVersion?: string
    premium?: boolean
    productId?: string | null
    validUntil?: Date | null
    autoRenewing?: boolean
    lastSeenAt: Date
  } = { lastSeenAt: new Date() }
  const token = clip(body.fcmToken, 512)
  if (token !== undefined) data.fcmToken = token
  const country = clip(body.country, 16)
  if (country !== undefined) data.country = country
  const language = clip(body.language, 16)
  if (language !== undefined) data.language = language
  const appVersion = clip(body.appVersion, 32)
  if (appVersion !== undefined) data.appVersion = appVersion
  if (typeof body.premium === 'boolean') data.premium = body.premium
  if (typeof body.productId === 'string') data.productId = body.productId.slice(0, 64) || null
  if (body.validUntilMs !== undefined) {
    const ms = Number(body.validUntilMs)
    data.validUntil = Number.isFinite(ms) && ms > 0 ? new Date(ms) : null
  }
  if (typeof body.autoRenewing === 'boolean') data.autoRenewing = body.autoRenewing

  const device = await prisma.shelfDevice.upsert({
    where: { installId },
    create: { installId, ...data },
    update: data,
  })
  return { ok: true, suspended: device.suspended }
}

export async function replaceShelfReminders(body: Record<string, unknown>) {
  const installId = clip(body.installId, 80)?.trim() || ''
  if (!installId) throw new Error('bad_install')
  const device = await prisma.shelfDevice.findUnique({ where: { installId } })
  if (!device) throw new Error('unknown_device')
  const items = Array.isArray(body.items) ? body.items.slice(0, 40) : []
  const keys: string[] = []
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Record<string, unknown>
    const itemKey = clip(item.itemKey, 64)?.trim()
    const title = clip(item.title, 120)?.trim()
    if (!itemKey || !title) continue
    const dueMs = Number(item.dueAtMs)
    if (!Number.isFinite(dueMs)) continue
    keys.push(itemKey)
    await prisma.shelfReminder.upsert({
      where: { deviceId_itemKey: { deviceId: device.id, itemKey } },
      create: {
        deviceId: device.id,
        itemKey,
        title,
        body: clip(item.body, 240) || title,
        dueAt: new Date(dueMs),
      },
      update: {
        title,
        body: clip(item.body, 240) || title,
        dueAt: new Date(dueMs),
        sentAt: null,
      },
    })
  }
  await prisma.shelfReminder.deleteMany({
    where: {
      deviceId: device.id,
      sentAt: null,
      ...(keys.length ? { itemKey: { notIn: keys } } : {}),
    },
  })
  return { ok: true, count: keys.length }
}

const LEDGER_KINDS = new Set(['ad_impression', 'subscription'])

export async function recordShelfEvent(body: Record<string, unknown>) {
  const kind = clip(body.kind, 32) || ''
  if (!LEDGER_KINDS.has(kind)) throw new Error('bad_kind')
  const micros = BigInt(Math.max(0, Math.trunc(Number(body.amountMicros) || 0)))
  await prisma.shelfLedgerEvent.create({
    data: {
      installId: clip(body.installId, 80) || '',
      kind,
      productId: clip(body.productId, 64) || null,
      amountMicros: micros,
      currency: (clip(body.currency, 8) || 'USD').toUpperCase(),
    },
  })
  return { ok: true }
}
