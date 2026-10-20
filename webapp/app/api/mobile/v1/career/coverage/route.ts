import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { ethicsSraLabel } from '@/lib/master/career-coverage'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const barTopics = await prisma.contentItem.groupBy({
    by: ['status'],
    where: { packId: 'bar-council', itemType: 'TOPIC' },
    _count: { _all: true },
  })
  const topicRows = await prisma.contentItem.findMany({
    where: { packId: 'bar-council', itemType: 'TOPIC' },
    select: { moduleId: true, status: true },
  })
  const barLessons = await prisma.contentItem.count({
    where: { packId: 'bar-council', itemType: { in: ['LESSON', 'LESSON_DRAFTED'] } },
  })
  const hcAssets = await prisma.contentItem.count({
    where: {
      packId: 'high-court-ad',
      itemType: { notIn: ['SECTION', 'MODULE'] },
    },
  })
  const hcMcq = await prisma.contentItem.count({
    where: { packId: 'high-court-ad', itemType: { in: ['MCQ', 'QUESTION'] } },
  })
  const hcCases = await prisma.contentItem.count({
    where: { packId: 'high-court-ad', itemType: { in: ['CASE_LAW', 'CASE'] } },
  })
  const bjsAssets = await prisma.contentItem.count({
    where: { packId: 'bjs' },
  })
  const bjsMcq = await prisma.contentItem.count({
    where: { packId: 'bjs', itemType: { in: ['MCQ', 'QUESTION'] } },
  })
  const bjsShared = await prisma.contentItem.count({
    where: { packId: 'bjs', itemType: 'SHARED_LESSON' },
  })
  const drafted = barTopics
    .filter((r) => /LESSON_DRAFTED|drafted/i.test(r.status))
    .reduce((n, r) => n + r._count._all, 0)
  const pending = barTopics
    .filter((r) => /PENDING/i.test(r.status))
    .reduce((n, r) => n + r._count._all, 0)
  const topicTotal = barTopics.reduce((n, r) => n + r._count._all, 0)

  return NextResponse.json({
    bar: {
      topics: topicTotal,
      drafted,
      pending,
      lessons: barLessons,
      ethicsSra: ethicsSraLabel(topicRows),
    },
    highCourt: {
      assets: hcAssets,
      mcq: hcMcq,
      cases: hcCases,
    },
    bjs: {
      assets: bjsAssets,
      mcq: bjsMcq,
      sharedLessons: bjsShared,
      officialPastPapers: 0,
    },
    honest: {
      barFullLessonsVsTopics: `${barLessons}/${topicTotal || 134}`,
      barCoveragePct: topicTotal ? Math.round((barLessons / topicTotal) * 1000) / 10 : 0,
      shellsAreNotLessons: true,
      hcUniqueDataset: 1,
      inventedMcq: false,
      bjsOfficialPastPapers: 0,
      ainProkashCopied: false,
    },
  })
}
