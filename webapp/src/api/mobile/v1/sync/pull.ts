import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspace } from '@/lib/auth-middleware'
import { withWorkspaceTx, type WorkspaceTx } from '@/lib/rls'
import { ensureSyncChangelog } from '@/lib/sync/changelog'
import { jsonSafe, shapeSyncRow } from '@/lib/sync/json-safe'

const ENTITIES = [
  'case',
  'client',
  'hearing',
  'document',
  'fee',
  'payment',
  'task',
  'note',
  'cause_list',
  'case_party',
  'case_section',
] as const

export async function GET(req: NextRequest) {
  const user = await requireWorkspace(req)
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const workspaceId = user.activeMembership.workspaceId
  const deviceId = req.nextUrl.searchParams.get('deviceId') || ''
  const afterSeq = BigInt(req.nextUrl.searchParams.get('afterSeq') || '0')
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '200', 10), 500)
  const scopeMode = user.activeMembership.scopeMode

  await ensureSyncChangelog()

  return withWorkspaceTx(workspaceId, async (tx) => {
    const logs = await tx.changeLog.findMany({
      where: {
        workspaceId,
        seq: { gt: afterSeq },
        entity: { in: [...ENTITIES] },
      },
      orderBy: { seq: 'asc' },
      take: limit,
    })

    const changes: Array<{
      seq: string
      entity: string
      entityId: string
      op: string
      version: number
      data: unknown
    }> = []

    for (const log of logs) {
      const row = await loadEntity(tx, log.entity, log.entityId)
      if (row && 'workspaceId' in row && (row as { workspaceId: string }).workspaceId !== workspaceId) {
        continue
      }
      if (scopeMode === 'ASSIGNED_ONLY' && row && 'assignedToUserId' in (row as object)) {
        const assigned = (row as { assignedToUserId?: string | null }).assignedToUserId
        if (assigned && assigned !== user.id) continue
      }
      changes.push({
        seq: log.seq.toString(),
        entity: log.entity,
        entityId: log.entityId,
        op: log.op,
        version: log.version,
        data: shapeSyncRow(log.entity, row),
      })
    }

    const nextSeq = logs.length ? logs[logs.length - 1].seq.toString() : afterSeq.toString()
    const hasMore = logs.length === limit

    if (deviceId) {
      await tx.deviceSyncState.upsert({
        where: { deviceId_workspaceId: { deviceId, workspaceId } },
        create: {
          deviceId,
          workspaceId,
          cursorSeq: BigInt(nextSeq),
          lastPullAt: new Date(),
        },
        update: { cursorSeq: BigInt(nextSeq), lastPullAt: new Date() },
      })
    }

    const config = await tx.appConfig.findUnique({ where: { id: 'current' } })
    const assignedCaseIds =
      scopeMode === 'ASSIGNED_ONLY'
        ? (
            await tx.case.findMany({
              where: {
                workspaceId,
                deletedAt: null,
                OR: [{ assignedToUserId: user.id }, { assignedToUserId: null }],
              },
              select: { id: true },
            })
          ).map((c) => c.id)
        : []

    return NextResponse.json(
      jsonSafe({
        protocolVersion: 2,
        changes,
        nextSeq,
        hasMore,
        serverTime: new Date().toISOString(),
        scope: {
          mode: scopeMode,
          assignedCaseIds,
        },
        config: {
          configVersion: config?.configVersion ?? 1,
          minAppVersion: config?.minAppVersion ?? '1.0.0',
          killSwitches: config?.killSwitches ?? [],
        },
      }),
    )
  })
}

async function loadEntity(db: WorkspaceTx, entity: string, id: string) {
  switch (entity) {
    case 'case':
      return db.case.findUnique({ where: { id } })
    case 'client':
      return db.client.findUnique({ where: { id } })
    case 'hearing':
      return db.hearing.findUnique({ where: { id } })
    case 'document':
      return db.document.findUnique({
        where: { id },
        select: {
          id: true, workspaceId: true, caseId: true, title: true, kind: true,
          remoteKey: true, mimeType: true, sizeBytes: true, version: true,
          deletedAt: true, updatedAt: true,
        },
      })
    case 'fee':
      return db.feeEntry.findUnique({ where: { id } })
    case 'payment':
      return db.payment.findUnique({ where: { id } })
    case 'task':
      return db.task.findUnique({ where: { id } })
    case 'note':
      return db.note.findUnique({ where: { id } })
    case 'cause_list':
      return db.causeListEntry.findUnique({ where: { id } })
    case 'case_party':
      return db.caseParty.findUnique({ where: { id } })
    case 'case_section':
      return db.caseSection.findUnique({ where: { id } })
    default:
      return null
  }
}
