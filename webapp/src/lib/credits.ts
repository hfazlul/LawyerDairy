import { dhakaYmd } from './habit'
import { monthlySmsCredits } from './permissions'
import type { Plan, Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient

export function periodYm(now = new Date()): string {
  return dhakaYmd(now).slice(0, 7)
}

/** Grant 20 (or plan included) credits at the start of each Dhaka calendar month. */
export async function ensureMonthlySmsGrant(
  tx: Tx,
  workspaceId: string,
  plan: Plan,
) {
  const ym = periodYm()
  const ws = await tx.workspace.findUnique({ where: { id: workspaceId } })
  if (!ws) return
  if (ws.smsGrantYm === ym) return
  const grant = monthlySmsCredits(plan)
  await tx.workspace.update({
    where: { id: workspaceId },
    data: {
      smsCredits: { increment: grant },
      smsGrantYm: ym,
    },
  })
}

export function smsSegments(body: string): number {
  const hasBangla = /[\u0980-\u09FF]/.test(body)
  const limit = hasBangla ? 70 : 160
  return Math.max(1, Math.ceil(body.length / limit))
}

export async function creditSnapshot(tx: Tx, workspaceId: string, plan: Plan) {
  await ensureMonthlySmsGrant(tx, workspaceId, plan)
  const ym = periodYm()
  const start = new Date(`${ym}-01T00:00:00+06:00`)
  const ws = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } })
  const usedAgg = await tx.communicationMessage.aggregate({
    where: {
      workspaceId,
      createdAt: { gte: start },
      creditsUsed: { gt: 0 },
      channel: 'sms',
    },
    _sum: { creditsUsed: true },
  })
  const used = usedAgg._sum.creditsUsed ?? 0
  const included = monthlySmsCredits(plan)
  return {
    period: ym,
    included,
    used,
    remaining: ws.smsCredits,
    pack: null,
    hintBn: 'এসএমএস কোটা প্রো+ প্যাকেজে অন্তর্ভুক্ত — আলাদা ৳৩৯৯ প্যাক নেই।',
  }
}
