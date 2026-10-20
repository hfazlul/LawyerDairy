import { NextRequest, NextResponse } from 'next/server'
import { filesystemCareerManifest } from '@/lib/career-fs'
import { BAR_ESSENTIAL_IDS, HC_ESSENTIAL_IDS } from '@/lib/career-essentials'

/** Public (no auth). Static packs work with Postgres down. */
export async function GET(_req: NextRequest) {
  const fs = filesystemCareerManifest()
  let prismaPacks: unknown[] | undefined
  try {
    const { prisma } = await import('@/lib/prisma')
    const packs = await prisma.contentPack.findMany({
      where: { isCurrent: true },
      include: { _count: { select: { items: true } } },
    })
    prismaPacks = packs.map((p) => ({
      id: p.id,
      version: p.version,
      checksum: p.checksum,
      itemCount: p._count.items,
      publishedAt: p.publishedAt,
    }))
  } catch {
    prismaPacks = undefined
  }

  return NextResponse.json({
    localPct: 20,
    remotePct: 80,
    source: fs.packs.length ? fs.source : prismaPacks?.length ? 'prisma' : 'filesystem',
    essential: { bar: BAR_ESSENTIAL_IDS.length, hc: HC_ESSENTIAL_IDS.length },
    packs: fs.packs,
    prismaPacks: prismaPacks ?? [],
  })
}
