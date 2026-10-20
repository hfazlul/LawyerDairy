import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireWorkspace } from '@/lib/auth-middleware'
import { extraTeamSeatsAllowed } from '@/lib/permissions'
import { isPremiumActive, webTrialActive } from '@/lib/entitlement-gates'
import { hashToken, randomOpaqueToken } from '@/lib/crypto-tokens'
import { normalizeBdPhone } from '@/lib/identity'

export async function GET(req: NextRequest) {
  const user = await requireWorkspace(req, 'team.view')
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const wsId = user.activeMembership.workspaceId
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: wsId, deletedAt: null, status: { not: 'REMOVED' } },
    include: {
      user: { select: { id: true, name: true, username: true, phone: true, email: true } },
      permissions: true,
    },
  })
  const invites = await prisma.invite.findMany({
    where: { workspaceId: wsId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })
  const extras = members.filter((m) => m.role !== 'OWNER').length
  const ws = user.activeMembership.workspace
  const owner = await prisma.user.findFirst({
    where: { id: ws.ownerUserId, deletedAt: null },
  })
  const extrasAllowed = extraTeamSeatsAllowed(ws.plan, {
    paid: isPremiumActive(ws.plan, ws.planExpiresAt),
    trialActive: owner ? webTrialActive(owner.createdAt, owner.webTrialEndsAt) : false,
  })
  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      username: m.user.username,
      phone: m.user.phone,
      role: m.role,
      status: m.status,
      scopeMode: m.scopeMode,
      permissions: m.permissions.map((p) => ({
        permissionKey: p.permissionKey,
        effect: p.effect,
      })),
    })),
    invites: invites.map((i) => ({
      id: i.id,
      phone: i.phone,
      email: i.email,
      role: i.role,
      status: i.status,
      expiresAt: i.expiresAt,
    })),
    seats: {
      extrasUsed: extras,
      extrasAllowed,
    },
  })
}

const inviteSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'LAWYER', 'STAFF', 'VIEWER']).default('STAFF'),
})

export async function POST(req: NextRequest) {
  const user = await requireWorkspace(req, 'team.invite')
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  const ws = user.activeMembership.workspace
  if (ws.kind === 'PERSONAL') {
    return NextResponse.json(
      { message: 'Personal workspace-এ টিম নেই — চেম্বার ওয়ার্কস্পেস তৈরি করুন' },
      { status: 400 },
    )
  }

  let body: z.infer<typeof inviteSchema>
  try {
    body = inviteSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const extras = await prisma.workspaceMember.count({
    where: {
      workspaceId: ws.id,
      role: { not: 'OWNER' },
      status: { in: ['ACTIVE', 'INVITED'] },
      deletedAt: null,
    },
  })
  const pending = await prisma.invite.count({
    where: { workspaceId: ws.id, status: 'PENDING' },
  })
  const owner = await prisma.user.findFirst({
    where: { id: ws.ownerUserId, deletedAt: null },
  })
  const extrasAllowed = extraTeamSeatsAllowed(ws.plan, {
    paid: isPremiumActive(ws.plan, ws.planExpiresAt),
    trialActive: owner ? webTrialActive(owner.createdAt, owner.webTrialEndsAt) : false,
  })
  if (extras + pending >= extrasAllowed) {
    return NextResponse.json(
      { message: `ফ্রি সিট শেষ (মালিক ছাড়া ${extrasAllowed} জন)` },
      { status: 402 },
    )
  }

  const phone = body.phone ? normalizeBdPhone(body.phone) : null
  const email = body.email ? body.email.toLowerCase() : null
  if (!phone && !email) {
    return NextResponse.json({ message: 'ফোন বা ইমেইল দিন' }, { status: 400 })
  }

  const token = randomOpaqueToken(24)
  const invite = await prisma.invite.create({
    data: {
      workspaceId: ws.id,
      phone,
      email,
      role: body.role,
      tokenHash: hashToken(token),
      invitedByUserId: user.id,
      expiresAt: new Date(Date.now() + 14 * 86400000),
    },
  })
  await prisma.auditLog.create({
    data: {
      workspaceId: ws.id,
      actorUserId: user.id,
      action: 'team.invite',
      entity: 'invite',
      entityId: invite.id,
      summaryBn: `${body.role} ইনভাইট পাঠানো হয়েছে`,
    },
  })
  return NextResponse.json({
    inviteId: invite.id,
    token,
    messageBn: 'ইনভাইট লিংক তৈরি — OTP নেই। প্রাপক লগইন করে টোকেন দিয়ে যোগ দেবেন।',
  }, { status: 201 })
}
