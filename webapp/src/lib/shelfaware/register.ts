import { prisma } from '@/lib/prisma'
import { composeShelfReminder, type ShelfSlots } from './messages'

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

function intSlot(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value.trim())
  return undefined
}

function slotsOf(item: Record<string, unknown>): ShelfSlots {
  return {
    name: clip(item.name, 120)?.trim(),
    count: intSlot(item.count),
    days: intSlot(item.days),
    percent: intSlot(item.percent),
    saved: clip(item.saved, 40)?.trim(),
    wasted: clip(item.wasted, 40)?.trim(),
    score: intSlot(item.score),
    streak: intSlot(item.streak),
    price: clip(item.price, 40)?.trim(),
    categoryLabel: clip(item.categoryLabel, 80)?.trim(),
    unchecked: intSlot(item.unchecked),
    notes: clip(item.notes, 400)?.trim(),
    requester: clip(item.requester, 80)?.trim(),
    sender: clip(item.sender, 80)?.trim(),
  }
}

export async function replaceShelfReminders(body: Record<string, unknown>) {
  const installId = clip(body.installId, 80)?.trim() || ''
  if (!installId) throw new Error('bad_install')
  const device = await prisma.shelfDevice.findUnique({ where: { installId } })
  if (!device) throw new Error('unknown_device')
  const items = Array.isArray(body.items) ? body.items.slice(0, 80) : []
  const keys: string[] = []
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Record<string, unknown>
    const itemKey = clip(item.itemKey, 80)?.trim()
    if (!itemKey) continue
    const dueMs = Number(item.dueAtMs)
    if (!Number.isFinite(dueMs)) continue
    const text = composeShelfReminder({
      language: device.language,
      kind: clip(item.kind, 40)?.trim(),
      title: clip(item.title, 200)?.trim(),
      body: clip(item.body, 500)?.trim(),
      slots: slotsOf(item),
    })
    if (!text) continue
    keys.push(itemKey)
    await prisma.shelfReminder.upsert({
      where: { deviceId_itemKey: { deviceId: device.id, itemKey } },
      create: {
        deviceId: device.id,
        itemKey,
        title: text.title.slice(0, 200),
        body: text.body.slice(0, 500),
        dueAt: new Date(dueMs),
      },
      update: {
        title: text.title.slice(0, 200),
        body: text.body.slice(0, 500),
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
