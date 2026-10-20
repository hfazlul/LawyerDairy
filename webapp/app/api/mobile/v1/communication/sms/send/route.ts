import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, planOf } from '@/lib/auth-middleware'
import { creditSnapshot, ensureMonthlySmsGrant, smsSegments } from '@/lib/credits'
import { sendSmsHybrid } from '@/lib/sms-hybrid'
import { setWorkspaceLocal } from '@/lib/rls'
import { newId } from '@/lib/crypto-tokens'
import { isDhakaQuietHours } from '@/lib/dhaka-hours'

const schema = z.object({
  to: z.string().min(10),
  body: z.string().min(1).max(1000),
  clientId: z.string().optional(),
  caseId: z.string().optional(),
  templateKey: z.string().optional(),
  idempotencyKey: z.string().min(8).optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  if (!user.activeMembership.permissions.has('communication.send')) {
    return NextResponse.json({ error: 'permission', message: 'Forbidden' }, { status: 403 })
  }
  const wsId = user.activeMembership.workspaceId

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const key = body.idempotencyKey || newId()
  const existing = await prisma.communicationMessage.findUnique({ where: { idempotencyKey: key } })
  if (existing) {
    const snap = await prisma.$transaction(async (tx) => {
      await setWorkspaceLocal(tx, wsId)
      return creditSnapshot(tx, wsId, planOf(user))
    })
    return NextResponse.json({
      message_id: existing.id,
      segments: existing.creditsUsed,
      credits_used: existing.status === 'sent' ? existing.creditsUsed : 0,
      remaining: snap.remaining,
      status: existing.status,
      replayed: true,
    })
  }

  if (isDhakaQuietHours()) {
    const delayed = await prisma.communicationMessage.create({
      data: {
        id: newId(),
        workspaceId: wsId,
        channel: 'sms',
        toAddress: body.to,
        body: body.body,
        clientId: body.clientId,
        caseId: body.caseId,
        templateKey: body.templateKey,
        creditsUsed: 0,
        actorUserId: user.id,
        idempotencyKey: key,
        status: 'queued',
        errorCode: 'quiet_hours',
      },
    })
    return NextResponse.json(
      {
        message_id: delayed.id,
        status: 'delayed',
        error: 'quiet_hours',
        messageBn: 'রাত ৯টা–সকাল ৮টা (ঢাকা) — এখন পাঠানো হয়নি।',
      },
      { status: 202 },
    )
  }

  const segments = smsSegments(body.body)

  try {
    const result = await prisma.$transaction(async (tx) => {
      await setWorkspaceLocal(tx, wsId)
      await ensureMonthlySmsGrant(tx, wsId, planOf(user))
      const ws = await tx.workspace.findUniqueOrThrow({ where: { id: wsId } })
      if (ws.smsCredits < segments) {
        throw Object.assign(new Error('insufficient'), { code: 'NO_CREDITS', remaining: ws.smsCredits })
      }
      await tx.workspace.update({
        where: { id: wsId },
        data: { smsCredits: { decrement: segments } },
      })
      const msg = await tx.communicationMessage.create({
        data: {
          id: newId(),
          workspaceId: wsId,
          channel: 'sms',
          toAddress: body.to,
          body: body.body,
          clientId: body.clientId,
          caseId: body.caseId,
          templateKey: body.templateKey,
          creditsUsed: segments,
          actorUserId: user.id,
          idempotencyKey: key,
          status: 'queued',
          sentAt: null,
        },
      })
      return { msg, remaining: ws.smsCredits - segments }
    })

    try {
      const sent = await sendSmsHybrid({
        phone: body.to,
        message: body.body,
        kind: 'compose',
        workspaceId: wsId,
      })
      if (!sent.ok) throw new Error(sent.skipped || sent.error || 'gateway')
    } catch {
      await prisma.$transaction(async (tx) => {
        await setWorkspaceLocal(tx, wsId)
        await tx.workspace.update({
          where: { id: wsId },
          data: { smsCredits: { increment: segments } },
        })
        await tx.communicationMessage.update({
          where: { id: result.msg.id },
          data: { status: 'failed', errorCode: 'gateway', creditsUsed: 0 },
        })
      })
      const snap = await prisma.$transaction(async (tx) => {
        await setWorkspaceLocal(tx, wsId)
        return creditSnapshot(tx, wsId, planOf(user))
      })
      return NextResponse.json(
        {
          message_id: result.msg.id,
          segments,
          credits_used: 0,
          remaining: snap.remaining,
          status: 'failed',
          error: 'gateway',
        },
        { status: 502 },
      )
    }

    await prisma.communicationMessage.update({
      where: { id: result.msg.id },
      data: { status: 'sent', sentAt: new Date() },
    })

    return NextResponse.json({
      message_id: result.msg.id,
      segments,
      credits_used: segments,
      remaining: result.remaining,
      status: 'sent',
    })
  } catch (err) {
    const e = err as { code?: string; remaining?: number }
    if (e.code === 'NO_CREDITS') {
      return NextResponse.json(
        { error: 'insufficient_credits', remaining: e.remaining ?? 0, hint: 'Pro+ included SMS quotas — no SMS pack SKU' },
        { status: 402 },
      )
    }
    throw err
  }
}
