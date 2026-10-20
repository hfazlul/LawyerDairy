import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { approxJsonBytes } from '@/lib/career-flatten'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const packs = await prisma.contentPack.findMany({
    where: { isCurrent: true },
    include: { _count: { select: { items: true } } },
  })

  const out = []
  for (const p of packs) {
    const sample = await prisma.contentItem.findMany({
      where: { packId: p.id },
      select: { payload: true },
      take: 80,
    })
    const approxBytes =
      sample.length === 0
        ? 0
        : Math.round((approxJsonBytes(sample) / sample.length) * p._count.items)
    out.push({
      id: p.id,
      hub: p.hub,
      titleBn: p.titleBn,
      titleEn: p.titleEn,
      version: p.version,
      itemCount: p._count.items,
      approxBytes,
      sizeHintMb: (approxBytes / (1024 * 1024)).toFixed(2),
    })
  }
  return NextResponse.json({ packs: out })
}
