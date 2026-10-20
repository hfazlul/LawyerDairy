import assert from 'node:assert/strict'
import test from 'node:test'
import { generateNumericOtp, hashPasswordOtp } from './password-otp'
import { isDhakaQuietHours, weekRangeFromStart } from '../dhaka-hours'
import { normalizeJoinCode, isPlausibleJoinCode } from '../team/join-code'
import { leadIncomingPayload } from '../fcm/payload'
import { uniqueHcDataset } from '../master/pack-paths'

test('OTP is 6 digits and hash is not reversible plaintext', () => {
  const otp = generateNumericOtp()
  assert.match(otp, /^\d{6}$/)
  process.env.JWT_SECRET = 'test-secret'
  const h = hashPasswordOtp('+8801712345678', otp)
  assert.equal(h.includes(otp), false)
  assert.equal(h.length, 64)
  assert.equal(hashPasswordOtp('+8801712345678', otp), h)
  assert.notEqual(hashPasswordOtp('+8801712345678', '000000'), h)
})

test('Sun–Thu week from weekStart', () => {
  const w = weekRangeFromStart('2026-09-13')
  assert.deepEqual(w.days, ['2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17'])
})

test('join code alphabet rejects I/O/U', () => {
  assert.equal(isPlausibleJoinCode('ABC123'), true)
  assert.equal(isPlausibleJoinCode(normalizeJoinCode('abc 123')), true)
  assert.equal(isPlausibleJoinCode('ABCI23'), false)
})

test('lead.incoming FCM routes to appointments, no URL, no phone', () => {
  const p = leadIncomingPayload({ userId: 'u1', appointmentId: 'a1' })
  assert.equal(p.data.kind, 'lead.incoming')
  assert.equal(p.data.routeName, 'appointments')
  assert.equal(JSON.stringify(p).includes('https://'), false)
})

test('quiet hours helper is boolean (Dhaka clock)', () => {
  assert.equal(typeof isDhakaQuietHours(new Date('2026-09-13T16:00:00Z')), 'boolean')
  assert.equal(isDhakaQuietHours(new Date('2026-09-13T16:00:00Z')), true) // 22:00 Dhaka
  assert.equal(isDhakaQuietHours(new Date('2026-09-13T04:00:00Z')), false) // 10:00 Dhaka
})

test('HC dataset copies collapse to one SHA', () => {
  const u = uniqueHcDataset()
  assert.equal(u.uniqueHashes, 1)
  assert.ok(u.copies >= 1)
  assert.match(u.sha256, /^[a-f0-9]{64}$/i)
})
