import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireWorkspace } from '@/lib/auth-middleware'
import { juniorPresetKeys } from '@/lib/permissions'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireWorkspace(req, 'team.manage')
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  const { id } = await ctx.params
  const member = await prisma.workspaceMember.findFirst({
    where: { id, workspaceId: user.activeMembership.workspaceId },
  })
  if (!member) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (member.role === 'OWNER') {
    return NextResponse.json({ message: 'মালিক পরিবর্তন করা যায় না' }, { status: 400 })
  }

  const keys = juniorPresetKeys()
  await prisma.$transaction(async (tx) => {
    await tx.memberPermission.deleteMany({ where: { workspaceMemberId: id } })
    if (keys.length) {
      await tx.memberPermission.createMany({
        data: keys.map((k) => ({
          workspaceMemberId: id,
          permissionKey: k.permissionKey,
          effect: k.effect,
          grantedByUserId: user.id,
        })),
      })
    }
    await tx.workspaceMember.update({
      where: { id },
      data: { permissionsVersion: { increment: 1 }, role: 'STAFF' },
    })
  })
  return NextResponse.json({ ok: true, preset: 'junior', keys })
}
