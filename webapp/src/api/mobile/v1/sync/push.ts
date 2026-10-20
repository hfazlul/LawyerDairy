import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireWorkspace } from '@/lib/auth-middleware'
import { withWorkspaceTx } from '@/lib/rls'
import { z } from 'zod'
import { newId } from '@/lib/crypto-tokens'
import { searchTokens } from '@/lib/bn-text'
import { ensureSyncChangelog } from '@/lib/sync/changelog'
import { replayDecision } from '@/lib/sync/sync-matrix'
import { mobileCatalogCourtName } from '@/lib/mobile-court-names'

const SyncOpSchema = z.object({
  opId: z.string().min(8),
  entity: z.enum([
    'case', 'hearing', 'client', 'fee', 'document',
    'case_party', 'case_section', 'task', 'payment', 'note', 'cause_list',
  ]),
  entityId: z.string().min(1),
  opType: z.enum(['insert', 'update', 'delete', 'upsert']),
  baseVersion: z.number().int().min(0).optional(),
  changedFields: z.array(z.string()).optional(),
  data: z.record(z.any()).optional(),
  clientUpdatedAt: z.number().optional(),
  sequence: z.number().optional(),
})

function assignedOnlyWhere(userId: string) {
  return { assignedToUserId: userId }
}

export async function POST(req: NextRequest) {
  const authed = await requireWorkspace(req)
  if (!authed?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const membership = authed.activeMembership
  const workspaceId = membership.workspaceId
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ applied: [], conflicts: [], rejected: [{ reason: 'invalid_json' }] }, { status: 200 })
  }
  const parsedBody = z
    .object({
      protocolVersion: z.number().optional(),
      deviceId: z.string().optional(),
      workspaceId: z.string(),
      clientTime: z.string().optional(),
      ops: z.array(z.unknown()).max(200),
    })
    .safeParse(rawBody)
  if (!parsedBody.success) {
    return NextResponse.json(
      { applied: [], conflicts: [], rejected: [{ reason: 'invalid_body' }] },
      { status: 200 },
    )
  }
  const body = parsedBody.data
  const rejectedEarly: unknown[] = []
  const ops: z.infer<typeof SyncOpSchema>[] = []
  for (const item of body.ops) {
    const one = SyncOpSchema.safeParse(item)
    if (!one.success) {
      const bag = item && typeof item === 'object' ? (item as { opId?: unknown; entity?: unknown }) : {}
      rejectedEarly.push({
        opId: bag.opId != null ? String(bag.opId) : '',
        entity: bag.entity != null ? String(bag.entity) : '',
        reason: 'unsupported_or_invalid',
      })
      continue
    }
    ops.push(one.data)
  }
  const entityOrder = [
    'client',
    'case',
    'case_party',
    'case_section',
    'hearing',
    'fee',
    'payment',
    'task',
    'note',
    'document',
    'cause_list',
  ]
  ops.sort((a, b) => entityOrder.indexOf(a.entity) - entityOrder.indexOf(b.entity))

  if (body.workspaceId !== workspaceId) {
    return NextResponse.json({ error: 'workspace_mismatch' }, { status: 403 })
  }

  await ensureSyncChangelog()

  const applied: string[] = []
  const conflicts: unknown[] = []
  const rejected: unknown[] = [...rejectedEarly]

  for (const op of ops) {
    const prior = await prisma.syncOpLog.findUnique({ where: { opId: op.opId } })
    if (replayDecision(prior?.result) === 'skip_applied') {
      applied.push(op.opId)
      continue
    }
    if (prior) {
      await prisma.syncOpLog.delete({ where: { opId: op.opId } })
    }

    try {
      const result = await withWorkspaceTx(workspaceId, async (tx) => {
        const outcome = await applyOp({
          op,
          workspaceId,
          userId: authed.id,
          deviceId: body.deviceId,
          scopeMode: membership.scopeMode,
          db: tx,
        })
        await tx.syncOpLog.create({
          data: {
            opId: op.opId,
            workspaceId,
            userId: authed.id,
            deviceId: body.deviceId || 'unknown',
            entity: op.entity,
            entityId: op.entityId,
            result: outcome === 'ok' ? 'applied' : outcome,
          },
        })
        return outcome
      })
      if (result === 'conflict') {
        conflicts.push({
          opId: op.opId,
          entity: op.entity,
          entityId: op.entityId,
          serverVersion: await entityVersion(workspaceId, op.entity, op.entityId),
        })
      } else if (result === 'rejected') {
        rejected.push({ opId: op.opId, reason: 'not_found_or_forbidden' })
      } else {
        applied.push(op.opId)
      }
    } catch (err) {
      console.error(`Push error ${op.opId}`, err)
      rejected.push({ opId: op.opId, reason: 'server_error' })
    }
  }

  if (body.deviceId) {
    await prisma.deviceSyncState.upsert({
      where: { deviceId_workspaceId: { deviceId: body.deviceId, workspaceId } },
      create: { deviceId: body.deviceId, workspaceId, lastPushAt: new Date() },
      update: { lastPushAt: new Date() },
    })
  }

  const config = await prisma.appConfig.findUnique({ where: { id: 'current' } })
  return NextResponse.json({
    applied,
    conflicts,
    rejected,
    serverTime: new Date().toISOString(),
    config: {
      configVersion: config?.configVersion ?? 1,
      minAppVersion: config?.minAppVersion ?? '1.0.0',
      killSwitches: config?.killSwitches ?? [],
    },
  })
}

