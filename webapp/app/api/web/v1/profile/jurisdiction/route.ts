import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { isUiLanguage, JURISDICTION_META } from '@/lib/jurisdiction'

const schema = z.object({
  uiLanguage: z.enum(['bn', 'en']).optional(),
})

const BD_META = JURISDICTION_META['BD']

export async function PATCH(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  if (body.uiLanguage && !isUiLanguage(body.uiLanguage)) {
    return NextResponse.json({ message: 'Invalid language' }, { status: 400 })
  }

  if (body.uiLanguage) {
    await prisma.user.update({
      where: { id: user.id },
      data: { uiLanguage: body.uiLanguage },
    })
  }

  const refreshed = await prisma.user.findUnique({ where: { id: user.id } })
  return NextResponse.json({
    jurisdiction: 'BD',
    uiLanguage: refreshed!.uiLanguage,
    country: { name: BD_META.nameEn, flag: BD_META.flag },
    paymentRail: 'zinipay_web',
  })
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    jurisdiction: 'BD',
    uiLanguage: user.uiLanguage,
    country: { name: BD_META.nameEn, flag: BD_META.flag },
    paymentRail: 'zinipay_web',
  })
}
