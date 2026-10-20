import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export const runtime = 'nodejs'

const schema = z.object({
  token: z.string().min(8).max(4096),
  platform: z.enum(['android', 'ios', 'web']).optional(),
  appVersion: z.string().max(32).optional(),
  masterEnabled: z.boolean().optional(),
  deviceId: z.string().min(8).max(64).optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 })
  }
  const body = parsed.data
  const deviceId = body.deviceId || user.jwtDeviceId
  if (!deviceId) {
    return NextResponse.json({ error: 'device_required' }, { status: 400 })
  }

  await prisma.device.updateMany({
    where: { pushToken: body.token, NOT: { id: deviceId } },
    data: { pushToken: null },
  })

  const existing = await prisma.device.findFirst({
    where: { id: deviceId, userId: user.id },
    select: { id: true },
  })
  const pushEnabled = body.masterEnabled ?? true
  const platform = body.platform || 'android'

  if (existing) {
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        pushToken: body.token,
        pushEnabled,
        platform,
        appVersion: body.appVersion,
        lastSeenAt: new Date(),
        revokedAt: null,
      },
    })
  } else {
    await prisma.device.create({
      data: {
        id: deviceId,
        userId: user.id,
        platform,
        appVersion: body.appVersion,
        pushToken: body.token,
        pushEnabled,
        lastSeenAt: new Date(),
      },
    })
  }

  return NextResponse.json({ ok: true })
}
