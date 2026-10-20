import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { JoinApiAlphabet, isPlausibleJoinCode, normalizeJoinCode } from '@/lib/team/join-code'

const schema = z.object({
  code: z.string().min(6).max(12).optional(),
  workspaceId: z.string().optional(),
})

/** Owner mirrors Spark join-code onto Prisma so HTTP fallback + diary share stay aligned. */
export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json().catch(() => ({})))
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const wsId = body.workspaceId || user.activeMembership?.workspaceId
  const ws = user.memberships.find((m) => m.workspaceId === wsId)
  if (!ws || ws.role !== 'OWNER') {
    return NextResponse.json({ message: 'শুধু মালিক কোড তৈরি করতে পারেন' }, { status: 403 })
  }
  if (ws.workspace.kind === 'PERSONAL') {
    return NextResponse.json({ message: 'পার্সোনাল ওয়ার্কস্পেসে জয়েন কোড নেই' }, { status: 400 })
  }

  const code = body.code ? normalizeJoinCode(body.code) : randomJoinCode()
  if (!isPlausibleJoinCode(code)) {
    return NextResponse.json({ message: 'কোড ৬–৮ অক্ষর' }, { status: 400 })
  }

  await prisma.workspace.update({
    where: { id: ws.workspaceId },
    data: { joinCode: code },
  })
  return NextResponse.json({ ok: true, code, workspaceId: ws.workspaceId })
}

function randomJoinCode(): string {
  let out = ''
  for (let i = 0; i < 6; i++) out += JoinApiAlphabet[Math.floor(Math.random() * JoinApiAlphabet.length)]
  return out
}
