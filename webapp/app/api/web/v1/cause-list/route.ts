import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, hasCauseListAccess } from '@/lib/auth-middleware'

/** Cause-list — STARTER / PRO / PRO_ADVANCE / CHAMBER. */
export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!hasCauseListAccess(user.chamber.plan, user.chamber.subscriptionEndsAt)) {
    return NextResponse.json(
      { message: 'STARTER or higher required for cause-list', code: 'PREMIUM_REQUIRED' },
      { status: 403 },
    )
  }

  const date = req.nextUrl.searchParams.get('date')
  const where = {
    chamberId: user.chamberId,
    deletedAt: null,
    ...(date
      ? {
          date: {
            gte: new Date(date),
            lt: new Date(new Date(date).getTime() + 86400000),
          },
        }
      : {}),
  }

  const entries = await prisma.causeListEntry.findMany({
    where,
    orderBy: { date: 'asc' },
    take: 500,
  })
  return NextResponse.json({ entries })
}

const createSchema = z.object({
  date: z.string().datetime(),
  courtName: z.string().optional(),
  serialNo: z.string().optional(),
  partyName: z.string().optional(),
  purpose: z.string().optional(),
  caseId: z.string().optional(),
  rawText: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!hasCauseListAccess(user.chamber.plan, user.chamber.subscriptionEndsAt)) {
    return NextResponse.json(
      { message: 'STARTER or higher required for cause-list' },
      { status: 403 },
    )
  }

  let body: z.infer<typeof createSchema>
  try {
    body = createSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const entry = await prisma.causeListEntry.create({
    data: {
      chamberId: user.chamberId,
      date: new Date(body.date),
      courtName: body.courtName,
      serialNo: body.serialNo,
      partyName: body.partyName,
      purpose: body.purpose,
      caseId: body.caseId,
      rawText: body.rawText,
    },
  })
  return NextResponse.json({ entry }, { status: 201 })
}
