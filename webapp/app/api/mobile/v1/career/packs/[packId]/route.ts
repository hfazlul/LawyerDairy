import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { flattenCareerItem } from '@/lib/career-flatten'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ packId: string }> },
) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { packId } = await ctx.params
  const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'bn'

  const pack = await prisma.contentPack.findUnique({ where: { id: packId } })
  if (!pack) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const rows = await prisma.contentItem.findMany({
    where: { packId },
    orderBy: { sortOrder: 'asc' },
    take: 1200,
  })
  const items = rows.map((it) =>
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
  )
  return NextResponse.json({
    pack: { id: pack.id, version: pack.version, titleBn: pack.titleBn, itemCount: items.length },
    items,
  })
}
