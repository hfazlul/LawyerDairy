import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { foldBangla } from '@/lib/bn-text'

export async function GET(req: NextRequest) {
  const q = foldBangla(req.nextUrl.searchParams.get('q') || '')
  const courtLevelId = req.nextUrl.searchParams.get('courtLevelId') || undefined
  const courtTypeId = req.nextUrl.searchParams.get('courtTypeId') || undefined
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10), 200)

  const courts = await prisma.court.findMany({
    where: {
      active: true,
      ...(courtLevelId ? { courtLevelId } : {}),
      ...(courtTypeId ? { courtTypeId } : {}),
      ...(q
        ? {
            OR: [
              { nameBn: { contains: q, mode: 'insensitive' } },
              { nameEn: { contains: q, mode: 'insensitive' } },
              { officialName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ courtLevelId: 'asc' }, { nameEn: 'asc' }],
    take: limit,
  })

  return NextResponse.json({ courts })
}
