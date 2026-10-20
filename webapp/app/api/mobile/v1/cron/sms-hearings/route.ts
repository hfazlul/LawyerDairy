import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { smsHybridConfigured, sendSmsHybrid } from '@/lib/sms-hybrid'
import { normalizeBdPhone } from '@/lib/identity'
import { isDhakaQuietHours } from '@/lib/dhaka-hours'
import { addYmd, utcPadAroundDhakaYmd, ymdInDhaka } from '@/lib/fcm/dhaka'
import { smsSegments, ensureMonthlySmsGrant } from '@/lib/credits'
import { newId } from '@/lib/crypto-tokens'
import { planHasAutoHearingSms } from '@/lib/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET
  const hdr =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return Boolean(secret && hdr === secret)
}

async function handle(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  if (!smsHybridConfigured()) {
    return NextResponse.json({ ok: true, skipped: 'sms_unconfigured', sent: 0 })
  }
  if (isDhakaQuietHours()) {
    return NextResponse.json({ ok: true, skipped: 'quiet_hours', sent: 0 })
  }

  const today = ymdInDhaka()
  let sent = 0
  let skipped = 0
  let failed = 0

  for (const offset of [1, 2, 3] as const) {
    const targetYmd = addYmd(today, offset)
    const pad = utcPadAroundDhakaYmd(targetYmd)
    const cases = await prisma.case.findMany({
      where: {
        deletedAt: null,
        status: 'active',
        nextDate: { gte: pad.gte, lt: pad.lt },
        workspace: {
          deletedAt: null,
          autoMessaging: true,
          ...(offset === 1 ? { smsD1: true } : {}),
          ...(offset === 2 ? { smsD2: true } : {}),
          ...(offset === 3 ? { smsD3: true } : {}),
        },
      },
      include: {
        workspace: { select: { id: true, plan: true, smsCredits: true, ownerUserId: true } },
        parties: {
          where: { deletedAt: null, isPrimary: true },
          take: 1,
        },
      },
      take: 400,
    })

    for (const c of cases) {
      if (!planHasAutoHearingSms(c.workspace.plan)) {
        skipped++
        continue
      }
      const flagOn =
        (offset === 1 && true) ||
        (offset === 2 && true) ||
        (offset === 3 && true)
      if (!flagOn) continue

      const muted = await prisma.device.count({
        where: { userId: c.workspace.ownerUserId, revokedAt: null, pushEnabled: true },
      })
      if (muted === 0) {
        skipped++
        continue
      }

      const phoneRaw = c.parties[0]?.phone
      const phone = phoneRaw ? normalizeBdPhone(phoneRaw) : null
      if (!phone) {
        skipped++
        continue
      }

      const idem = `sms|${c.id}|${targetYmd}|${offset}`
      const existing = await prisma.communicationMessage.findUnique({ where: { idempotencyKey: idem } })
      if (existing) {
        skipped++
        continue
      }

      const body = `আসসালামু আলাইকুম, আপনার মামলা ${c.caseNo}-এর শুনানি ${targetYmd}। উপস্থিত থাকুন।`
      const segments = smsSegments(body)
      try {
        await prisma.$transaction(async (tx) => {
          await ensureMonthlySmsGrant(tx, c.workspaceId, c.workspace.plan)
          const ws = await tx.workspace.findUniqueOrThrow({ where: { id: c.workspaceId } })
          if (ws.smsCredits < segments) throw Object.assign(new Error('no_credits'), { code: 'NO_CREDITS' })
          await tx.workspace.update({
            where: { id: c.workspaceId },
            data: { smsCredits: { decrement: segments } },
          })
          await tx.communicationMessage.create({
            data: {
              id: newId(),
              workspaceId: c.workspaceId,
              channel: 'sms',
              toAddress: phone,
              body,
              caseId: c.id,
              creditsUsed: segments,
              idempotencyKey: idem,
              status: 'queued',
            },
          })
        })
      } catch (err) {
        if ((err as { code?: string }).code === 'NO_CREDITS') {
          skipped++
          continue
        }
        failed++
        continue
      }

      const result = await sendSmsHybrid({
        phone,
        message: body,
        kind: `hearing_d${offset}`,
        workspaceId: c.workspaceId,
      })
      if (result.ok) {
        await prisma.communicationMessage.updateMany({
          where: { idempotencyKey: idem },
          data: { status: 'sent', sentAt: new Date() },
        })
        sent++
      } else {
        await prisma.$transaction(async (tx) => {
          await tx.workspace.update({
            where: { id: c.workspaceId },
            data: { smsCredits: { increment: segments } },
          })
          await tx.communicationMessage.updateMany({
            where: { idempotencyKey: idem },
            data: { status: 'failed', errorCode: result.skipped || result.error || 'gateway', creditsUsed: 0 },
          })
        })
        failed++
      }
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, failed, ymd: today })
}

export async function POST(req: NextRequest) {
  return handle(req)
}

export async function GET(req: NextRequest) {
  return handle(req)
}
