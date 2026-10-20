import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireWorkspace, planOf } from '@/lib/auth-middleware'
import { extraTeamSeats } from '@/lib/permissions'

/** Create a CHAMBER workspace owned by the current user (same account, not a second app). */
export async function POST(req: NextRequest) {
  const user = await requireWorkspace(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = z.object({ name: z.string().trim().min(2).max(80) }).safeParse(await req.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json({ message: 'চেম্বারের নাম দিন' }, { status: 400 })
  }

  const existing = await prisma.workspace.count({
    where: { ownerUserId: user.id, kind: 'CHAMBER', deletedAt: null },
  })
  if (existing >= 3) {
    return NextResponse.json({ message: 'সর্বোচ্চ ৩টি চেম্বার' }, { status: 400 })
  }

  const ws = await prisma.$transaction(async (tx) => {
    const created = await tx.workspace.create({
      data: {
        name: body.data.name,
        kind: 'CHAMBER',
        ownerUserId: user.id,
        plan: 'FREE',
        memberLimit: extraTeamSeats('FREE'),
        smsCredits: 20,
      },
    })
    await tx.workspaceMember.create({
      data: {
        workspaceId: created.id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
        scopeMode: 'ALL',
        joinedAt: new Date(),
      },
    })
    return created
  })

  return NextResponse.json({ workspace: { id: ws.id, name: ws.name, kind: ws.kind } }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const user = await requireWorkspace(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    workspaces: user.memberships.map((m) => ({
      id: m.workspaceId,
      name: m.workspace.name,
      kind: m.workspace.kind.toLowerCase(),
      role: m.role.toLowerCase(),
      plan: m.workspace.plan,
      permissions: [...m.permissions],
    })),
    plan: planOf(user),
  })
}
