import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { isPlausibleJoinCode, normalizeJoinCode } from '@/lib/team/join-code'
import { newId } from '@/lib/crypto-tokens'

function dto(row: {
  id: string
  requesterName: string
  requesterPhone: string | null
  requesterUserId: string
  workspaceId: string
  status: string
  workspace: { name: string }
}) {
  return {
    id: row.id,
    name: row.requesterName,
    requesterName: row.requesterName,
    phone: row.requesterPhone,
    requesterPhone: row.requesterPhone,
    requesterAppUserId: row.requesterUserId,
    workspaceId: row.workspaceId,
    workspaceName: row.workspace.name,
    status: row.status,
  }
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const wsId = user.activeMembership?.workspaceId
  const asOwner =
    user.activeMembership?.role === 'OWNER'
      ? await prisma.joinRequest.findMany({
          where: { workspaceId: wsId, status: 'PENDING' },
          include: { workspace: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      : []

  const mine = await prisma.joinRequest.findMany({
    where: { requesterUserId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    requests: asOwner.map(dto),
    mine: mine.map(dto),
  })
}

const postSchema = z.object({ code: z.string().min(6).max(12) })

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof postSchema>
  try {
    body = postSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }
  const code = normalizeJoinCode(body.code)
  if (!isPlausibleJoinCode(code)) {
    return NextResponse.json({ message: 'ইনভাইট অবৈধ বা মেয়াদ শেষ' }, { status: 404 })
  }

  const workspace = await prisma.workspace.findFirst({
    where: { joinCode: code, deletedAt: null, kind: 'CHAMBER' },
  })
  if (!workspace) {
    return NextResponse.json({ message: 'ইনভাইট অবৈধ বা মেয়াদ শেষ' }, { status: 404 })
  }
  if (workspace.ownerUserId === user.id) {
    return NextResponse.json({ message: 'নিজের চেম্বারে জয়েন করা যায় না' }, { status: 400 })
  }

  const existing = await prisma.joinRequest.findFirst({
    where: { workspaceId: workspace.id, requesterUserId: user.id, status: 'PENDING' },
  })
  if (existing) {
    return NextResponse.json({ ok: true, requestId: existing.id, replayed: true })
  }

  const row = await prisma.joinRequest.create({
    data: {
      id: newId(),
      workspaceId: workspace.id,
      requesterUserId: user.id,
      requesterName: user.name,
      requesterPhone: user.phone,
      code,
      status: 'PENDING',
    },
  })
  return NextResponse.json({ ok: true, requestId: row.id }, { status: 201 })
}
