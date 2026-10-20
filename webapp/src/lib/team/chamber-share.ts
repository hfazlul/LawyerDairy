import type { MemberRole, Plan, Prisma } from '@prisma/client'
import { extraTeamSeatsAllowed, juniorPresetKeys } from '@/lib/permissions'
import { newId } from '@/lib/crypto-tokens'

type Tx = Prisma.TransactionClient

export class SeatLimitError extends Error {
  constructor() {
    super('seat_limit')
    this.name = 'SeatLimitError'
  }
}

export async function extraActiveCount(tx: Tx, workspaceId: string): Promise<number> {
  return tx.workspaceMember.count({
    where: {
      workspaceId,
      role: { not: 'OWNER' },
      status: 'ACTIVE',
      deletedAt: null,
    },
  })
}

/** Owner-authenticated accept: Prisma membership + junior preset. Never trust client status=accepted alone. */
export async function acceptJoinAsJunior(
  tx: Tx,
  opts: {
    workspaceId: string
    workspacePlan: Plan
    requesterUserId: string
    actorUserId: string
    role?: MemberRole
    paid?: boolean
    trialActive?: boolean
  },
) {
  const extras = await extraActiveCount(tx, opts.workspaceId)
  const existing = await tx.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: opts.workspaceId, userId: opts.requesterUserId },
    },
  })
  const alreadyActive = existing?.status === 'ACTIVE' && !existing.deletedAt
  const seatCap = extraTeamSeatsAllowed(opts.workspacePlan, {
    paid: opts.paid ?? opts.workspacePlan !== 'FREE',
    trialActive: opts.trialActive ?? false,
  })
  if (!alreadyActive && extras >= seatCap) {
    throw new SeatLimitError()
  }

  const member = await tx.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId: opts.workspaceId, userId: opts.requesterUserId },
    },
    create: {
      workspaceId: opts.workspaceId,
      userId: opts.requesterUserId,
      role: opts.role ?? 'STAFF',
      status: 'ACTIVE',
      scopeMode: 'ALL',
      invitedByUserId: opts.actorUserId,
      joinedAt: new Date(),
      permissionsVersion: 1,
    },
    update: {
      role: opts.role ?? 'STAFF',
      status: 'ACTIVE',
      deletedAt: null,
      removedAt: null,
      suspendedAt: null,
      joinedAt: new Date(),
      permissionsVersion: { increment: 1 },
    },
  })

  await tx.memberPermission.deleteMany({ where: { workspaceMemberId: member.id } })
  const keys = juniorPresetKeys()
  if (keys.length) {
    await tx.memberPermission.createMany({
      data: keys.map((k) => ({
        id: newId(),
        workspaceMemberId: member.id,
        permissionKey: k.permissionKey,
        effect: k.effect,
        grantedByUserId: opts.actorUserId,
      })),
    })
  }

  await tx.auditLog.create({
    data: {
      workspaceId: opts.workspaceId,
      actorUserId: opts.actorUserId,
      action: 'team.join',
      entity: 'workspace',
      entityId: opts.workspaceId,
      summaryBn: 'চেম্বার জয়েন গৃহীত — জুনিয়র প্রিসেট',
    },
  })

  return member
}
