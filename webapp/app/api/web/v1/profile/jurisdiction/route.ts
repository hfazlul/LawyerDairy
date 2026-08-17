import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { isJurisdiction, isUiLanguage, JURISDICTION_META } from '@/lib/jurisdiction'

const schema = z.object({
  jurisdiction: z.enum(['BD', 'PK', 'IN']).optional(),
  uiLanguage: z.enum(['bn', 'en', 'ur']).optional(),
  confirmJurisdiction: z.boolean().optional(),
})

/** Update chamber jurisdiction + user UI language (user must confirm; no silent switch). */
export async function PATCH(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  if (body.jurisdiction && !isJurisdiction(body.jurisdiction)) {
    return NextResponse.json({ message: 'Invalid jurisdiction' }, { status: 400 })
  }
  if (body.uiLanguage && !isUiLanguage(body.uiLanguage)) {
    return NextResponse.json({ message: 'Invalid language' }, { status: 400 })
  }

  if (body.jurisdiction || body.confirmJurisdiction) {
    await prisma.chamber.update({
      where: { id: user.chamberId },
      data: {
        ...(body.jurisdiction ? { jurisdiction: body.jurisdiction } : {}),
        jurisdictionConfirmed:
          body.confirmJurisdiction === true || Boolean(body.jurisdiction),
      },
    })
  }

  if (body.uiLanguage) {
    await prisma.user.update({
      where: { id: user.id },
      data: { uiLanguage: body.uiLanguage },
    })
  }

  const refreshed = await prisma.user.findUnique({
    where: { id: user.id },
    include: { chamber: true },
  })
  const j = refreshed!.chamber.jurisdiction
  const meta = JURISDICTION_META[j]

  return NextResponse.json({
    jurisdiction: j,
    jurisdictionConfirmed: refreshed!.chamber.jurisdictionConfirmed,
    uiLanguage: refreshed!.uiLanguage,
    country: { name: meta.nameEn, flag: meta.flag },
    paymentRail: meta.paymentRail,
  })
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const meta = JURISDICTION_META[user.chamber.jurisdiction]
  return NextResponse.json({
    jurisdiction: user.chamber.jurisdiction,
    jurisdictionConfirmed: user.chamber.jurisdictionConfirmed,
    uiLanguage: user.uiLanguage,
    country: { name: meta.nameEn, flag: meta.flag },
    paymentRail: meta.paymentRail,
  })
}
