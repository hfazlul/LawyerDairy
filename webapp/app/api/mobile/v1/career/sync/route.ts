import { NextRequest, NextResponse } from 'next/server'
import { isPremiumActive } from '@/lib/entitlement-gates'
import { planOf, planExpires, requireAuth } from '@/lib/auth-middleware'
import { BAR_ESSENTIAL_IDS, HC_ESSENTIAL_IDS } from '@/lib/career-essentials'
import { filesystemCareerManifest } from '@/lib/career-fs'

/**
 * Optional Prisma item page for paid overlay.
 * Static 80% files are GET /career/file/:fileId (no DB).
 * Free users still receive file pointers — UI gates visibility, not the download.
 */
export async function GET(req: NextRequest) {
  const packId = req.nextUrl.searchParams.get('packId') || 'bar-council'
  const cursor = req.nextUrl.searchParams.get('cursor') || ''
  const limit = Math.min(25, Math.max(1, Number(req.nextUrl.searchParams.get('limit') || 12)))
  const essentialIds = packId.includes('high') ? HC_ESSENTIAL_IDS : BAR_ESSENTIAL_IDS
  const fs = filesystemCareerManifest()
  const filePacks = fs.packs.filter((p) => p.packId === packId)

  const user = await requireAuth(req).catch(() => null)
  const paid = user ? isPremiumActive(planOf(user), planExpires(user)) : false

  if (!user) {
    return NextResponse.json({
      packId,
      mode: 'filesystem_80',
      items: [],
      files: filePacks,
      nextCursor: null,
      total: 0,
      essentialCount: essentialIds.length,
      remotePct: 80,
      careerFull: false,
    })
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    const total = await prisma.contentItem.count({ where: { packId } })
    const items = await prisma.contentItem.findMany({
      where: {
        packId,
        essential: false,
        ...(cursor ? { lastUpdated: { gt: new Date(cursor) } } : {}),
      },
      orderBy: [{ lastUpdated: 'asc' }, { id: 'asc' }],
      take: limit,
      select: {
        id: true,
        itemType: true,
        sectionId: true,
        moduleId: true,
        topicId: true,
        sortOrder: true,
        status: true,
        payload: true,
        source: true,
        lastUpdated: true,
        etag: true,
      },
    })
    const nextCursor = items.length ? items[items.length - 1].lastUpdated.toISOString() : null
    return NextResponse.json({
      packId,
      mode: items.length ? 'remote_80' : 'filesystem_80',
      items,
      files: filePacks,
      nextCursor,
      total,
      essentialCount: essentialIds.length,
      remotePct: 80,
      careerFull: paid,
    })
  } catch {
    return NextResponse.json({
      packId,
      mode: 'filesystem_80',
      items: [],
      files: filePacks,
      nextCursor: null,
      total: 0,
      essentialCount: essentialIds.length,
      remotePct: 80,
      careerFull: paid,
    })
  }
}
