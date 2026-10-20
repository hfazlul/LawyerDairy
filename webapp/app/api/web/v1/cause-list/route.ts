import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { newId } from '@/lib/crypto-tokens'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user?.activeMembership) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const date = req.nextUrl.searchParams.get('date')
  const where = {
    workspaceId: user.activeMembership.workspaceId,
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
  courtNameFree: z.string().optional(),
  courtUid: z.string().optional(),
  serialNo: z.string().optional(),
  partyName: z.string().optional(),
  purpose: z.string().optional(),
  caseId: z.string().optional(),
  rawText: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user?.activeMembership) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!user.activeMembership.permissions.has('cause_list.update')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  let body: z.infer<typeof createSchema>
  try {
    body = createSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const entry = await prisma.causeListEntry.create({
    data: {
      id: newId(),
      workspaceId: user.activeMembership.workspaceId,
      date: new Date(body.date),
      courtNameFree: body.courtNameFree,
      courtUid: body.courtUid,
      serialNo: body.serialNo,
      partyName: body.partyName,
      purpose: body.purpose,
      caseId: body.caseId,
      rawText: body.rawText,
      source: 'manual',
      updatedByUserId: user.id,
    },
  })
  return NextResponse.json({ entry }, { status: 201 })
}
