import assert from 'node:assert/strict'
import test from 'node:test'
import { addDaysYmd, dhakaYmd, levelFromXp, nextStreakDays } from './habit'

test('dhaka YMD is UTC+6 calendar day', () => {
  const utc = new Date('2026-08-24T20:00:00.000Z') // 02:00 Aug 25 in Dhaka
  assert.equal(dhakaYmd(utc), '2026-08-25')
})

test('streak increments across consecutive Dhaka days', () => {
  const now = new Date('2026-08-25T12:00:00.000Z')
  const yesterday = new Date('2026-08-24T12:00:00.000Z')
  assert.equal(nextStreakDays(yesterday, 3, now), 4)
  assert.equal(nextStreakDays(now, 3, now), 3)
  assert.equal(nextStreakDays(new Date('2026-08-20T12:00:00.000Z'), 9, now), 1)
  assert.equal(nextStreakDays(null, 0, now), 1)
})

test('addDaysYmd and levelFromXp', () => {
  assert.equal(addDaysYmd('2026-08-25', -1), '2026-08-24')
  assert.equal(levelFromXp(0), 1)
  assert.equal(levelFromXp(99), 1)
  assert.equal(levelFromXp(100), 2)
})
