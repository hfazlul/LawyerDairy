import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAppRole } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const admin = await requireAppRole(req, ['ADMIN'])
  if (!admin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const rows = await prisma.lawyerVerification.findMany({
    where: { status: 'PENDING' },
    orderBy: { submittedAt: 'asc' },
    take: 200,
    include: {
      lawyerProfile: {
        select: {
          id: true,
          displayName: true,
          publicSlug: true,
          barRegNo: true,
          verificationStatus: true,
          verifiedAt: true,
          user: { select: { phone: true, username: true } },
        },
      },
    },
  })
  return NextResponse.json({ verifications: rows })
}

const schema = z.object({
  verificationId: z.string().min(8),
  action: z.enum(['verify', 'reject']),
  reason: z.string().max(400).optional(),
})

export async function POST(req: NextRequest) {
  const admin = await requireAppRole(req, ['ADMIN'])
  if (!admin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const row = await prisma.lawyerVerification.findUnique({
    where: { id: body.verificationId },
    include: { lawyerProfile: true },
  })
  if (!row) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const now = new Date()
  if (body.action === 'verify') {
    await prisma.$transaction([
      prisma.lawyerVerification.update({
        where: { id: row.id },
        data: {
          status: 'VERIFIED',
          reviewedByUserId: admin.id,
          reviewedAt: now,
          rejectionReason: null,
        },
      }),
      prisma.lawyerProfile.update({
        where: { id: row.lawyerProfileId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: now,
          barRegNo: row.barRegNo,
        },
      }),
    ])
    return NextResponse.json({ ok: true, verificationStatus: 'VERIFIED', verifiedAt: now.toISOString() })
  }

  await prisma.$transaction([
    prisma.lawyerVerification.update({
      where: { id: row.id },
      data: {
        status: 'REJECTED',
        reviewedByUserId: admin.id,
        reviewedAt: now,
        rejectionReason: body.reason || 'rejected',
      },
    }),
    prisma.lawyerProfile.update({
      where: { id: row.lawyerProfileId },
      data: {
        verificationStatus: 'REJECTED',
        verifiedAt: null,
        isListed: false,
      },
    }),
  ])
  return NextResponse.json({ ok: true, verificationStatus: 'REJECTED' })
}
