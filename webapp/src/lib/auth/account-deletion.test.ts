import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isWithinDeletionGrace, purgeAtFrom } from './account-deletion'

describe('account deletion grace', () => {
  it('is within 30 days and expired after', () => {
    const deleted = new Date('2026-07-01T00:00:00Z')
    assert.equal(isWithinDeletionGrace(deleted, new Date('2026-07-15T00:00:00Z')), true)
    assert.equal(isWithinDeletionGrace(deleted, new Date('2026-08-15T00:00:00Z')), false)
    assert.equal(purgeAtFrom(deleted).toISOString().startsWith('2026-07-31'), true)
  })
})
