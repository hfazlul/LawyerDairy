import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { newId } from '@/lib/crypto-tokens'

const schema = z.object({
  lawyerProfileId: z.string(),
  reason: z.string().trim().min(3).max(200),
  note: z.string().trim().max(400).optional(),
  block: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = schema.parse(await req.json())
  if (body.lawyerProfileId === user.id) {
    return NextResponse.json({ message: 'invalid' }, { status: 400 })
  }

  await prisma.lawyerReport.upsert({
    where: {
      lawyerProfileId_reporterUserId: {
        lawyerProfileId: body.lawyerProfileId,
        reporterUserId: user.id,
      },
    },
    create: {
      id: newId(),
      lawyerProfileId: body.lawyerProfileId,
      reporterUserId: user.id,
      reason: body.reason,
      note: body.note,
    },
    update: { reason: body.reason, note: body.note },
  })

  if (body.block) {
    await prisma.lawyerBlock.upsert({
      where: {
        lawyerProfileId_blockedUserId: {
          lawyerProfileId: body.lawyerProfileId,
          blockedUserId: user.id,
        },
      },
      create: {
        id: newId(),
        lawyerProfileId: body.lawyerProfileId,
        blockedUserId: user.id,
        reason: body.reason,
      },
      update: { reason: body.reason },
    })
  }

  return NextResponse.json({ ok: true, messageBn: 'রিপোর্ট জমা হয়েছে' })
}
