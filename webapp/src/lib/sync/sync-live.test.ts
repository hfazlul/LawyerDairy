import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PrismaClient } from '@prisma/client'
import { PUSH_PAGE_SIZE, replayOpId } from './sync-matrix'

function loadDotEnv() {
  const p = resolve(process.cwd(), '.env')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (!process.env[k]) process.env[k] = v
  }
}

loadDotEnv()

describe('offline-sync live Postgres (skips if DATABASE_URL unreachable)', () => {
  it('protocol constants still match the matrix', () => {
    assert.equal(PUSH_PAGE_SIZE, 200)
    assert.equal(replayOpId(true), 'skip_applied')
  })

  it('SyncOpLog unique replay round-trip when a workspace exists', async () => {
    const prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      return
    }
    try {
      const ws = await prisma.workspace.findFirst({ where: { deletedAt: null } })
      if (!ws) return
      const opId = `harness-${Date.now()}-${Math.random().toString(16).slice(2)}`
      await prisma.syncOpLog.create({
        data: {
          opId,
          workspaceId: ws.id,
          userId: ws.ownerUserId,
          deviceId: 'harness-device',
          entity: 'case',
          entityId: 'harness',
          result: 'applied',
        },
      })
      let dup = false
      try {
        await prisma.syncOpLog.create({
          data: {
            opId,
            workspaceId: ws.id,
            userId: ws.ownerUserId,
            deviceId: 'harness-device',
            entity: 'case',
            entityId: 'harness',
            result: 'applied',
          },
        })
      } catch {
        dup = true
      }
      assert.equal(dup, true)
      await prisma.syncOpLog.delete({ where: { opId } })
    } finally {
      await prisma.$disconnect()
    }
  })
})
