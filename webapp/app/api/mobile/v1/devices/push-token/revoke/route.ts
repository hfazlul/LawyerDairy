import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export const runtime = 'nodejs'

const schema = z.object({
  token: z.string().min(8).max(4096).optional(),
  deviceId: z.string().min(8).max(64).optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  const body = parsed.success ? parsed.data : {}
  const deviceId = body.deviceId || user.jwtDeviceId

  if (deviceId) {
    await prisma.device.updateMany({
      where: { id: deviceId, userId: user.id },
      data: { pushToken: null },
    })
  }
  if (body.token) {
    await prisma.device.updateMany({
      where: { userId: user.id, pushToken: body.token },
      data: { pushToken: null },
    })
  }
  if (!deviceId && !body.token && user.jwtDeviceId) {
    await prisma.device.updateMany({
      where: { id: user.jwtDeviceId, userId: user.id },
      data: { pushToken: null },
    })
  }

  return NextResponse.json({ ok: true })
}
