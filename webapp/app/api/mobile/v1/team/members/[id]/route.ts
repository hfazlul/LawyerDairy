import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireWorkspace } from '@/lib/auth-middleware'
import { extraTeamSeatsAllowed } from '@/lib/permissions'
import { isPremiumActive, webTrialActive } from '@/lib/entitlement-gates'

const patchSchema = z.object({
  role: z.enum(['ADMIN', 'LAWYER', 'STAFF', 'VIEWER']).optional(),
  scopeMode: z.enum(['ALL', 'ASSIGNED_ONLY']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'REMOVED']).optional(),
  keys: z.array(z.object({
    permissionKey: z.string(),
    effect: z.enum(['ALLOW', 'DENY']),
  })).optional(),
})

export async function PATCH(
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

  let body: z.infer<typeof patchSchema>
  try {
    body = patchSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.update({
      where: { id },
      data: {
        role: body.role,
        scopeMode: body.scopeMode,
        status: body.status,
        suspendedAt: body.status === 'SUSPENDED' ? new Date() : undefined,
        removedAt: body.status === 'REMOVED' ? new Date() : undefined,
        deletedAt: body.status === 'REMOVED' ? new Date() : undefined,
        permissionsVersion: { increment: body.keys ? 1 : 0 },
      },
    })
    if (body.keys) {
      await tx.memberPermission.deleteMany({ where: { workspaceMemberId: id } })
      if (body.keys.length) {
        await tx.memberPermission.createMany({
          data: body.keys.map((k) => ({
            workspaceMemberId: id,
            permissionKey: k.permissionKey,
            effect: k.effect,
            grantedByUserId: user.id,
          })),
        })
      }
    }
    await tx.auditLog.create({
      data: {
        workspaceId: user.activeMembership!.workspaceId,
        actorUserId: user.id,
        action: 'team.patch',
        entity: 'member',
        entityId: id,
        summaryBn: 'সদস্যের ভূমিকা/অনুমতি হালনাগাদ',
      },
    })
  })

  const ws = user.activeMembership.workspace
  const owner = await prisma.user.findFirst({
    where: { id: ws.ownerUserId, deletedAt: null },
  })
  return NextResponse.json({
    ok: true,
    seatsAllowed: extraTeamSeatsAllowed(ws.plan, {
      paid: isPremiumActive(ws.plan, ws.planExpiresAt),
      trialActive: owner ? webTrialActive(owner.createdAt, owner.webTrialEndsAt) : false,
    }),
  })
}
