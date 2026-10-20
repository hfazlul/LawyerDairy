import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { withWorkspaceTx } from '@/lib/rls'

/** GDPR/Play-style data download of the signed-in user's identity + owned workspaces. */
export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const ownedIds = user.memberships
    .filter((m) => m.role === 'OWNER')
    .map((m) => m.workspaceId)

  const cases: Array<{
    id: string
    caseNo: string
    courtUid: string | null
    status: string
    nextDate: Date | null
    workspaceId: string
  }> = []
  const clients: Array<{
    id: string
    name: string
    phone: string | null
    email: string | null
    workspaceId: string
  }> = []

  for (const id of ownedIds) {
    const part = await withWorkspaceTx(id, async (tx) => ({
      cases: await tx.case.findMany({
        where: { workspaceId: id, deletedAt: null },
        select: { id: true, caseNo: true, courtUid: true, status: true, nextDate: true, workspaceId: true },
      }),
      clients: await tx.client.findMany({
        where: { workspaceId: id, deletedAt: null },
        select: { id: true, name: true, phone: true, email: true, workspaceId: true },
      }),
    }))
    cases.push(...part.cases)
    clients.push(...part.clients)
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      email: user.email,
    },
    workspaces: user.memberships.map((m) => ({
      id: m.workspaceId,
      name: m.workspace.name,
      kind: m.workspace.kind,
      role: m.role,
    })),
    cases,
    clients,
  })
}