const COURT_LEVEL_LABELS: Record<string, { bn: string; en: string }> = {
  district: { bn: 'জেলা', en: 'District' },
  metropolitan: { bn: 'মহানগর', en: 'Metropolitan' },
  supreme_court: { bn: 'সুপ্রিম কোর্ট', en: 'Supreme Court' },
}

const COURT_TYPE_LABELS: Record<string, { bn: string; en: string }> = {
  dj: { bn: 'জেলা জজ আদালত', en: 'District Judge Court' },
  cjm: { bn: 'চীফ জুডিসিয়াল ম্যাজিস্ট্রেট আদালত', en: 'CJM Court' },
  tribunal: { bn: 'ট্রাইব্যুনাল', en: 'Tribunal' },
  mdsj: { bn: 'মহানগর দায়রা জজ আদালত', en: 'Metropolitan Sessions Judge Court' },
  cmm: { bn: 'চীফ মেট্রোপলিটন ম্যাজিস্ট্রেট আদালত', en: 'CMM Court' },
  metro_special: { bn: 'বিশেষ ট্রাইব্যুনাল', en: 'Special Tribunal' },
  hcd: { bn: 'হাইকোর্ট বিভাগ', en: 'High Court Division' },
  ad: { bn: 'আপিল বিভাগ', en: 'Appellate Division' },
  ct_district_sessions_judge: { bn: 'জেলা ও দায়রা জজ আদালত', en: 'District and Sessions Judge Court' },
}

/** Phone court ids are required foreign keys. Create a stub when the master pack has not been loaded. */
async function ensureCourtLevelAndType(
  db: import('@prisma/client').Prisma.TransactionClient,
  courtLevelId: string,
  courtTypeId: string,
) {
  const level = COURT_LEVEL_LABELS[courtLevelId] ?? { bn: courtLevelId, en: courtLevelId }
  await db.courtLevel.upsert({
    where: { id: courtLevelId },
    create: { id: courtLevelId, nameBn: level.bn, nameEn: level.en },
    update: {},
  })
  const existingType = await db.courtType.findUnique({ where: { id: courtTypeId }, select: { id: true } })
  if (existingType) return
  const type = COURT_TYPE_LABELS[courtTypeId] ?? { bn: courtTypeId, en: courtTypeId }
  await db.courtType.create({
    data: {
      id: courtTypeId,
      courtLevelId,
      nameBn: type.bn,
      nameEn: type.en,
    },
  })
}

