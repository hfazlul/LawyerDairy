import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireWorkspace } from '@/lib/auth-middleware'
import { COMING_SOON_BN, isFullAccessAccount } from '@/lib/full-access'
import { hearingAutomaticOn, hearingTimesPerDay } from '@/lib/hearing-auto'

const schema = z.object({
  autoMessaging: z.boolean().optional(),
  smsD1: z.boolean().optional(),
  smsD2: z.boolean().optional(),
  smsD3: z.boolean().optional(),
  smsTimesPerDay: z.number().int().min(1).max(3).optional(),
  smsAutoEnabled: z.boolean().optional(),
})

function comingSoon() {
  return NextResponse.json({ error: 'coming_soon', messageBn: COMING_SOON_BN }, { status: 403 })
}

export async function GET(req: NextRequest) {
  const user = await requireWorkspace(req)
  if (!user?.activeMembership) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!isFullAccessAccount(user)) return comingSoon()
  const ws = user.activeMembership.workspace
  return NextResponse.json({
    autoMessaging: ws.autoMessaging,
    smsAutoEnabled: ws.smsAutoEnabled,
    automaticOn: hearingAutomaticOn(ws.smsAutoEnabled),
    smsD1: ws.smsD1,
    smsD2: ws.smsD2,
    smsD3: ws.smsD3,
    smsTimesPerDay: hearingTimesPerDay(ws.smsTimesPerDay),
  })
}

export async function PATCH(req: NextRequest) {
  const user = await requireWorkspace(req)
  if (!user?.activeMembership) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!isFullAccessAccount(user)) return comingSoon()
  if (user.activeMembership.role !== 'OWNER' && user.activeMembership.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }
  const ws = await prisma.workspace.update({
    where: { id: user.activeMembership.workspaceId },
    data: {
      autoMessaging: body.autoMessaging,
      smsAutoEnabled: body.smsAutoEnabled,
      smsD1: body.smsD1,
      smsD2: body.smsD2,
      smsD3: body.smsD3,
      smsTimesPerDay: body.smsTimesPerDay,
    },
  })
  return NextResponse.json({
    autoMessaging: ws.autoMessaging,
    smsAutoEnabled: ws.smsAutoEnabled,
    automaticOn: hearingAutomaticOn(ws.smsAutoEnabled),
    smsD1: ws.smsD1,
    smsD2: ws.smsD2,
    smsD3: ws.smsD3,
    smsTimesPerDay: hearingTimesPerDay(ws.smsTimesPerDay),
  })
}
