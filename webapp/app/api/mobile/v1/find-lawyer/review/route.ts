import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { newId } from '@/lib/crypto-tokens'
import { canSubmitLawyerReview, publicRatingPayload } from '@/lib/find-lawyer/review-policy'

const schema = z.object({
  requestId: z.string().min(8),
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(300).optional(),
})

async function recompute(profileId: string) {
  const agg = await prisma.lawyerReview.aggregate({
    where: { lawyerProfileId: profileId },
    _avg: { stars: true },
    _count: true,
  })
  const pub = publicRatingPayload(agg._avg.stars, agg._count)
  await prisma.lawyerProfile.update({
    where: { id: profileId },
    data: { ratingAvg: pub.ratingAvg },
  })
  return pub
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = schema.parse(await req.json())
  const lead = await prisma.consultationRequest.findFirst({
    where: { id: body.requestId },
    include: {
      lawyerProfile: { select: { id: true, userId: true } },
      review: true,
    },
  })
  if (!lead) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const decision = canSubmitLawyerReview({
    requesterUserId: user.id,
    lawyerUserId: lead.lawyerProfile.userId,
    phoneRevealedAt: lead.phoneRevealedAt,
    existingReview: Boolean(lead.review),
    stars: body.stars,
    requestBelongsToUser: lead.requesterUserId === user.id,
  })
  if (!decision.ok) {
    return NextResponse.json({ error: decision.error }, { status: 400 })
  }

  await prisma.lawyerReview.create({
    data: {
      id: newId(),
      lawyerProfileId: lead.lawyerProfileId,
      requesterUserId: user.id,
      requestId: lead.id,
      stars: body.stars,
      comment: body.comment || null,
    },
  })
  const pub = await recompute(lead.lawyerProfileId)
  return NextResponse.json({
    ok: true,
    ratingAvg: pub.ratingAvg,
    ratingCount: pub.ratingCount,
    messageBn: 'ধন্যবাদ। গড় রেটিং শুধু তখনই দেখা যায় যখন অন্তত একটি রিভিউ আছে।',
  })
}