function textOrNull(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text.length ? text : null
}

function optionalDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

async function keepExistingId(
  db: import('@prisma/client').Prisma.TransactionClient,
  kind: 'court' | 'caseType',
  id: string | null,
): Promise<string | null> {
  if (!id) return null
  if (kind === 'court') {
    const row = await db.court.findUnique({ where: { id }, select: { id: true } })
    return row ? id : null
  }
  const row = await db.caseType.findUnique({ where: { id }, select: { id: true } })
  return row ? id : null
}

async function entityVersion(workspaceId: string, entity: string, id: string): Promise<number | undefined> {
  return withWorkspaceTx(workspaceId, async (tx) => {
    switch (entity) {
      case 'case':
        return (await tx.case.findUnique({ where: { id }, select: { version: true } }))?.version
      case 'client':
        return (await tx.client.findUnique({ where: { id }, select: { version: true } }))?.version
      case 'hearing':
        return (await tx.hearing.findUnique({ where: { id }, select: { version: true } }))?.version
      case 'fee':
        return (await tx.feeEntry.findUnique({ where: { id }, select: { version: true } }))?.version
      case 'document':
        return (await tx.document.findUnique({ where: { id }, select: { version: true } }))?.version
      case 'task':
        return (await tx.task.findUnique({ where: { id }, select: { version: true } }))?.version
      default:
        return undefined
    }
  })
}

