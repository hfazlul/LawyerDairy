import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { flattenCareerItem } from '@/lib/career-flatten'
import { flattenMcqPayload } from '@/lib/mcq'

export async function GET(req: NextRequest) {
  const itemType = req.nextUrl.searchParams.get('itemType') || undefined
  const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'bn'
  const items = await prisma.contentItem.findMany({
    where: {
      packId: 'bjs',
      ...(itemType ? { itemType } : {}),
    },
    orderBy: { sortOrder: 'asc' },
    take: 500,
  })
  return NextResponse.json({
    officialPastPapers: 0,
    ainProkashCopied: false,
    items: items.map((it) => {
      const career = flattenCareerItem(
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
      )
      if (it.itemType !== 'MCQ' && it.itemType !== 'QUESTION') return career
      const flat = flattenMcqPayload(it.payload, lang, { includeAnswers: false })
      return {
        ...career,
        stem: flat.stem,
        options: flat.options?.map((o) => o.text) ?? [],
        optionKeys: flat.options?.map((o) => o.key) ?? [],
        correctKey: flat.correctKey,
        explanation: flat.explanation,
        answersHidden: flat.answersHidden ?? true,
      }
    }),
  })
}
