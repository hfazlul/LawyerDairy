import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { extraTeamSeatsAllowed } from '@/lib/permissions'
import { isPremiumActive, webTrialActive } from '@/lib/entitlement-gates'
import { hashToken } from '@/lib/crypto-tokens'

const schema = z.object({ token: z.string().min(8) })

/** Logged-in user accepts invite. No OTP (locked §3.1 / §3.9). */
export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const invite = await prisma.invite.findUnique({
    where: { tokenHash: hashToken(body.token) },
    include: { workspace: true },
  })
  if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
    return NextResponse.json({ message: 'ইনভাইট অবৈধ বা মেয়াদ শেষ' }, { status: 404 })
  }

  const extras = await prisma.workspaceMember.count({
    where: {
      workspaceId: invite.workspaceId,
      role: { not: 'OWNER' },
      status: 'ACTIVE',
      deletedAt: null,
    },
  })
  const owner = await prisma.user.findFirst({
    where: { id: invite.workspace.ownerUserId, deletedAt: null },
  })
  const extrasAllowed = extraTeamSeatsAllowed(invite.workspace.plan, {
    paid: isPremiumActive(invite.workspace.plan, invite.workspace.planExpiresAt),
    trialActive: owner ? webTrialActive(owner.createdAt, owner.webTrialEndsAt) : false,
  })
  if (extras >= extrasAllowed) {
    return NextResponse.json({ message: 'সিট নেই' }, { status: 402 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id },
      },
      create: {
        workspaceId: invite.workspaceId,
        userId: user.id,
        role: invite.role,
        status: 'ACTIVE',
        scopeMode: invite.scopeMode,
        invitedByUserId: invite.invitedByUserId,
        joinedAt: new Date(),
      },
      update: {
        role: invite.role,
        status: 'ACTIVE',
        deletedAt: null,
        joinedAt: new Date(),
      },
    })
    await tx.invite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date(), acceptedByUserId: user.id },
    })
    await tx.auditLog.create({
      data: {
        workspaceId: invite.workspaceId,
        actorUserId: user.id,
        action: 'team.join',
        entity: 'workspace',
        entityId: invite.workspaceId,
        summaryBn: `${user.name} টিমে যোগ দিয়েছেন`,
      },
    })
  })

  return NextResponse.json({ ok: true, workspaceId: invite.workspaceId, name: invite.workspace.name })
}
