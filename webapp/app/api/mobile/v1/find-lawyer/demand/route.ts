import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { newId } from '@/lib/crypto-tokens'

const schema = z.object({
  districtId: z.string().min(2).max(40),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = schema.parse(await req.json())

  const existing = await prisma.districtDemandSignal.findFirst({
    where: { userId: user.id, districtId: body.districtId },
  })
  const row =
    existing ??
    (await prisma.districtDemandSignal.create({
      data: {
        id: newId(),
        userId: user.id,
        districtId: body.districtId,
      },
    }))

  return NextResponse.json({
    ok: true,
    districtId: row.districtId,
    messageBn: 'এই জেলায় আইনজীবী যুক্ত হলে জানাব।',
  })
}
