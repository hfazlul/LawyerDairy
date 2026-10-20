import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { newId } from '@/lib/crypto-tokens'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const due = await prisma.srsState.findMany({
    where: { userId: user.id, dueAt: { lte: new Date() } },
    orderBy: { dueAt: 'asc' },
    take: 40,
  })
  return NextResponse.json({ due })
}

const review = z.object({
  itemId: z.string().min(1),
  grade: z.enum(['again', 'hard', 'good', 'easy']).default('good'),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = review.parse(await req.json())
  const now = new Date()
  const existing = await prisma.srsState.findUnique({
    where: { userId_itemId: { userId: user.id, itemId: body.itemId } },
  })
  let ease = existing?.ease ?? 2.5
  let interval = existing?.intervalDays ?? 0
  let reps = existing?.reps ?? 0
  let lapses = existing?.lapses ?? 0
  if (body.grade === 'again') {
    interval = 1
    reps = 0
    lapses += 1
    ease = Math.max(1.3, ease - 0.2)
  } else {
    reps += 1
    if (body.grade === 'hard') {
      ease = Math.max(1.3, ease - 0.15)
      interval = Math.max(1, Math.round(interval * 1.2) || 1)
    } else if (body.grade === 'easy') {
      ease += 0.15
      interval = interval === 0 ? 4 : Math.round(interval * ease * 1.3)
    } else {
      interval = interval === 0 ? 1 : Math.round(interval * ease)
    }
  }
  const dueAt = new Date(now.getTime() + interval * 86400000)
  const row = await prisma.srsState.upsert({
    where: { userId_itemId: { userId: user.id, itemId: body.itemId } },
    create: {
      id: newId(),
      userId: user.id,
      itemId: body.itemId,
      ease,
      intervalDays: interval,
      dueAt,
      reps,
      lapses,
    },
    update: { ease, intervalDays: interval, dueAt, reps, lapses },
  })
  return NextResponse.json({ srs: row })
}
