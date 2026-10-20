import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  const profile = await prisma.lawyerProfile.findFirst({
    where: {
      publicSlug: slug,
      isListed: true,
      deletedAt: null,
      verificationStatus: { not: 'REJECTED' },
    },
    select: {
      id: true,
      publicSlug: true,
      displayName: true,
      photoUrl: true,
      degrees: true,
      enrolmentYear: true,
      aboutBn: true,
      aboutEn: true,
      districtIds: true,
      courtTypeIds: true,
      practiceAreaIds: true,
      caseTypeIds: true,
      verificationStatus: true,
      verifiedAt: true,
      createdAt: true,
      profilePublishedAt: true,
      completenessPct: true,
      responseMedianMins: true,
      ratingAvg: true,
      _count: { select: { reviews: true } },
    },
  })
  if (!profile) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  const count = profile._count.reviews
  const { _count, ratingAvg, ...rest } = profile
  return NextResponse.json({
    profile: {
      ...rest,
      ratingAvg: count > 0 ? ratingAvg : null,
      ratingCount: count,
    },
  })
}
