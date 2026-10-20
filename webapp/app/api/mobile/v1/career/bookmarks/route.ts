import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { newId } from '@/lib/crypto-tokens'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const rows = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ bookmarks: rows })
}

const schema = z.object({
  itemId: z.string().min(1),
  anchor: z.string().optional(),
  on: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = schema.parse(await req.json())
  const anchor = body.anchor ?? ''
  const existing = await prisma.bookmark.findUnique({
    where: { userId_itemId_anchor: { userId: user.id, itemId: body.itemId, anchor } },
  })
  const enable = body.on ?? !existing
  if (!enable) {
    if (existing) await prisma.bookmark.delete({ where: { id: existing.id } })
    return NextResponse.json({ bookmarked: false })
  }
  const row = existing ?? await prisma.bookmark.create({
    data: { id: newId(), userId: user.id, itemId: body.itemId, anchor },
  })
  return NextResponse.json({ bookmarked: true, bookmark: row })
}
