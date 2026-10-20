import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspace } from '@/lib/auth-middleware'
import { withWorkspaceTx } from '@/lib/rls'

export async function GET(req: NextRequest) {
  const user = await requireWorkspace(req, 'reports.view')
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const wsId = user.activeMembership.workspaceId
  return withWorkspaceTx(wsId, async (tx) => {
    const [cases, clients, fees, hearings] = await Promise.all([
      tx.case.groupBy({ by: ['status'], where: { workspaceId: wsId, deletedAt: null }, _count: true }),
      tx.client.count({ where: { workspaceId: wsId, deletedAt: null } }),
      tx.feeEntry.aggregate({
        where: { workspaceId: wsId, deletedAt: null },
        _sum: { amountPaisa: true },
        _count: true,
      }),
      tx.hearing.count({
        where: {
          workspaceId: wsId,
          deletedAt: null,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ])
    return NextResponse.json({
      casesByStatus: cases,
      clientCount: clients,
      feeCount: fees._count,
      feePaisa: fees._sum.amountPaisa?.toString() ?? '0',
      upcomingHearings: hearings,
    })
  })
}
