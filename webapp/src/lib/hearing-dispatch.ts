import type { Plan } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ensureMonthlySmsGrant, smsSegments } from '@/lib/credits'
import { addYmd, utcPadAroundDhakaYmd, ymdInDhaka } from '@/lib/fcm/dhaka'
import { FULL_ACCESS_PHONE, FULL_ACCESS_USERNAME, fullAccessPlan } from '@/lib/full-access'
import {
  automaticHearingOwner,
  hearingAutomaticOn,
  hearingAutoWindowOpen,
  hearingClientMessage,
  hearingClientRecipient,
  hearingIdempotencyKey,
  hearingOffsets,
  hearingSendSlots,
  hearingTimesPerDay,
} from '@/lib/hearing-auto'
import { newId } from '@/lib/crypto-tokens'
import { setWorkspaceLocal } from '@/lib/rls'
import { sendBulkSms24Messages } from '@/lib/sms-hybrid'

const BATCH = 40

type Pending = {
  idem: string
  phone: string
  message: string
  segments: number
  caseId: string
  reserve: boolean
}

/**
 * Daily hearing SMS for workspaces owned by the one full-access account.
 * A null switch means they never saved it, so sending stays on: one day before,
 * once, until they save other day chips or a times-per-day count.
 * Explicit smsAutoEnabled false stops that account until they save on again.
 * Other accounts are not selected. Each client gets the existing hearing sentence.
 * Nothing is sent before 10:00 Dhaka, during quiet hours, or when every day chip is off.
 */
export async function dispatchAutomaticHearings(now = new Date()): Promise<{
  sent: number
  skipped: number
  failed: number
  workspaces: number
}> {
  if (!hearingAutoWindowOpen(now)) {
    return { sent: 0, skipped: 0, failed: 0, workspaces: 0 }
  }
  const today = ymdInDhaka(now)
  const workspaces = await prisma.workspace.findMany({
    where: {
      deletedAt: null,
      owner: {
        deletedAt: null,
        OR: [
          { username: { equals: FULL_ACCESS_USERNAME, mode: 'insensitive' } },
          { phone: { in: [FULL_ACCESS_PHONE, '01858173601', '8801858173601'] } },
        ],
      },
    },
    include: { owner: { select: { id: true, name: true, username: true, phone: true } } },
    take: 20,
  })
  let sent = 0
  let skipped = 0
  let failed = 0
  for (const ws of workspaces) {
    if (!automaticHearingOwner(ws.owner)) {
      skipped++
      continue
    }
    if (!hearingAutomaticOn(ws.smsAutoEnabled)) {
      skipped++
      continue
    }
    const offsets = hearingOffsets(ws)
    if (!offsets.length) {
      skipped++
      continue
    }
    try {
      const outcome = await sendWorkspace(
        ws.id,
        ws.owner.name,
        fullAccessPlan(ws.owner, ws.plan),
        offsets,
        hearingTimesPerDay(ws.smsTimesPerDay),
        today,
        ws.owner.id,
      )
      sent += outcome.sent
      skipped += outcome.skipped
      failed += outcome.failed
    } catch {
      failed++
    }
  }
  return { sent, skipped, failed, workspaces: workspaces.length }
}

