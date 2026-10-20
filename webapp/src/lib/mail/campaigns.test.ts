import assert from 'node:assert/strict'
import test from 'node:test'
import { campaignAudienceWhere } from './campaigns'

test('inactive audience requires no active paid owned workspace', () => {
  const now = new Date('2026-08-27T00:00:00.000Z')
  const in7 = new Date('2026-09-03T00:00:00.000Z')
  const where = campaignAudienceWhere('inactive', now, in7)
  assert.ok(where.ownedWorkspaces?.none)
  assert.deepEqual(where.ownedWorkspaces?.none?.plan, { not: 'FREE' })
})

test('expiring audience is paid workspaces with planExpiresAt in next 7 days', () => {
  const now = new Date('2026-08-27T00:00:00.000Z')
  const in7 = new Date('2026-09-03T00:00:00.000Z')
  const where = campaignAudienceWhere('expiring', now, in7)
  assert.ok(where.ownedWorkspaces?.some)
  assert.deepEqual(where.ownedWorkspaces?.some?.planExpiresAt, { gte: now, lte: in7 })
})

test('all audience adds no workspace filter', () => {
  const now = new Date()
  const in7 = new Date()
  assert.deepEqual(campaignAudienceWhere('all', now, in7), {})
})
