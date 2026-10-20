import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { originAllowed } from '@/lib/csrf'
import { z } from 'zod'

const schema = z.object({
  events: z.array(
    z.object({
      name: z.string().min(1).max(80),
      path: z.string().max(200).optional(),
      payload: z.record(z.unknown()).optional(),
    }),
  ).max(50),
  source: z.enum(['mobile', 'web']).optional(),
})

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const user = await requireAuth(req)
  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid' }, { status: 400 })
  }
  await prisma.analyticsEvent.createMany({
    data: body.events.map((e) => ({
      userId: user?.id,
      source: body.source ?? 'mobile',
      name: e.name,
      path: e.path,
      payload: e.payload as never,
    })),
  }).catch(() => {})
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {})
  }
  return NextResponse.json({ ok: true })
}
