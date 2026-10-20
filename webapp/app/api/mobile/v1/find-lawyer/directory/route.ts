import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compareDirectoryRows, isDirectoryVerified, practiceLabel } from '@/lib/find-lawyer/directory-rank'

export async function GET(req: NextRequest) {
  const districtId = req.nextUrl.searchParams.get('districtId') || undefined
  const courtTypeId = req.nextUrl.searchParams.get('courtTypeId') || undefined
  const practiceAreaId = req.nextUrl.searchParams.get('practiceAreaId') || undefined
  const caseTypeId = req.nextUrl.searchParams.get('caseTypeId') || undefined
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const take = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '40', 10), 100)
  const experienceMin = req.nextUrl.searchParams.get('experienceMin')
  const minYear =
    experienceMin && Number.isFinite(Number(experienceMin))
      ? new Date().getFullYear() - Number(experienceMin)
      : undefined

  const lawyers = await prisma.lawyerProfile.findMany({
    where: {
      isListed: true,
      deletedAt: null,
      ...(districtId ? { districtIds: { has: districtId } } : {}),
      ...(practiceAreaId ? { practiceAreaIds: { has: practiceAreaId } } : {}),
      ...(caseTypeId ? { caseTypeIds: { has: caseTypeId } } : {}),
      ...(courtTypeId ? { courtTypeIds: { has: courtTypeId } } : {}),
      ...(minYear != null ? { enrolmentYear: { lte: minYear } } : {}),
      ...(q
        ? {
            OR: [
              { displayName: { contains: q, mode: 'insensitive' } },
              { aboutBn: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      publicSlug: true,
      displayName: true,
      photoUrl: true,
      degrees: true,
      enrolmentYear: true,
      aboutBn: true,
      districtIds: true,
      courtTypeIds: true,
      practiceAreaIds: true,
      caseTypeIds: true,
      verificationStatus: true,
      verifiedAt: true,
      createdAt: true,
      profilePublishedAt: true,
      completenessPct: true,
      responseMedianMins: true,
      ratingAvg: true,
      _count: { select: { reviews: true } },
    },
  })

  lawyers.sort(compareDirectoryRows)
  const sliced = lawyers.slice(0, take)

  const districtIds = [...new Set(sliced.flatMap((l) => l.districtIds))]
  const districts = districtIds.length
    ? await prisma.district.findMany({
        where: { id: { in: districtIds } },
        select: { id: true, nameBn: true, nameEn: true },
      })
    : []
  const distMap = new Map(districts.map((d) => [d.id, d]))

  return NextResponse.json({
    lawyers: sliced.map((l) => {
      const count = l._count.reviews
      const { _count, ratingAvg, completenessPct: _c, ...rest } = l
      const verified = isDirectoryVerified(l)
      const districtNames = l.districtIds
        .map((id) => distMap.get(id)?.nameBn || distMap.get(id)?.nameEn || '')
        .filter(Boolean)
      return {
        ...rest,
        verificationStatus: verified ? 'VERIFIED' : l.verificationStatus === 'PENDING' ? 'PENDING' : 'UNSUBMITTED',
        verifiedAt: verified ? l.verifiedAt : null,
        ratingAvg: count > 0 ? ratingAvg : null,
        ratingCount: count,
        districtNames,
        practiceLabel: practiceLabel(l.practiceAreaIds),
      }
    }),
  })
}
