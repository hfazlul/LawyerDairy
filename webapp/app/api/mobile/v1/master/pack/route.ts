import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const version = await prisma.masterDataVersion.findFirst({
    where: { isCurrent: true },
  })
  const [
    courtLevels,
    courtTypes,
    districts,
    metros,
    caseTypes,
    acts,
    sections,
    partyRoles,
    sides,
  ] = await Promise.all([
    prisma.courtLevel.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.courtType.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.district.findMany({ orderBy: { nameEn: 'asc' } }),
    prisma.metropolitanArea.findMany(),
    prisma.caseType.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.act.findMany({ orderBy: { nameEn: 'asc' } }),
    prisma.section.findMany({ take: 500 }),
    prisma.partyRole.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.representationSide.findMany(),
  ])

  const includeCourts = req.nextUrl.searchParams.get('courts') === '1'
  const courts = includeCourts
    ? await prisma.court.findMany({ where: { active: true } })
    : undefined

  return NextResponse.json({
    datasetVersion: version?.datasetVersion ?? '1.1.1',
    checksum: version?.checksum,
    courtLevels,
    courtTypes,
    districts,
    metropolitanAreas: metros,
    caseTypes,
    acts,
    sections,
    partyRoles,
    representationSides: sides,
    courts,
  })
}
