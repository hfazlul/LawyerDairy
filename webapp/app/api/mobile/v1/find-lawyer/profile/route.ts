import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { z } from 'zod'
import { newId } from '@/lib/crypto-tokens'

function slugify(name: string, userId: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'lawyer'
  return `${base}-${userId.slice(0, 8)}`
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const profile = await prisma.lawyerProfile.findUnique({ where: { userId: user.id } })
  return NextResponse.json({ profile })
}

const schema = z.object({
  displayName: z.string().min(2).max(80),
  degrees: z.array(z.string()).nullish(),
  enrolmentYear: z.number().int().min(1950).max(2100).nullish(),
  aboutBn: z.string().max(500).nullish(),
  aboutEn: z.string().max(500).nullish(),
  districtIds: z.array(z.string()).nullish(),
  courtTypeIds: z.array(z.string()).nullish(),
  practiceAreaIds: z.array(z.string()).nullish(),
  caseTypeIds: z.array(z.string()).nullish(),
  barRegNo: z.string().max(80).nullish(),
  publicPhone: z.string().max(20).nullish(),
  practiceCourtName: z.string().max(120).nullish(),
  isListed: z.boolean().nullish(),
  photoUrl: z.string().max(500).nullish(),
})

export async function PUT(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const existing = await prisma.lawyerProfile.findUnique({ where: { userId: user.id } })

  const completeness = Math.min(
    100,
    [
      body.displayName,
      (body.degrees ?? []).length,
      body.enrolmentYear,
      body.aboutBn,
      (body.districtIds ?? []).length,
      (body.courtTypeIds ?? []).length,
    ].filter(Boolean).length * 16,
  )

  const listed = body.isListed !== false
  const profilePublishedAt =
    listed && !existing?.profilePublishedAt ? new Date() : existing?.profilePublishedAt ?? undefined

  const profile = await prisma.lawyerProfile.upsert({
    where: { userId: user.id },
    create: {
      id: newId(),
      userId: user.id,
      publicSlug: slugify(body.displayName, user.id),
      displayName: body.displayName,
      degrees: body.degrees ?? [],
      enrolmentYear: body.enrolmentYear,
      aboutBn: body.aboutBn,
      aboutEn: body.aboutEn,
      districtIds: body.districtIds ?? [],
      courtTypeIds: body.courtTypeIds ?? [],
      practiceAreaIds: body.practiceAreaIds ?? [],
      caseTypeIds: body.caseTypeIds ?? [],
      barRegNo: body.barRegNo,
      publicPhone: body.publicPhone?.trim() || null,
      practiceCourtName: body.practiceCourtName?.trim() || null,
      photoUrl: body.photoUrl ? body.photoUrl : null,
      isListed: listed ?? false,
      profilePublishedAt: listed ? new Date() : null,
      completenessPct: completeness,
    },
    update: {
      displayName: body.displayName,
      degrees: body.degrees ?? [],
      enrolmentYear: body.enrolmentYear,
      aboutBn: body.aboutBn,
      aboutEn: body.aboutEn,
      districtIds: body.districtIds ?? [],
      courtTypeIds: body.courtTypeIds ?? [],
      practiceAreaIds: body.practiceAreaIds ?? [],
      caseTypeIds: body.caseTypeIds ?? [],
      barRegNo: body.barRegNo,
      publicPhone: body.publicPhone?.trim() || null,
      practiceCourtName: body.practiceCourtName?.trim() || null,
      photoUrl: body.photoUrl ? body.photoUrl : null,
      isListed: listed,
      profilePublishedAt,
      completenessPct: completeness,
    },
  })
  return NextResponse.json({ profile })
}
