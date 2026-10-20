import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireWorkspace } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const user = await requireWorkspace(req, 'audit.view')
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const rows = await prisma.auditLog.findMany({
    where: { workspaceId: user.activeMembership.workspaceId },
    orderBy: { occurredAt: 'desc' },
    take: 80,
  })
  return NextResponse.json({ activity: rows })
}
