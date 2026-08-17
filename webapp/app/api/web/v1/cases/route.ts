import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, hasCaseManageAccess } from '@/lib/auth-middleware'

/** Pro-Advance web case list (parity scaffold with mobile). */
export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!hasCaseManageAccess(user.chamber.plan, user.chamber.subscriptionEndsAt)) {
    return NextResponse.json(
      { message: 'PRO_ADVANCE required for web case management', code: 'PREMIUM_REQUIRED' },
      { status: 403 },
    )
  }

  const cases = await prisma.case.findMany({
    where: { chamberId: user.chamberId, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ cases })
}

const createSchema = z.object({
  caseNo: z.string().min(1),
  caseType: z.string().min(1),
  court: z.string().min(1),
  courtName: z.string().optional(),
  nextDate: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!hasCaseManageAccess(user.chamber.plan, user.chamber.subscriptionEndsAt)) {
    return NextResponse.json(
      { message: 'PRO_ADVANCE required for web case management' },
      { status: 403 },
    )
  }

  let body: z.infer<typeof createSchema>
  try {
    body = createSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const created = await prisma.case.create({
    data: {
      chamberId: user.chamberId,
      caseNo: body.caseNo,
      caseType: body.caseType,
      court: body.court,
      courtName: body.courtName,
      nextDate: body.nextDate ? new Date(body.nextDate) : null,
    },
  })
  return NextResponse.json({ case: created }, { status: 201 })
}
