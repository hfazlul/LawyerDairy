import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireWorkspace } from '@/lib/auth-middleware'
import { newId } from '@/lib/crypto-tokens'
import { withWorkspaceTx } from '@/lib/rls'

export async function GET(req: NextRequest) {
  const user = await requireWorkspace(req, 'calendar.view')
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const wsId = user.activeMembership.workspaceId
  const tasks = await withWorkspaceTx(wsId, (tx) =>
    tx.task.findMany({
      where: { workspaceId: wsId, deletedAt: null },
      orderBy: { dueDate: 'asc' },
      take: 200,
    }),
  )
  return NextResponse.json({ tasks })
}

const schema = z.object({
  title: z.string().min(1).max(200),
  dueDate: z.string().optional(),
  kind: z.enum(['TASK', 'REMINDER', 'DEADLINE', 'LIMITATION']).optional(),
  caseId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireWorkspace(req, 'tasks.edit')
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }
  const wsId = user.activeMembership.workspaceId
  const task = await withWorkspaceTx(wsId, (tx) =>
    tx.task.create({
      data: {
        id: newId(),
        workspaceId: wsId,
        title: body.title,
        kind: body.kind ?? 'TASK',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        caseId: body.caseId,
        updatedByUserId: user.id,
      },
    }),
  )
  return NextResponse.json({ task }, { status: 201 })
}
