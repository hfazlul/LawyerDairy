import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  conflictKeepLocalNeedsNewOpId,
  employeeMaySeeCase,
  entitlementStillValid,
  isStaleBaseVersion,
  outboxPagesNeeded,
  replayDecision,
  replayOpId,
} from './sync-matrix'
import { jsonSafe, shapeSyncRow } from './json-safe'

describe('offline-sync matrix §6.2 (protocol)', () => {
  it('offline create then reconnect: one opId applies once', () => {
    assert.equal(replayOpId(false), 'apply')
    assert.equal(replayOpId(true), 'skip_applied')
  })

  it('two devices edit nextDate offline: stale baseVersion is conflict, not silent drop', () => {
    assert.equal(isStaleBaseVersion(1, 3), true)
    assert.equal(isStaleBaseVersion(3, 3), false)
  })

  it('kill mid-push: same opId replays as already applied', () => {
    assert.equal(replayOpId(true), 'skip_applied')
  })

  it('rejected and conflicted ops are retried; only applied is skipped', () => {
    assert.equal(replayDecision('applied'), 'skip_applied')
    assert.equal(replayDecision('rejected'), 'apply')
    assert.equal(replayDecision('conflict'), 'apply')
    assert.equal(replayDecision(null), 'apply')
    assert.equal(replayDecision(undefined), 'apply')
  })

  it('employee assigned-only hides unassigned cases', () => {
    assert.equal(employeeMaySeeCase('ASSIGNED_ONLY', ['c1'], 'c1'), true)
    assert.equal(employeeMaySeeCase('ASSIGNED_ONLY', ['c1'], 'c2'), false)
    assert.equal(employeeMaySeeCase('ALL', [], 'c9'), true)
  })

  it('airplane 8 days stays in grace; day 9 expires', () => {
    assert.equal(entitlementStillValid(8), true)
    assert.equal(entitlementStillValid(9), false)
  })

  it('500 pending outbox items need 3 pages of 200', () => {
    assert.equal(outboxPagesNeeded(500), 3)
    assert.equal(outboxPagesNeeded(0), 0)
  })

  it('keep-local after conflict burns old opId', () => {
    assert.equal(conflictKeepLocalNeedsNewOpId('op-old', 'op-new-xx'), true)
    assert.equal(conflictKeepLocalNeedsNewOpId('op-same', 'op-same'), false)
  })

  it('a fee amount does not crash a download that also carries clients', () => {
    const body = jsonSafe({
      changes: [
        { entity: 'client', data: { name: 'Billu mia' } },
        { entity: 'fee', data: { amountPaisa: 25000n, kind: 'received' } },
      ],
    })
    const fee = shapeSyncRow('fee', { amountPaisa: 25000n, kind: 'fee', dueDate: '2026-10-18T00:00:00.000Z' }) as {
      amountPaisa: number
      amount: number
      type: string
      date: string
    }
    assert.equal(body.changes[0].data.name, 'Billu mia')
    assert.equal(body.changes[1].data.amountPaisa, 25000)
    assert.equal(fee.amountPaisa, 25000)
    assert.equal(fee.amount, 250)
    assert.equal(fee.type, 'fee')
    assert.equal(fee.date, '2026-10-18T00:00:00.000Z')
  })
})
