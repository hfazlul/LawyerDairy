import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { newId } from '@/lib/crypto-tokens'

const schema = z.object({
  barRegNo: z.string().trim().min(2).max(40),
  districtBarName: z.string().trim().max(80).optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = schema.parse(await req.json())
  const profile = await prisma.lawyerProfile.findUnique({ where: { userId: user.id } })
  if (!profile) {
    return NextResponse.json({ error: 'no_profile', messageBn: 'আগে প্রোফাইল তৈরি করুন' }, { status: 422 })
  }

  await prisma.$transaction([
    prisma.lawyerVerification.create({
      data: {
        id: newId(),
        lawyerProfileId: profile.id,
        barRegNo: body.barRegNo,
        districtBarName: body.districtBarName,
        status: 'PENDING',
      },
    }),
    prisma.lawyerProfile.update({
      where: { id: profile.id },
      data: { verificationStatus: 'PENDING', barRegNo: body.barRegNo },
    }),
  ])

  return NextResponse.json({
    ok: true,
    messageBn: 'যাচাইয়ের অনুরোধ জমা হয়েছে — ম্যানুয়াল রিভিউ। সার্টিফিকেট ফাইল এই ভার্সনে আপলোড হয় না।',
  })
}
