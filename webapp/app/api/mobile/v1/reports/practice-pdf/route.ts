import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { generatePracticePdf } from '@/lib/pdf/practice-generator'
import { withWorkspaceTx } from '@/lib/rls'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const wsId = user.activeMembership.workspaceId
  const { searchParams } = new URL(req.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const now = new Date()
  const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1)
  const to = toStr ? new Date(toStr) : now

  const { cases, clients, hearings, fees } = await withWorkspaceTx(wsId, async (tx) => ({
    cases: await tx.case.findMany({ where: { workspaceId: wsId, deletedAt: null } }),
    clients: await tx.client.count({ where: { workspaceId: wsId, deletedAt: null } }),
    hearings: await tx.hearing.count({
      where: { workspaceId: wsId, deletedAt: null, date: { gte: from, lte: to } },
    }),
    fees: await tx.feeEntry.findMany({ where: { workspaceId: wsId, deletedAt: null } }),
  }))

  const byStatus: Record<string, number> = {}
  const byCourt: Record<string, number> = {}
  const caseNos = new Map<string, string>()
  for (const c of cases) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1
    const court = c.courtNameFree || c.courtUid || '—'
    byCourt[court] = (byCourt[court] ?? 0) + 1
    caseNos.set(c.id, c.caseNo)
  }

  const taka = (paisa: bigint) => Number(paisa) / 100
  let collected = 0
  const agreed = new Map<string, number>()
  const recv = new Map<string, number>()
  for (const f of fees) {
    const amt = taka(f.amountPaisa)
    if (f.kind === 'received') {
      collected += amt
      if (f.caseId) recv.set(f.caseId, (recv.get(f.caseId) ?? 0) + amt)
    }
    if (f.kind === 'feeAgreed' && f.caseId) {
      agreed.set(f.caseId, (agreed.get(f.caseId) ?? 0) + amt)
    }
  }
  const pending: { caseNo: string; due: number }[] = []
  for (const id of new Set([...agreed.keys(), ...recv.keys()])) {
    const due = (agreed.get(id) ?? 0) - (recv.get(id) ?? 0)
    if (due > 0) pending.push({ caseNo: caseNos.get(id) ?? id, due })
  }
  pending.sort((a, b) => b.due - a.due)

  const pdf = await generatePracticePdf({
    chamberName: user.activeMembership.workspace.name,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    byStatus,
    byCourt,
    hearings,
    clientCount: clients,
    collected,
    pending,
  })

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="practice-report.pdf"',
    },
  })
}