async function sendWorkspace(
  workspaceId: string,
  lawyerName: string,
  plan: Plan,
  offsets: number[],
  timesPerDay: number,
  today: string,
  actorUserId: string,
): Promise<{ sent: number; skipped: number; failed: number }> {
  const pending: Pending[] = []
  let skipped = 0
  for (const offset of offsets) {
    const targetYmd = addYmd(today, offset)
    const pad = utcPadAroundDhakaYmd(targetYmd)
    const cases = await prisma.case.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        status: 'active',
        nextDate: { gte: pad.gte, lt: pad.lt },
      },
      include: {
        court: { select: { district: { select: { nameBn: true } } } },
        parties: { where: { deletedAt: null, isPrimary: true }, take: 1 },
      },
      take: 200,
    })
    const districtIds = cases.map((row) => row.districtId).filter((id): id is string => Boolean(id))
    const districtRows = districtIds.length
      ? await prisma.district.findMany({
          where: { id: { in: districtIds } },
          select: { id: true, nameBn: true },
        })
      : []
    const districtById = new Map(districtRows.map((row) => [row.id, row.nameBn]))
    const targets: { row: (typeof cases)[number]; phone: string }[] = []
    for (const row of cases) {
      const phone = hearingClientRecipient(row.parties[0]?.phone)
      if (!phone) {
        skipped++
        continue
      }
      targets.push({ row, phone })
    }
    const cap = hearingTimesPerDay(timesPerDay)
    const keys = targets.flatMap(({ row }) =>
      Array.from({ length: cap }, (_, index) => hearingIdempotencyKey(row.id, targetYmd, offset, index + 1)),
    )
    const existingRows = keys.length
      ? await prisma.communicationMessage.findMany({
          where: { idempotencyKey: { in: keys } },
          select: { idempotencyKey: true, status: true, creditsUsed: true },
        })
      : []
    const existingByKey = new Map(
      existingRows.flatMap((item) => (item.idempotencyKey ? [[item.idempotencyKey, item] as const] : [])),
    )
    for (const { row, phone } of targets) {
      const slots = hearingSendSlots({
        caseId: row.id,
        hearingYmd: targetYmd,
        offset,
        timesPerDay: cap,
        existing: existingRows,
      })
      if (!slots.length) {
        skipped++
        continue
      }
      const district =
        (row.districtId ? districtById.get(row.districtId) : undefined) || row.court?.district?.nameBn || ''
      const message = hearingClientMessage({
        client: row.parties[0]?.partyName || 'মক্কেল',
        ymd: targetYmd,
        court: district,
        lawyer: lawyerName,
      })
      for (const slot of slots) {
        const existing = existingByKey.get(slot.idem)
        pending.push({
          idem: slot.idem,
          phone,
          message,
          segments: smsSegments(message),
          caseId: row.id,
          reserve: !existing || existing.creditsUsed === 0,
        })
      }
    }
  }
  if (!pending.length) return { sent: 0, skipped, failed: 0 }

  const reserved = await prisma.$transaction(async (tx) => {
    await setWorkspaceLocal(tx, workspaceId)
    await ensureMonthlySmsGrant(tx, workspaceId, plan)
    const current = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } })
    let credits = current.smsCredits
    const take: Pending[] = []
    let noCredit = 0
    for (const item of pending) {
      if (item.reserve && credits < item.segments) {
        noCredit++
        continue
      }
      if (item.reserve) credits -= item.segments
      take.push(item)
    }
    const cost = take.reduce((sum, item) => sum + (item.reserve ? item.segments : 0), 0)
    if (cost > 0) {
      await tx.workspace.update({
        where: { id: workspaceId },
        data: { smsCredits: { decrement: cost } },
      })
    }
    for (const item of take) {
      const existing = await tx.communicationMessage.findUnique({ where: { idempotencyKey: item.idem } })
      if (!existing) {
        await tx.communicationMessage.create({
          data: {
            id: newId(),
            workspaceId,
            channel: 'sms',
            toAddress: item.phone,
            body: item.message,
            caseId: item.caseId,
            creditsUsed: item.segments,
            actorUserId,
            idempotencyKey: item.idem,
            templateKey: 'hearing_reminder',
            status: 'queued',
          },
        })
      } else {
        await tx.communicationMessage.update({
          where: { id: existing.id },
          data: {
            body: item.message,
            status: 'queued',
            creditsUsed: item.reserve ? item.segments : existing.creditsUsed,
            errorCode: null,
          },
        })
      }
    }
    return { take, noCredit }
  })
  skipped += reserved.noCredit
  const queued = reserved.take

  if (!queued.length) return { sent: 0, skipped, failed: 0 }

  let sent = 0
  let failed = 0
  for (let i = 0; i < queued.length; i += BATCH) {
    const chunk = queued.slice(i, i + BATCH)
    const result = await sendBulkSms24Messages(chunk.map((item) => ({ to: item.phone, message: item.message })))
    if (result.ok) {
      await prisma.communicationMessage.updateMany({
        where: { idempotencyKey: { in: chunk.map((item) => item.idem) } },
        data: { status: 'sent', sentAt: new Date() },
      })
      sent += chunk.length
      continue
    }
    const refund = chunk.reduce((sum, item) => sum + (item.reserve ? item.segments : 0), 0)
    await prisma.$transaction(async (tx) => {
      await setWorkspaceLocal(tx, workspaceId)
      if (refund > 0) {
        await tx.workspace.update({
          where: { id: workspaceId },
          data: { smsCredits: { increment: refund } },
        })
      }
      const charged = chunk.filter((item) => item.reserve).map((item) => item.idem)
      if (charged.length) {
        await tx.communicationMessage.updateMany({
          where: { idempotencyKey: { in: charged } },
          data: { status: 'failed', errorCode: result.skipped || result.error || 'gateway', creditsUsed: 0 },
        })
      }
      const keep = chunk.filter((item) => !item.reserve).map((item) => item.idem)
      if (keep.length) {
        await tx.communicationMessage.updateMany({
          where: { idempotencyKey: { in: keep } },
          data: { status: 'failed', errorCode: result.skipped || result.error || 'gateway' },
        })
      }
    })
    failed += chunk.length
  }
  return { sent, skipped, failed }
}
