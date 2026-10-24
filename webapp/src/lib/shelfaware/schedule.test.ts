import assert from 'node:assert/strict'
import test from 'node:test'
import { agentDue, dayDone, dayRuns, dhakaParts, parseAgentResult, redactJobTail } from './schedule'

test('agent starts at 09:00 Asia/Dhaka and only once that day', () => {
  const atNine = dhakaParts(new Date('2026-10-24T03:00:00.000Z'))
  const before = dhakaParts(new Date('2026-10-24T02:59:00.000Z'))
  assert.equal(atNine.ymd, '2026-10-24')
  assert.equal(atNine.hour, 9)
  assert.equal(before.hour, 8)
  assert.equal(agentDue(before.hour, false), false)
  assert.equal(agentDue(atNine.hour, false), true)
  assert.equal(agentDue(atNine.hour, true), false)
  assert.equal(dayDone('day=2026-10-24 done=1 runs=1', '2026-10-24'), true)
  assert.equal(dayDone('day=2026-10-23 done=1 runs=1', '2026-10-24'), false)
  assert.equal(dayDone('day=2026-10-24 runs=0', '2026-10-24'), false)
  assert.equal(dayRuns('day=2026-10-24 done=0 runs=2', '2026-10-24'), 2)
  assert.equal(dayRuns('day=2026-10-23 done=0 runs=2', '2026-10-24'), 0)
})

test('agent result parser reads one batch summary', () => {
  const tail = 'noise\n' + JSON.stringify({ code: 200, body: { processed: 2, resolved: 1 } })
  assert.deepEqual(parseAgentResult(tail), { http: 200, processed: 2, resolved: 1 })
  assert.equal(parseAgentResult('no json'), null)
})

test('job tail redacts credential-shaped text', () => {
  const raw = 'failed key=fixture-secret Bearer fixture-token'
  const out = redactJobTail(raw)
  assert.equal(out.includes('fixture-secret'), false)
  assert.equal(out.includes('fixture-token'), false)
  assert.match(out, /key=redacted/)
  assert.match(out, /Bearer redacted/)
})
