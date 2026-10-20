import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { acceptJoinAsJunior, SeatLimitError } from '@/lib/team/chamber-share'
import { newId } from '@/lib/crypto-tokens'

const schema = z.object({
  workspaceId: z.string().min(8),
  requesterUserId: z.string().min(8),
  firestoreRequestId: z.string().optional(),
  requesterName: z.string().max(80).optional(),
  requesterPhone: z.string().max(20).optional(),
  action: z.enum(['accept', 'reject']),
})

/**
 * Spark Firestore accept → Prisma membership so cases/clients sync.
 * Owner auth required. Client cannot POST status=accepted as a stranger.
 */
export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: body.workspaceId, deletedAt: null },
  })
  if (!workspace) {
    return NextResponse.json(
      { error: 'workspace_missing', messageBn: 'এই চেম্বার সার্ভারে নেই — আগে ওয়েবে চেম্বার তৈরি করুন।' },
      { status: 404 },
    )
  }
  if (workspace.ownerUserId !== user.id) {
    return NextResponse.json({ message: 'শুধু মালিক গ্রহণ করতে পারেন' }, { status: 403 })
  }

  const requester = await prisma.user.findFirst({
    where: { id: body.requesterUserId, deletedAt: null },
  })
  if (!requester) {
    return NextResponse.json({ message: 'সদস্য অ্যাকাউন্ট পাওয়া যায়নি' }, { status: 404 })
  }

  if (body.action === 'reject') {
    await prisma.joinRequest.upsert({
      where: { firestoreRequestId: body.firestoreRequestId || `reject-${body.workspaceId}-${body.requesterUserId}` },
      create: {
        id: newId(),
        workspaceId: workspace.id,
        requesterUserId: requester.id,
        requesterName: body.requesterName || requester.name,
        requesterPhone: body.requesterPhone || requester.phone,
        firestoreRequestId: body.firestoreRequestId || undefined,
        status: 'REJECTED',
        decidedAt: new Date(),
        decidedByUserId: user.id,
      },
      update: {
        status: 'REJECTED',
        decidedAt: new Date(),
        decidedByUserId: user.id,
      },
    })
    return NextResponse.json({ ok: true, status: 'REJECTED' })
  }

  try {
    const { isPremiumActive, webTrialActive } = await import('@/lib/entitlement-gates')
    const owner = await prisma.user.findFirst({
      where: { id: workspace.ownerUserId, deletedAt: null },
    })
    const paid = isPremiumActive(workspace.plan, workspace.planExpiresAt)
    const trialActive = owner
      ? webTrialActive(owner.createdAt, owner.webTrialEndsAt)
      : false
    await prisma.$transaction(async (tx) => {
      await acceptJoinAsJunior(tx, {
        workspaceId: workspace.id,
        workspacePlan: workspace.plan,
        requesterUserId: requester.id,
        actorUserId: user.id,
        paid,
        trialActive,
      })
      const fsId = body.firestoreRequestId || `fs-${workspace.id}-${requester.id}`
      await tx.joinRequest.upsert({
        where: { firestoreRequestId: fsId },
        create: {
          id: newId(),
          workspaceId: workspace.id,
          requesterUserId: requester.id,
          requesterName: body.requesterName || requester.name,
          requesterPhone: body.requesterPhone || requester.phone,
          firestoreRequestId: fsId,
          status: 'ACCEPTED',
          decidedAt: new Date(),
          decidedByUserId: user.id,
        },
        update: {
          status: 'ACCEPTED',
          decidedAt: new Date(),
          decidedByUserId: user.id,
        },
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
    status: 'ACCEPTED',
    workspaceId: workspace.id,
    name: workspace.name,
    requesterUserId: requester.id,
  })
}
