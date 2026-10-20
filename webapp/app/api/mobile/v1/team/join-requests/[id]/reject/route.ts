import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

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
    return NextResponse.json({ message: 'শুধু মালিক প্রত্যাখ্যান করতে পারেন' }, { status: 403 })
  }

  await prisma.joinRequest.update({
    where: { id: row.id },
    data: { status: 'REJECTED', decidedAt: new Date(), decidedByUserId: user.id },
  })
  return NextResponse.json({ ok: true })
}
