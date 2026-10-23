import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, planOf } from '@/lib/auth-middleware'
import { creditSnapshot, ensureMonthlySmsGrant, smsSegments } from '@/lib/credits'
import { sendSmsHybrid } from '@/lib/sms-hybrid'
import { setWorkspaceLocal } from '@/lib/rls'
import { newId } from '@/lib/crypto-tokens'
import { isDhakaQuietHours } from '@/lib/dhaka-hours'
import { addYmd, utcPadAroundDhakaYmd, ymdInDhaka } from '@/lib/fcm/dhaka'
import { normalizeBdPhone } from '@/lib/identity'
import { isFullAccessAccount, COMING_SOON_BN } from '@/lib/full-access'
import { formatHearingDate, hearingSms } from '@/lib/hearing-sms'

const schema = z.object({
  lawyerName: z.string().trim().min(1).max(80),
  chamberName: z.string().trim().min(1).max(80),
  appearanceTime: z.string().trim().min(1).max(40),
})

function hearingDateLabel(ymd: string): string {
  const [, month, day] = ymd.split('-').map(Number)
  return formatHearingDate(day || 1, month || 1)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  if (!user.activeMembership.permissions.has('communication.send')) {
    return NextResponse.json({ error: 'permission', message: 'Forbidden' }, { status: 403 })
  }
  if (!isFullAccessAccount(user)) {
    return NextResponse.json({ error: 'coming_soon', messageBn: COMING_SOON_BN }, { status: 403 })
  }

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const wsId = user.activeMembership.workspaceId
  const plan = planOf(user)

  if (isDhakaQuietHours()) {
    const snap = await prisma.$transaction(async (tx) => {
      await setWorkspaceLocal(tx, wsId)
      return creditSnapshot(tx, wsId, plan)
    })
    return NextResponse.json(
      {
        status: 'delayed',
        error: 'quiet_hours',
        sent: 0,
        remaining: snap.remaining,
        messageBn: 'রাত ৯টা–সকাল ৮টা (ঢাকা) — এখন পাঠানো হয়নি।',
      },
      { status: 202 },
    )
  }

  const today = ymdInDhaka()
  let sent = 0
  let skipped = 0
  let failed = 0
  let remaining = 0

  for (const offset of [1, 2] as const) {
    const targetYmd = addYmd(today, offset)
    const pad = utcPadAroundDhakaYmd(targetYmd)
    const cases = await prisma.case.findMany({
      where: {
        workspaceId: wsId,
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
    const districtIds = cases.map((c) => c.districtId).filter((id): id is string => Boolean(id))
    const districtRows = districtIds.length
      ? await prisma.district.findMany({
          where: { id: { in: districtIds } },
          select: { id: true, nameBn: true },
        })
      : []
    const districtById = new Map(districtRows.map((row) => [row.id, row.nameBn]))

    for (const c of cases) {
      const phoneRaw = c.parties[0]?.phone
      const phone = phoneRaw ? normalizeBdPhone(phoneRaw) : null
      if (!phone) {
        skipped++
        continue
      }

      const idem = `sms|${c.id}|${targetYmd}|${offset}`
      const existing = await prisma.communicationMessage.findUnique({ where: { idempotencyKey: idem } })
      if (existing?.status === 'sent') {
        skipped++
        continue
      }

      const district =
        (c.districtId ? districtById.get(c.districtId) : undefined) ||
        c.court?.district?.nameBn ||
        ''
      // Client has no gender column, so an unknown record uses জনাব.
      const message = hearingSms({
        gender: null,
        client: c.parties[0]?.partyName || 'মক্কেল',
        date: hearingDateLabel(targetYmd),
        court: district,
        lawyer: body.lawyerName,
      })
      const segments = smsSegments(message)

      try {
        const reserved = await prisma.$transaction(async (tx) => {
          await setWorkspaceLocal(tx, wsId)
          await ensureMonthlySmsGrant(tx, wsId, plan)
          const ws = await tx.workspace.findUniqueOrThrow({ where: { id: wsId } })
          if (ws.smsCredits < segments) {
            throw Object.assign(new Error('no_credits'), { code: 'NO_CREDITS', remaining: ws.smsCredits })
          }
          await tx.workspace.update({
            where: { id: wsId },
            data: { smsCredits: { decrement: segments } },
          })
          if (!existing) {
            await tx.communicationMessage.create({
              data: {
                id: newId(),
                workspaceId: wsId,
                channel: 'sms',
                toAddress: phone,
                body: message,
                caseId: c.id,
                creditsUsed: segments,
                actorUserId: user.id,
                idempotencyKey: idem,
                templateKey: 'hearing_reminder',
                status: 'queued',
              },
            })
          } else {
            await tx.communicationMessage.update({
              where: { id: existing.id },
              data: { body: message, status: 'queued', creditsUsed: segments, errorCode: null },
            })
          }
          return ws.smsCredits - segments
        })
        remaining = reserved
      } catch (err) {
        if ((err as { code?: string }).code === 'NO_CREDITS') {
          skipped++
          remaining = (err as { remaining?: number }).remaining ?? remaining
          continue
        }
        failed++
        continue
      }

      const result = await sendSmsHybrid({
        phone,
        message,
        kind: `hearing_d${offset}`,
        workspaceId: wsId,
      })
      if (result.ok) {
        await prisma.communicationMessage.updateMany({
          where: { idempotencyKey: idem },
          data: { status: 'sent', sentAt: new Date() },
        })
        sent++
      } else {
        await prisma.$transaction(async (tx) => {
          await setWorkspaceLocal(tx, wsId)
          await tx.workspace.update({
            where: { id: wsId },
            data: { smsCredits: { increment: segments } },
          })
          const ws = await tx.workspace.findUniqueOrThrow({ where: { id: wsId } })
          remaining = ws.smsCredits
          await tx.communicationMessage.updateMany({
            where: { idempotencyKey: idem },
            data: { status: 'failed', errorCode: result.skipped || result.error || 'gateway', creditsUsed: 0 },
          })
        })
        failed++
      }
    }
  }

  const snap = await prisma.$transaction(async (tx) => {
    await setWorkspaceLocal(tx, wsId)
    return creditSnapshot(tx, wsId, plan)
  })

  return NextResponse.json({
    ok: failed === 0,
    sent,
    skipped,
    failed,
    remaining: snap.remaining ?? remaining,
    included: snap.included,
  })
}
