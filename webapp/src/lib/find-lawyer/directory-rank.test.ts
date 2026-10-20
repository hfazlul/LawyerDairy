import assert from 'node:assert/strict'
import test from 'node:test'
import { compareDirectoryRows, isDirectoryVerified, practiceLabel } from './directory-rank'

test('যাচাইকৃত requires VERIFIED + verifiedAt; completeness is ignored', () => {
  assert.equal(
    isDirectoryVerified({ verificationStatus: 'VERIFIED', verifiedAt: '2026-09-01', completenessPct: 99 }),
    true,
  )
  assert.equal(
    isDirectoryVerified({ verificationStatus: 'PENDING', verifiedAt: null, completenessPct: 99 }),
    false,
  )
  assert.equal(
    isDirectoryVerified({ verificationStatus: 'UNSUBMITTED', completenessPct: 100 }),
    false,
  )
})

test('FIFO: oldest published profile first, verification is not a rank', () => {
  const highComplete = {
    id: 'b',
    verificationStatus: 'UNSUBMITTED',
    completenessPct: 99,
    profilePublishedAt: '2026-09-10',
    createdAt: '2026-09-10',
  }
  const fifoUnverified = {
    id: 'a',
    verificationStatus: 'UNSUBMITTED',
    completenessPct: 10,
    profilePublishedAt: '2026-09-01',
    createdAt: '2026-09-01',
  }
  const verified = {
    id: 'c',
    verificationStatus: 'VERIFIED',
    verifiedAt: '2026-09-12',
    completenessPct: 1,
    createdAt: '2026-09-12',
  }
  const rows = [highComplete, fifoUnverified, verified].sort(compareDirectoryRows)
  assert.equal(rows[0].id, 'a')
  assert.equal(rows[1].id, 'b')
  assert.equal(rows[2].id, 'c')
})

test('practiceLabel maps chips to Bangla', () => {
  assert.equal(practiceLabel(['civil', 'criminal']), 'দেওয়ানি · ফৌজদারি')
})
