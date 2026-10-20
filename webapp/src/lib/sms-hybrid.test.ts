import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bulkSms24Configured,
  sendBulkSms24,
  sendSmsHybrid,
  sendSmsNetBd,
  sendWhatsappOrSkip,
  smsHybridConfigured,
  smsNetBdConfigured,
} from './sms-hybrid'

function stash(names: string[]): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const n of names) out[n] = process.env[n]
  return out
}

function restore(prev: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(prev)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
}

const SMS_ENV = [
  'SMS_API_URL',
  'SMS_API_KEY',
  'SMS_NET_BD_API_KEY',
  'SMS_NETBD_API_KEY',
  'SMS_NET_BD_URL',
  'BULKSMS24_API_KEY',
  'BULKSMS24_URL',
  'SMS_FAILOVER_URL',
  'SMS_FAILOVER_KEY',
  'SMS_SENDER_ID',
  'SMS_MODE',
]

test('hybrid is unconfigured without keys; WhatsApp auto always skipped', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  assert.equal(smsNetBdConfigured(), false)
  assert.equal(bulkSms24Configured(), false)
  assert.equal(smsHybridConfigured(), false)
  const skip = await sendSmsHybrid({ phone: '01712345678', message: 'hi', kind: 'test' })
  assert.equal(skip.ok, false)
  assert.equal(skip.skipped, 'sms_unconfigured')
  const wa = await sendWhatsappOrSkip({
    phone: '01712345678',
    template: 'x',
    kind: 'weekly_digest',
  })
  assert.equal(wa.ok, false)
  assert.equal(wa.skipped, 'whatsapp_auto_removed')
  restore(prev)
})

test('SMS_MODE=production uses only the non-masking account', async () => {
  const prev = stash(SMS_ENV)
  process.env.SMS_MODE = 'production'
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  process.env.SMS_API_KEY = 'your-sms-api-key'
  process.env.SMS_API_URL = 'https://api.sms.net.bd/sendsms'
  const calls: string[] = []
  const orig = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input))
    return new Response(JSON.stringify({ response_code: 202 }), { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({ phone: '01712345678', message: 'hi', kind: 'otp' })
    assert.equal(r.ok, true)
    assert.equal(r.provider, '24bulksmsbd')
    assert.equal(calls.length, 1)
    assert.match(calls[0], /24bulksmsbd/)
  } finally {
    globalThis.fetch = orig
    restore(prev)
  }
})

test('sms.net.bd primary then 24bulksmsbd failover (mocked HTTP)', async () => {
  const prev = stash(SMS_ENV)
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  process.env.SMS_NET_BD_URL = 'https://api.sms.net.bd/sendsms'
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  process.env.BULKSMS24_URL = 'https://www.24bulksmsbd.com/api/smsSendApi'
  process.env.SMS_SENDER_ID = 'LawyerDiary'
  delete process.env.SMS_API_URL
  delete process.env.SMS_API_KEY

  const calls: { url: string; body: string }[] = []
  const orig = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const body = String(init?.body || '')
    calls.push({ url, body })
    if (url.includes('sms.net.bd')) {
      return new Response(JSON.stringify({ error: 1, msg: 'fail' }), { status: 200 })
    }
    return new Response(JSON.stringify({ response_code: 202 }), { status: 200 })
  }) as typeof fetch

  try {
    const r = await sendSmsHybrid({ phone: '01712345678', message: 'নমস্কার', kind: 'otp' })
    assert.equal(r.ok, true)
    assert.equal(r.provider, '24bulksmsbd')
    assert.equal(calls.length, 2)
    assert.match(calls[0].url, /sms\.net\.bd/)
    assert.match(calls[0].body, /api_key=net-key/)
    assert.match(calls[1].url, /24bulksmsbd/)
    assert.match(calls[1].body, /api_key=bulk-key/)
  } finally {
    globalThis.fetch = orig
    restore(prev)
  }
})

test('sms.net.bd success does not call failover', async () => {
  const prev = stash(SMS_ENV)
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  let bulkHits = 0
  const orig = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('24bulksmsbd') || url.includes('smsapi')) bulkHits++
    return new Response(JSON.stringify({ error: 0, data: { request_id: 1 } }), { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendSmsNetBd('01712345678', 'hi')
    assert.equal(r.ok, true)
    const hybrid = await sendSmsHybrid({ phone: '01712345678', message: 'hi', kind: 'd1' })
    assert.equal(hybrid.ok, true)
    assert.equal(hybrid.provider, 'sms.net.bd')
    assert.equal(bulkHits, 0)
  } finally {
    globalThis.fetch = orig
    restore(prev)
  }
})

test('SMS_API_URL used as key alias still hits sms.net.bd', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.SMS_API_URL = 'smsnet-comment-style-key-16x'
  const orig = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.match(String(input), /sms\.net\.bd/)
    assert.match(String(init?.body || ''), /api_key=smsnet-comment-style-key-16x/)
    return new Response(JSON.stringify({ error: 0 }), { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendSmsNetBd('01712345678', 'hi')
    assert.equal(r.ok, true)
  } finally {
    globalThis.fetch = orig
    restore(prev)
  }
})

test('24bulksmsbd-only send when primary missing', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  const orig = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.match(String(input), /24bulksmsbd/)
    assert.match(String(init?.body || ''), /number=8801712345678/)
    return new Response('SUCCESS', { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendBulkSms24('01712345678', 'hi')
    assert.equal(r.ok, true)
  } finally {
    globalThis.fetch = orig
    restore(prev)
  }
})
