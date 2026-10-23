import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { isPremiumActive, webTrialActive } from '@/lib/entitlement-gates'
import { accountBilling } from '@/lib/full-access'
import { acceptJoinAsJunior, SeatLimitError } from '@/lib/team/chamber-share'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params

  const row = await prisma.joinRequest.findUnique({
    where: { id },
    include: { workspace: true },
  })
  if (!row || row.status !== 'PENDING') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }
  if (row.workspace.ownerUserId !== user.id) {
    return NextResponse.json({ message: 'শুধু মালিক গ্রহণ করতে পারেন' }, { status: 403 })
  }

  try {
    const billing = accountBilling(user, row.workspace.plan, row.workspace.planExpiresAt)
    await prisma.$transaction(async (tx) => {
      await acceptJoinAsJunior(tx, {
        workspaceId: row.workspaceId,
        workspacePlan: billing.plan,
        requesterUserId: row.requesterUserId,
        actorUserId: user.id,
        paid: isPremiumActive(billing.plan, billing.endsAt),
        trialActive: webTrialActive(user.createdAt, user.webTrialEndsAt),
      })
      await tx.joinRequest.update({
        where: { id: row.id },
        data: { status: 'ACCEPTED', decidedAt: new Date(), decidedByUserId: user.id },
      })
    })
  } catch (err) {
    if (err instanceof SeatLimitError) {
      return NextResponse.json({ message: 'সিট নেই' }, { status: 402 })
    }
    throw err
  }

  return NextResponse.json({
    ok: true,
    workspaceId: row.workspaceId,
    name: row.workspace.name,
    requesterUserId: row.requesterUserId,
  })
}
