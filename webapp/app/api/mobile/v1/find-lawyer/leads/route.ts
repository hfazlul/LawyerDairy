import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const mine = await prisma.consultationRequest.findMany({
    where: { requesterUserId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      lawyerProfile: { select: { displayName: true, publicSlug: true, verificationStatus: true } },
      review: { select: { stars: true, createdAt: true } },
    },
  })
  const incomingProfile = await prisma.lawyerProfile.findUnique({ where: { userId: user.id } })
  const incoming = incomingProfile
    ? await prisma.consultationRequest.findMany({
        where: { lawyerProfileId: incomingProfile.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    : []
  return NextResponse.json({ myRequests: mine, incomingLeads: incoming })
}
