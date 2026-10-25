import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { codePointLength } from './hearing-sms'
import {
  hearingAutoWindowOpen,
  hearingClientMessage,
  hearingOffsets,
  hearingWhitelistProbeMessage,
} from './hearing-auto'
import { sendBulkSms24Messages } from './sms-hybrid'

const here = dirname(fileURLToPath(import.meta.url))

test('hearing day chips and the 10:00 Dhaka window', () => {
  assert.deepEqual(hearingOffsets({ smsD1: true, smsD2: false, smsD3: false }), [1])
  assert.deepEqual(hearingOffsets({ smsD1: true, smsD2: true, smsD3: true }), [1, 2, 3])
  assert.deepEqual(hearingOffsets({ smsD1: false, smsD2: false, smsD3: false }), [])
  assert.equal(hearingAutoWindowOpen(new Date('2026-10-25T03:59:00.000Z')), false)
  assert.equal(hearingAutoWindowOpen(new Date('2026-10-25T04:00:00.000Z')), true)
  assert.equal(hearingAutoWindowOpen(new Date('2026-10-25T14:59:00.000Z')), true)
  assert.equal(hearingAutoWindowOpen(new Date('2026-10-25T15:00:00.000Z')), false)
})

test('whitelist probe uses the hearing sentence and is not a real case', () => {
  const text = hearingWhitelistProbeMessage()
  assert.equal(text, 'জনাব হোয়াইটলিস্ট, কেসের শুনানি ২৫ অক্টো, টেস্ট আদালত। উকিল টেস্ট।')
  assert.ok(codePointLength(text) <= 70)
  assert.match(text, /হোয়াইটলিস্ট/)
  assert.match(text, /টেস্ট আদালত/)
  assert.equal(
    hearingClientMessage({ client: 'করিম', ymd: '2026-10-25', court: 'ঢাকা', lawyer: 'রহিম' }),
    'জনাব করিম, কেসের শুনানি ২৫ অক্টো, ঢাকা আদালত। উকিল রহিম।',
  )
})

test('automatic hearing cron posts DynamicSMSApi and does not use the single SMS endpoint', () => {
  const route = readFileSync(join(here, '../../app/api/mobile/v1/cron/sms-hearings/route.ts'), 'utf8')
  const dispatch = readFileSync(join(here, 'hearing-dispatch.ts'), 'utf8')
  assert.match(route, /dispatchAutomaticHearings/)
  assert.match(route, /bulkSms24Configured/)
  assert.equal(route.includes('bulk_sms_page'), false)
  assert.match(dispatch, /sendBulkSms24Messages/)
  assert.equal(dispatch.includes('smsSendApi'), false)
  assert.equal(dispatch.includes('sms.net.bd'), false)
  assert.match(dispatch, /autoMessaging:\s*true/)
})

test('dynamic bulk posts one messages array and does not echo the key', async () => {
  const prevKey = process.env.BULKSMS24_API_KEY
  const prevUrl = process.env.BULKSMS24_URL
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  process.env.BULKSMS24_URL = 'https://www.24bulksmsbd.com/api/smsSendApi'
  const calls: { url: string; body: string }[] = []
  const original = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), body: String(init?.body || '') })
    return new Response(JSON.stringify({ status: 'ok', sms_id: 'abc123' }), { status: 200 })
  }) as typeof fetch
  const logs: string[] = []
  const log = console.log
  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(' '))
  }
  try {
    const result = await sendBulkSms24Messages([
      { to: '01531390692', message: hearingWhitelistProbeMessage() },
      { to: '+8801531390692', message: hearingWhitelistProbeMessage() },
    ])
    assert.equal(result.ok, true)
    assert.equal(result.count, 2)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'https://www.24bulksmsbd.com/api/DynamicSMSApi')
    const sent = JSON.parse(calls[0].body) as {
      customer_id: number
      api_key: string
      messages: { to: string; message: string }[]
    }
    assert.equal(sent.customer_id, 1684)
    assert.equal(sent.messages.length, 2)
    assert.equal(sent.messages[0].to, '8801531390692')
    assert.equal(sent.messages[0].message, hearingWhitelistProbeMessage())
    assert.equal(logs.some((line) => line.includes('bulk-key')), false)
    assert.equal(sent.api_key, 'bulk-key')
  } finally {
    globalThis.fetch = original
    console.log = log
    if (prevKey === undefined) delete process.env.BULKSMS24_API_KEY
    else process.env.BULKSMS24_API_KEY = prevKey
    if (prevUrl === undefined) delete process.env.BULKSMS24_URL
    else process.env.BULKSMS24_URL = prevUrl
  }
})
