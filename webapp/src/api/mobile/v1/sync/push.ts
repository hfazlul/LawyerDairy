// POST /api/mobile/v1/sync/push
// Body: { ops: SyncOp[] }
// Returns: { applied: string[], conflicts: SyncConflict[], serverTime: string }

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { z } from 'zod'

const SyncOpSchema = z.object({
  opId: z.string().uuid(),
  entity: z.enum(['case', 'hearing', 'client', 'fee', 'document']),
  id: z.string(),
  type: z.enum(['upsert', 'delete']),
  rev: z.number().int().min(0),
  data: z.record(z.any()),
  createdAt: z.string().datetime(),
})

type SyncEntity = z.infer<typeof SyncOpSchema>['entity']

function readRev(row: unknown): number | null {
  if (row && typeof row === 'object' && 'rev' in row && typeof (row as { rev: unknown }).rev === 'number') {
    return (row as { rev: number }).rev
  }
  return null
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { ops } = z.object({ ops: z.array(SyncOpSchema).max(200) }).parse(await req.json())

  const applied: string[] = []
  const conflicts: unknown[] = []

  for (const op of ops) {
    try {
      const existing = await _getExisting(op.entity, op.id)

      if (op.type === 'delete') {
        await _softDelete(op.entity, op.id)
        applied.push(op.opId)
        continue
      }

      const serverRev = readRev(existing)
      // Conflict only when both sides have rev and server is newer
      if (serverRev != null && serverRev > op.rev) {
        conflicts.push({
          id: op.id,
          entity: op.entity,
          serverRev,
          serverData: existing,
        })
        continue
      }

      await _upsert(op.entity, op.id, user.chamberId, op.data, op.rev)
      applied.push(op.opId)
    } catch (err) {
      console.error(`Push error for op ${op.opId}:`, err)
    }
  }

  return NextResponse.json({
    applied,
    conflicts,
    serverTime: new Date().toISOString(),
  })
}

async function _getExisting(entity: SyncEntity, id: string) {
  switch (entity) {
    case 'case':
      return prisma.case.findUnique({ where: { id } })
    case 'hearing':
      return prisma.hearing.findUnique({ where: { id } })
    case 'client':
      return prisma.client.findUnique({ where: { id } })
    case 'fee':
      return prisma.feeEntry.findUnique({ where: { id } })
    case 'document':
      return prisma.document.findUnique({ where: { id } })
    default:
      return null
  }
}

async function _upsert(
  entity: SyncEntity,
  id: string,
  chamberId: string,
  data: Record<string, unknown>,
  rev: number,
) {
  const now = new Date()

  switch (entity) {
    case 'case':
      return prisma.case.upsert({
        where: { id },
        create: {
          id,
          chamberId,
          rev,
          caseNo: String(data.caseNo ?? ''),
          caseType: String(data.caseType ?? ''),
          court: String(data.court ?? ''),
          courtName: data.courtName ? String(data.courtName) : null,
          nextDate: data.nextDate ? new Date(String(data.nextDate)) : null,
          updatedAt: now,
        },
        update: {
          rev,
          caseNo: data.caseNo != null ? String(data.caseNo) : undefined,
          caseType: data.caseType != null ? String(data.caseType) : undefined,
          court: data.court != null ? String(data.court) : undefined,
          courtName: data.courtName != null ? String(data.courtName) : undefined,
          nextDate: data.nextDate ? new Date(String(data.nextDate)) : undefined,
          updatedAt: now,
        },
      })
    case 'hearing':
      return prisma.hearing.upsert({
        where: { id },
        create: {
          id,
          chamberId,
          rev,
          caseId: String(data.caseId ?? ''),
          date: new Date(String(data.date ?? now.toISOString())),
          purpose: data.purpose ? String(data.purpose) : null,
          outcome: data.outcome ? String(data.outcome) : null,
          note: data.note ? String(data.note) : null,
          updatedAt: now,
        },
        update: {
          rev,
          date: data.date ? new Date(String(data.date)) : undefined,
          purpose: data.purpose != null ? String(data.purpose) : undefined,
          outcome: data.outcome != null ? String(data.outcome) : undefined,
          note: data.note != null ? String(data.note) : undefined,
          updatedAt: now,
        },
      })
    case 'client':
      // Client has no rev column yet — last-write-wins without conflict
      return prisma.client.upsert({
        where: { id },
        create: {
          id,
          chamberId,
          name: String(data.name ?? ''),
          phone: data.phone ? String(data.phone) : null,
          email: data.email ? String(data.email) : null,
          note: data.note ? String(data.note) : null,
          createdAt: now,
        },
        update: {
          name: data.name != null ? String(data.name) : undefined,
          phone: data.phone != null ? String(data.phone) : undefined,
          email: data.email != null ? String(data.email) : undefined,
          note: data.note != null ? String(data.note) : undefined,
        },
      })
    case 'fee':
      return prisma.feeEntry.upsert({
        where: { id },
        create: {
          id,
          chamberId,
          caseId: String(data.caseId ?? ''),
          type: (data.type as 'FEE_AGREED' | 'RECEIVED' | 'EXPENSE_COURT_FEE' | 'EXPENSE_STAMP' | 'EXPENSE_OTHER') ?? 'RECEIVED',
          amount: Number(data.amount ?? 0),
          date: new Date(String(data.date ?? now.toISOString())),
          note: data.note ? String(data.note) : null,
          createdAt: now,
        },
        update: {
          amount: data.amount != null ? Number(data.amount) : undefined,
          date: data.date ? new Date(String(data.date)) : undefined,
          note: data.note != null ? String(data.note) : undefined,
        },
      })
    case 'document':
      // Documents are phone-primary; sync upsert is a stub for later cloud vault
      return prisma.document.upsert({
        where: { id },
        create: {
          id,
          chamberId,
          caseId: String(data.caseId ?? ''),
          kind: (data.kind as 'ARJI' | 'JOBAB' | 'OKALATNAMA' | 'SHAKKHYA' | 'ADESH' | 'OTHER') ?? 'OTHER',
          title: String(data.title ?? 'Document'),
          storageKey: String(data.storageKey ?? id),
          pageCount: Number(data.pageCount ?? 1),
          sizeBytes: Number(data.sizeBytes ?? 0),
          createdAt: now,
        },
        update: {
          title: data.title != null ? String(data.title) : undefined,
          ocrText: data.ocrText != null ? String(data.ocrText) : undefined,
        },
      })
  }
}

async function _softDelete(entity: SyncEntity, id: string) {
  const now = new Date()
  switch (entity) {
    case 'case':
      return prisma.case.update({ where: { id }, data: { deletedAt: now, updatedAt: now } })
    case 'hearing':
      return prisma.hearing.update({ where: { id }, data: { deletedAt: now, updatedAt: now } })
    case 'client':
      return prisma.client.update({ where: { id }, data: { deletedAt: now } })
    case 'document':
      return prisma.document.update({ where: { id }, data: { deletedAt: now } })
    case 'fee':
      // FeeEntry has no deletedAt — skip soft-delete until schema adds it
      return null
  }
}
