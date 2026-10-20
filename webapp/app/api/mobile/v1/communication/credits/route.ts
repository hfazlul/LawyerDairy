import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireWorkspace, planOf } from '@/lib/auth-middleware'
import { creditSnapshot } from '@/lib/credits'
import { setWorkspaceLocal } from '@/lib/rls'

export async function GET(req: NextRequest) {
  const user = await requireWorkspace(req)
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const wsId = user.activeMembership.workspaceId
  const snap = await prisma.$transaction(async (tx) => {
    await setWorkspaceLocal(tx, wsId)
    return creditSnapshot(tx, wsId, planOf(user))
  })
  return NextResponse.json(snap)
}
