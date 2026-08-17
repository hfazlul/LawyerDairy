// GET /api/mobile/v1/sync/pull?since=<cursor>&limit=500&chamberId=<id>
// Returns all rows modified since the cursor timestamp

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const since  = searchParams.get('since')
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '500'), 1000)

  // Parse cursor: ISO datetime string or '0' (full sync)
  const sinceDate = since && since !== '0'
    ? new Date(since)
    : new Date(0)

  const chamberId = user.chamberId

  // Fetch all modified entities in parallel
  const [cases, hearings, clients, fees, documents] = await Promise.all([
    prisma.case.findMany({
      where: { chamberId, updatedAt: { gt: sinceDate } },
      orderBy: { updatedAt: 'asc' },
      take: limit,
    }),
    prisma.hearing.findMany({
      where: { chamberId, updatedAt: { gt: sinceDate } },
      orderBy: { updatedAt: 'asc' },
      take: limit,
    }),
    prisma.client.findMany({
      where: { chamberId, createdAt: { gt: sinceDate } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    }),
    prisma.feeEntry.findMany({
      where: { chamberId, createdAt: { gt: sinceDate } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    }),
    prisma.document.findMany({
      where: { chamberId, createdAt: { gt: sinceDate } },
      orderBy: { createdAt: 'asc' },
      take: limit,
      // Don't include ocrText in list — too large
      select: {
        id: true, caseId: true, chamberId: true, kind: true, title: true,
        storageKey: true, pageCount: true, sizeBytes: true,
        localOnly: true, createdAt: true, deletedAt: true,
      },
    }),
  ])

  // Compute next cursor: latest updatedAt across all entities
  const allDates = [
    ...cases.map(c => c.updatedAt),
    ...hearings.map(h => h.updatedAt),
    ...clients.map(c => c.createdAt),
    ...fees.map(f => f.createdAt),
    ...documents.map(d => d.createdAt),
  ].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())

  const hasMore   = cases.length === limit || hearings.length === limit
  const nextCursor = hasMore && allDates.length > 0
    ? allDates[0]!.toISOString()
    : null

  return NextResponse.json({
    changes:    { cases, hearings, clients, fees, documents },
    nextCursor,
    serverTime: new Date().toISOString(),
  })
}