async function applyOp(opts: {
  op: z.infer<typeof SyncOpSchema>
  workspaceId: string
  userId: string
  deviceId?: string
  scopeMode: 'ALL' | 'ASSIGNED_ONLY'
  db: import('@prisma/client').Prisma.TransactionClient
}): Promise<'ok' | 'conflict' | 'rejected'> {
  const { op, workspaceId, userId, deviceId, scopeMode, db: prisma } = opts
  const data = op.data ?? {}
  const isDelete = op.opType === 'delete'

  if (op.entity === 'case') {
    const existing = await prisma.case.findUnique({ where: { id: op.entityId } })
    if (existing && existing.workspaceId !== workspaceId) return 'rejected'
    if (scopeMode === 'ASSIGNED_ONLY' && existing && existing.assignedToUserId !== userId) {
      return 'rejected'
    }
    if (existing && (op.baseVersion ?? 0) < existing.version && !isDelete) return 'conflict'
    if (isDelete) {
      if (!existing) return 'ok'
      await prisma.case.update({
        where: { id: op.entityId },
        data: {
          deletedAt: new Date(),
          version: existing.version + 1,
          updatedByUserId: userId,
          deviceId,
        },
      })
      return 'ok'
    }
    const caseNo = String(data.caseNo ?? existing?.caseNo ?? '')
    const courtLevelId = String(data.courtLevelId ?? existing?.courtLevelId ?? 'district') || 'district'
    const courtTypeId = String(data.courtTypeId ?? existing?.courtTypeId ?? 'dj') || 'dj'
    await ensureCourtLevelAndType(prisma, courtLevelId, courtTypeId)
    const requestedCourtUid = textOrNull(data.courtUid) ?? existing?.courtUid ?? null
    const courtUid = await keepExistingId(prisma, 'court', requestedCourtUid)
    const caseTypeId = await keepExistingId(
      prisma,
      'caseType',
      textOrNull(data.caseTypeId) ?? existing?.caseTypeId ?? null,
    )
    const courtNameFree =
      textOrNull(data.courtNameFree) ??
      textOrNull(data.courtName) ??
      mobileCatalogCourtName(requestedCourtUid) ??
      existing?.courtNameFree ??
      null
    const caseYearRaw = data.caseYear != null ? Number(data.caseYear) : existing?.caseYear ?? null
    const payload = {
      workspaceId,
      courtLevelId,
      courtTypeId,
      courtUid,
      courtNameFree,
      courtRoom: data.courtRoom != null ? String(data.courtRoom) : existing?.courtRoom ?? null,
      caseTypeId,
      caseTypeFree: data.caseTypeFree != null ? String(data.caseTypeFree) : existing?.caseTypeFree ?? null,
      caseNo,
      caseNoNormalized: String(data.caseNoNormalized ?? caseNo.replace(/\s+/g, '').toLowerCase()),
      caseYear: caseYearRaw != null && Number.isFinite(caseYearRaw) ? caseYearRaw : null,
      nextDate: data.nextDate != null
        ? (optionalDate(data.nextDate) ?? existing?.nextDate ?? null)
        : existing?.nextDate ?? null,
      status: String(data.status ?? existing?.status ?? 'active'),
      priority: String(data.priority ?? existing?.priority ?? 'medium'),
      notes: data.notes != null ? String(data.notes) : existing?.notes ?? null,
      fileNo: data.fileNo != null ? String(data.fileNo) : existing?.fileNo ?? null,
      policeStation: data.policeStation != null ? String(data.policeStation) : existing?.policeStation ?? null,
      judgeName: data.judgeName != null ? String(data.judgeName) : existing?.judgeName ?? null,
      assignedToUserId: data.assignedToUserId != null ? String(data.assignedToUserId) : existing?.assignedToUserId ?? userId,
      createdByUserId: existing?.createdByUserId ?? userId,
      searchTokens: searchTokens(caseNo, courtNameFree ?? ''),
      version: (existing?.version ?? 0) + 1,
      updatedByUserId: userId,
      deviceId,
      deletedAt: null,
    }
    await prisma.case.upsert({
      where: { id: op.entityId },
      create: { id: op.entityId, ...payload },
      update: payload,
    })
    return 'ok'
  }

  if (op.entity === 'client') {
    const existing = await prisma.client.findUnique({ where: { id: op.entityId } })
    if (existing && existing.workspaceId !== workspaceId) return 'rejected'
    if (existing && (op.baseVersion ?? 0) < existing.version && !isDelete) return 'conflict'
    if (isDelete) {
      if (!existing) return 'ok'
      await prisma.client.update({
        where: { id: op.entityId },
        data: { deletedAt: new Date(), version: existing.version + 1, updatedByUserId: userId, deviceId },
      })
      return 'ok'
    }
    const name = String(data.name ?? existing?.name ?? '')
    const payload = {
      workspaceId,
      name,
      phone: data.phone != null ? String(data.phone) : existing?.phone ?? null,
      phoneNormalized: data.phoneNormalized != null ? String(data.phoneNormalized) : existing?.phoneNormalized ?? null,
      email: data.email != null ? String(data.email) : existing?.email ?? null,
      address: data.address != null ? String(data.address) : existing?.address ?? null,
      defaultPartyRoleId: data.defaultPartyRoleId != null ? String(data.defaultPartyRoleId) : existing?.defaultPartyRoleId ?? null,
      note: data.note != null ? String(data.note) : existing?.note ?? null,
      searchTokens: searchTokens(name, String(data.phone ?? '')),
      version: (existing?.version ?? 0) + 1,
      updatedByUserId: userId,
      deviceId,
      deletedAt: null,
    }
    await prisma.client.upsert({
      where: { id: op.entityId },
      create: { id: op.entityId, ...payload },
      update: payload,
    })
    return 'ok'
  }

  if (op.entity === 'hearing') {
    const existing = await prisma.hearing.findUnique({ where: { id: op.entityId } })
    if (existing && existing.workspaceId !== workspaceId) return 'rejected'
    if (isDelete && existing) {
      await prisma.hearing.update({
        where: { id: op.entityId },
        data: { deletedAt: new Date(), version: existing.version + 1, updatedByUserId: userId, deviceId },
      })
      return 'ok'
    }
    const caseId = String(data.caseId ?? existing?.caseId ?? '')
    const parent = await prisma.case.findFirst({ where: { id: caseId, workspaceId } })
    if (!parent) return 'rejected'
    const payload = {
      workspaceId,
      caseId,
      date: new Date(String(data.date ?? existing?.date ?? new Date().toISOString())),
      purpose: data.purpose != null ? String(data.purpose) : existing?.purpose ?? null,
      outcome: data.outcome != null ? String(data.outcome) : existing?.outcome ?? null,
      note: data.note != null ? String(data.note) : existing?.note ?? null,
      attended: Boolean(data.attended ?? existing?.attended ?? false),
      version: (existing?.version ?? 0) + 1,
      updatedByUserId: userId,
      deviceId,
      deletedAt: null,
    }
    await prisma.hearing.upsert({
      where: { id: op.entityId },
      create: { id: op.entityId, ...payload },
      update: payload,
    })
    return 'ok'
  }

  if (op.entity === 'case_party') {
    const existing = await prisma.caseParty.findUnique({ where: { id: op.entityId } })
    if (existing && existing.workspaceId !== workspaceId) return 'rejected'
    const caseId = String(data.caseId ?? existing?.caseId ?? '')
    const parent = await prisma.case.findFirst({ where: { id: caseId, workspaceId } })
    if (!parent) return 'rejected'
    if (isDelete && existing) {
      await prisma.caseParty.update({
        where: { id: op.entityId },
        data: { deletedAt: new Date(), version: existing.version + 1 },
      })
      return 'ok'
    }
    await prisma.caseParty.upsert({
      where: { id: op.entityId },
      create: {
        id: op.entityId,
        workspaceId,
        caseId,
        clientId: data.clientId ? String(data.clientId) : null,
        partyName: String(data.partyName ?? ''),
        partyRoleId: String(
          data.partyRoleId ?? (data.clientId ? 'role_client' : 'role_plaintiff'),
        ),
        representationSideId: String(data.representationSideId ?? 'client_side'),
        isPrimary: Boolean(data.isPrimary ?? false),
        updatedByUserId: userId,
        deviceId,
      },
      update: {
        partyName: data.partyName != null ? String(data.partyName) : undefined,
        partyRoleId: data.partyRoleId != null ? String(data.partyRoleId) : undefined,
        representationSideId: data.representationSideId != null ? String(data.representationSideId) : undefined,
        version: { increment: 1 },
        updatedByUserId: userId,
        deviceId,
      },
    })
    return 'ok'
  }

  if (op.entity === 'case_section') {
    const existing = await prisma.caseSection.findUnique({ where: { id: op.entityId } })
    if (existing && existing.workspaceId !== workspaceId) return 'rejected'
    const caseId = String(data.caseId ?? existing?.caseId ?? '')
    const parent = await prisma.case.findFirst({ where: { id: caseId, workspaceId } })
    if (!parent) return 'rejected'
    if (isDelete && existing) {
      await prisma.caseSection.update({
        where: { id: op.entityId },
        data: { deletedAt: new Date(), version: existing.version + 1 },
      })
      return 'ok'
    }
    await prisma.caseSection.upsert({
      where: { id: op.entityId },
      create: {
        id: op.entityId,
        workspaceId,
        caseId,
        actId: data.actId ? String(data.actId) : null,
        sectionId: data.sectionId ? String(data.sectionId) : null,
        rawText: data.rawText ? String(data.rawText) : null,
        displayLabel: String(data.displayLabel ?? data.rawText ?? ''),
        updatedByUserId: userId,
        deviceId,
      },
      update: {
        displayLabel: data.displayLabel != null ? String(data.displayLabel) : undefined,
        version: { increment: 1 },
      },
    })
    return 'ok'
  }

  if (op.entity === 'fee') {
    const existing = await prisma.feeEntry.findUnique({ where: { id: op.entityId } })
    if (existing && existing.workspaceId !== workspaceId) return 'rejected'
    if (isDelete && existing) {
      await prisma.feeEntry.update({
        where: { id: op.entityId },
        data: { deletedAt: new Date(), version: existing.version + 1 },
      })
      return 'ok'
    }
    await prisma.feeEntry.upsert({
      where: { id: op.entityId },
      create: {
        id: op.entityId,
        workspaceId,
        caseId: data.caseId ? String(data.caseId) : null,
        clientId: data.clientId ? String(data.clientId) : null,
        kind: String(data.kind ?? data.type ?? 'fee'),
        title: String(data.title ?? data.type ?? 'Fee'),
        amountPaisa: BigInt(data.amountPaisa ?? Math.round(Number(data.amount ?? 0) * 100)),
        updatedByUserId: userId,
        deviceId,
      },
      update: {
        amountPaisa: data.amountPaisa != null ? BigInt(data.amountPaisa) : undefined,
        status: data.status != null ? String(data.status) : undefined,
        version: { increment: 1 },
      },
    })
    return 'ok'
  }

  if (op.entity === 'document') {
    const existing = await prisma.document.findUnique({ where: { id: op.entityId } })
    if (existing && existing.workspaceId !== workspaceId) return 'rejected'
    if (isDelete && existing) {
      await prisma.document.update({
        where: { id: op.entityId },
        data: { deletedAt: new Date(), version: existing.version + 1 },
      })
      return 'ok'
    }
    await prisma.document.upsert({
      where: { id: op.entityId },
      create: {
        id: op.entityId,
        workspaceId,
        caseId: data.caseId ? String(data.caseId) : null,
        title: String(data.title ?? 'Document'),
        remoteKey: data.remoteKey ? String(data.remoteKey) : null,
        mimeType: String(data.mimeType ?? 'application/pdf'),
        sizeBytes: BigInt(data.sizeBytes ?? 0),
        updatedByUserId: userId,
        deviceId,
      },
      update: {
        title: data.title != null ? String(data.title) : undefined,
        version: { increment: 1 },
      },
    })
    return 'ok'
  }

  if (op.entity === 'cause_list') {
    const existing = await prisma.causeListEntry.findUnique({ where: { id: op.entityId } })
    if (existing && existing.workspaceId !== workspaceId) return 'rejected'
    await prisma.causeListEntry.upsert({
      where: { id: op.entityId },
      create: {
        id: op.entityId,
        workspaceId,
        caseId: data.caseId ? String(data.caseId) : null,
        date: new Date(String(data.date ?? new Date().toISOString())),
        source: String(data.source ?? 'manual'),
        courtUid: data.courtUid ? String(data.courtUid) : null,
        courtNameFree: data.courtNameFree ? String(data.courtNameFree) : null,
        purpose: data.purpose ? String(data.purpose) : null,
        actionStatus: String(data.actionStatus ?? 'pending'),
        updatedByUserId: userId,
        deviceId,
      },
      update: {
        actionStatus: data.actionStatus != null ? String(data.actionStatus) : undefined,
        version: { increment: 1 },
      },
    })
    return 'ok'
  }

  if (op.entity === 'task') {
    const existing = await prisma.task.findUnique({ where: { id: op.entityId } })
    if (existing && existing.workspaceId !== workspaceId) return 'rejected'
    await prisma.task.upsert({
      where: { id: op.entityId },
      create: {
        id: op.entityId,
        workspaceId,
        title: String(data.title ?? 'Task'),
        caseId: data.caseId ? String(data.caseId) : null,
        dueDate: data.dueDate ? new Date(String(data.dueDate)) : null,
        kind: (data.kind as 'TASK') ?? 'TASK',
        updatedByUserId: userId,
        deviceId,
      },
      update: {
        title: data.title != null ? String(data.title) : undefined,
        status: data.status != null ? String(data.status) : undefined,
        version: { increment: 1 },
      },
    })
    return 'ok'
  }

  void assignedOnlyWhere
  void newId
  return 'rejected'
}
