import assert from 'node:assert/strict'
import test from 'node:test'
import { canSubmitLawyerReview, publicRatingPayload } from './review-policy'

test('review requires a revealed contact and 1–5 stars', () => {
  const base = {
    requesterUserId: 'u1',
    lawyerUserId: 'u2',
    phoneRevealedAt: new Date(),
    existingReview: false,
    stars: 5,
    requestBelongsToUser: true,
  }
  assert.equal(canSubmitLawyerReview(base).ok, true)
  assert.equal(canSubmitLawyerReview({ ...base, stars: 0 }).ok, false)
  assert.equal(canSubmitLawyerReview({ ...base, phoneRevealedAt: null }).ok, false)
  assert.equal(canSubmitLawyerReview({ ...base, existingReview: true }).ok, false)
  assert.equal(canSubmitLawyerReview({ ...base, lawyerUserId: 'u1' }).ok, false)
  assert.equal(canSubmitLawyerReview({ ...base, requestBelongsToUser: false }).ok, false)
})

test('public rating is omitted when count is zero (never invent)', () => {
  assert.deepEqual(publicRatingPayload(4.5, 0), { ratingAvg: null, ratingCount: 0 })
  assert.deepEqual(publicRatingPayload(null, 3), { ratingAvg: null, ratingCount: 0 })
  assert.deepEqual(publicRatingPayload(4.66, 3), { ratingAvg: 4.7, ratingCount: 3 })
})
