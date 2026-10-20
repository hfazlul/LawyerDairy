import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { z } from 'zod'
import { flattenMcqPayload, isCpcOrCrpcModule } from '@/lib/mcq'
import { flattenCareerItem } from '@/lib/career-flatten'

export async function GET(req: NextRequest) {
  const moduleId = req.nextUrl.searchParams.get('moduleId') || undefined
  const itemType = req.nextUrl.searchParams.get('itemType') || 'MCQ'
  const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'bn'

  const items = await prisma.contentItem.findMany({
    where: {
      packId: 'bar-council',
      ...(moduleId ? { moduleId } : {}),
      itemType,
    },
    orderBy: { sortOrder: 'asc' },
    take: 500,
  })

  const scoped =
    itemType === 'MCQ' && !moduleId
      ? items.filter((it) => {
          const payload = (it.payload && typeof it.payload === 'object' ? it.payload : {}) as Record<string, unknown>
          const mid = it.moduleId || String(payload.subject_module_id || payload.module_id || '')
          return isCpcOrCrpcModule(mid)
        })
      : items
  const out = scoped.map((it) => {
    const flat = itemType === 'MCQ' ? flattenMcqPayload(it.payload, lang, { includeAnswers: false }) : null
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
    return {
      ...career,
      stem: flat?.stem,
      options: flat?.options?.map((o) => o.text) ?? [],
      optionKeys: flat?.options?.map((o) => o.key) ?? [],
      correctKey: flat?.correctKey,
      explanation: flat?.explanation,
      answersHidden: flat?.answersHidden ?? true,
      title: flat?.stem || career.title || it.id,
    }
  })

  return NextResponse.json({ items: out })
}

const attemptSchema = z.object({
  sessionId: z.string(),
  sessionKind: z.string().default('TOPIC_TEST'),
  itemId: z.string(),
  answerJson: z.unknown().optional(),
  isCorrect: z.boolean().optional(),
  score: z.number().int().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = attemptSchema.parse(await req.json())
  const attempt = await prisma.attempt.create({
    data: {
      userId: user.id,
      sessionId: body.sessionId,
      sessionKind: body.sessionKind,
      itemId: body.itemId,
      answerJson: body.answerJson as object | undefined,
      isCorrect: body.isCorrect,
      score: body.score,
    },
  })
  return NextResponse.json({ attempt }, { status: 201 })
}
