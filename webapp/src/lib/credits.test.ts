import assert from 'node:assert/strict'
import test from 'node:test'
import { smsSegments } from './credits'

test('Bangla SMS is 70 chars per segment; Latin 160', () => {
  assert.equal(smsSegments('hello'), 1)
  assert.equal(smsSegments('a'.repeat(161)), 2)
  assert.equal(smsSegments('আইন'), 1)
  assert.equal(smsSegments('ক'.repeat(71)), 2)
})
