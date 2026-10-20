import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { flattenCareerItem } from '@/lib/career-flatten'

export async function GET(req: NextRequest) {
  const sectionId = req.nextUrl.searchParams.get('sectionId') || undefined
  const itemType = req.nextUrl.searchParams.get('itemType') || undefined
  const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'bn'
  const items = await prisma.contentItem.findMany({
    where: {
      packId: 'high-court-ad',
      ...(sectionId ? { sectionId } : {}),
      ...(itemType ? { itemType } : {}),
    },
    orderBy: { sortOrder: 'asc' },
    take: 500,
  })
  return NextResponse.json({
    items: items.map((it) =>
      flattenCareerItem(
        {
          id: it.id,
          itemType: it.itemType,
          moduleId: it.moduleId,
          topicId: it.topicId,
          sectionId: it.sectionId,
          status: it.status,
          source: it.source,
          payload: it.payload,
        },
        lang,
      ),
    ),
  })
}
