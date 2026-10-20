import 'server-only'

import { NextRequest } from 'next/server'
import { GET as directoryGet } from '../../../app/api/mobile/v1/find-lawyer/directory/route'
import { GET as profileGet } from '../../../app/api/mobile/v1/find-lawyer/[slug]/route'
import { prisma } from '@/lib/prisma'

/** The existing public handlers remain the authority for visibility and ranking. */
export type PublicLawyer = {
  id: string
  publicSlug: string
  displayName: string
  photoUrl: string | null
  degrees: string[]
  enrolmentYear: number | null
  aboutBn: string | null
  aboutEn?: string | null
  districtIds: string[]
  courtTypeIds: string[]
  practiceAreaIds: string[]
  verificationStatus: string
  verifiedAt: string | null
  ratingAvg: number | null
  ratingCount: number
  districtNames?: string[]
  practiceLabel?: string
}

export type DirectoryFilters = { q?: string; districtId?: string; practiceAreaId?: string; experienceMin?: string }

export async function readPublicDirectory(filters: DirectoryFilters) {
  const url = new URL('https://mamlaq.invalid/api/mobile/v1/find-lawyer/directory')
  for (const [key, value] of Object.entries(filters)) if (value) url.searchParams.set(key, value)
  url.searchParams.set('limit', '100')
  const response = await directoryGet(new NextRequest(url))
  if (!response.ok) throw new Error('Directory unavailable')
  const { lawyers } = await response.json() as { lawyers: PublicLawyer[] }
  if (!lawyers.length) return lawyers
  // Match the existing detail handler's visibility gate. The directory response
  // normalizes REJECTED to UNSUBMITTED, so its public status alone is insufficient.
  const visible = await prisma.lawyerProfile.findMany({
    where: {
      id: { in: lawyers.map(lawyer => lawyer.id) },
      isListed: true,
      deletedAt: null,
      verificationStatus: { not: 'REJECTED' },
    },
    select: { id: true },
  })
  const ids = new Set(visible.map(profile => profile.id))
  return lawyers.filter(lawyer => ids.has(lawyer.id) && lawyer.publicSlug)
}

export async function readPublicLawyer(slug: string) {
  const response = await profileGet(new NextRequest('https://mamlaq.invalid/'), { params: Promise.resolve({ slug }) })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Profile unavailable')
  return (await response.json() as { profile: PublicLawyer }).profile
}

export function readDirectoryDistricts() {
  return prisma.district.findMany({
    where: { active: true },
    select: { id: true, nameBn: true, nameEn: true },
    orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
  })
}

export async function readProfileLabels(profile: PublicLawyer) {
  const [districts, courts] = await Promise.all([
    prisma.district.findMany({ where: { id: { in: profile.districtIds } }, select: { nameBn: true, nameEn: true } }),
    prisma.courtType.findMany({ where: { id: { in: profile.courtTypeIds } }, select: { nameBn: true, nameEn: true } }),
  ])
  return { districts: districts.map(d => d.nameBn || d.nameEn), courts: courts.map(c => c.nameBn || c.nameEn) }
}

export function safeProfilePhoto(value: string | null) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return value.startsWith('/') && !value.startsWith('//') ? value : undefined
  }
}
