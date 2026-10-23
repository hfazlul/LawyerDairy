import assert from 'node:assert/strict'
import test from 'node:test'
import { otpRequestMessage } from './auth/password-otp'
import {
  bulkSms24Configured,
  parseBulk24SingleResponse,
  sendBulkSms24,
  sendBulkSms24Single,
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
  'SMS_CUSTOMER_ID',
]

test('password OTP text matches the provider-whitelisted format', () => {
  const text = otpRequestMessage('000000')
  assert.equal(text, 'MAMLAQ-Lawyer Dairy\nYour forgot password 6 digit OTP is 000000\nmamlaq.com')
  assert.equal(text.split('\n').length, 3)
  assert.equal(text.includes('http'), false)
  assert.equal(text.includes(':'), false)
  assert.match(text, /^[\x20-\x7E\n]+$/)
  assert.ok(text.length <= 160)
})

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

test('SMS_MODE=production does not fall back when 24bulksms status is ok', async () => {
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
    return new Response(JSON.stringify({ status: 'ok', sms_id: 'abc123' }), { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({ phone: '01712345678', message: 'hi', kind: 'otp' })
    assert.equal(r.ok, true)
    assert.equal(r.provider, '24bulksmsbd')
    assert.equal(calls.length, 1)
    assert.equal(calls[0], 'https://www.24bulksmsbd.com/api/DynamicSMSApi')
  } finally {
    globalThis.fetch = orig
    restore(prev)
  }
})

test('SMS_MODE=production falls back to sms.net.bd once when 24bulksms does not accept', async () => {
  const prev = stash(SMS_ENV)
  process.env.SMS_MODE = 'production'
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  process.env.SMS_SENDER_ID = 'LawyerDiary'
  delete process.env.SMS_API_URL
  delete process.env.SMS_API_KEY
  const calls: { url: string; body: string }[] = []
  const orig = globalThis.fetch
  const origLog = console.log
  const origErr = console.error
  console.log = () => {}
  console.error = () => {}
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const body = String(init?.body || '')
    calls.push({ url, body })
    if (url.includes('sms.net.bd')) {
      return new Response(JSON.stringify({ error: 0, msg: 'Submitted', data: { request_id: 99 } }), {
        status: 200,
      })
    }
    return new Response(JSON.stringify({ status: 'failed', sms_id: 'abc123' }), { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({
      phone: '01712345678',
      message: 'MAMLAQ-Lawyer Dairy',
      kind: 'password_otp',
    })
    assert.equal(r.ok, true)
    assert.equal(r.provider, 'sms.net.bd')
    assert.equal(calls.length, 2)
    assert.equal(calls[0].url, 'https://www.24bulksmsbd.com/api/DynamicSMSApi')
    assert.match(calls[1].url, /api\.sms\.net\.bd/)
    const params = new URLSearchParams(calls[1].body)
    assert.equal(params.get('api_key'), 'net-key')
    assert.equal(params.get('to'), '01712345678')
    assert.equal(params.get('msg'), 'MAMLAQ-Lawyer Dairy')
    assert.equal(params.get('sender_id'), null)
    assert.equal(params.get('content_id'), null)
    assert.equal([...params.keys()].sort().join(','), 'api_key,msg,to')
  } finally {
    globalThis.fetch = orig
    console.log = origLog
    console.error = origErr
    restore(prev)
  }
})

test('SMS_MODE=production calls sms.net.bd once when 24bulksms returns a non-ok HTTP status', async () => {
  const prev = stash(SMS_ENV)
  process.env.SMS_MODE = 'production'
  process.env.SMS_NETBD_API_KEY = 'netbd-alias-key'
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  delete process.env.SMS_NET_BD_API_KEY
  const calls: string[] = []
  const orig = globalThis.fetch
  const origErr = console.error
  console.error = () => {}
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push(url)
    if (url.includes('sms.net.bd')) {
      assert.match(String(init?.body || ''), /api_key=netbd-alias-key/)
      assert.equal(String(init?.body || '').includes('sender_id'), false)
      return new Response(JSON.stringify({ error: 0 }), { status: 200 })
    }
    return new Response('unavailable', { status: 503 })
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({ phone: '01712345678', message: 'hi', kind: 'password_otp' })
    assert.equal(r.ok, true)
    assert.equal(r.provider, 'sms.net.bd')
    assert.equal(calls.length, 2)
    assert.equal(calls.filter((url) => url.includes('sms.net.bd')).length, 1)
  } finally {
    globalThis.fetch = orig
    console.error = origErr
    restore(prev)
  }
})

test('SMS_MODE=production does not retry sms.net.bd when the fallback is rejected', async () => {
  const prev = stash(SMS_ENV)
  process.env.SMS_MODE = 'production'
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  const calls: string[] = []
  const orig = globalThis.fetch
  const origErr = console.error
  console.error = () => {}
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    calls.push(url)
    if (url.includes('sms.net.bd')) {
      return new Response(JSON.stringify({ error: 421, msg: 'registered only' }), { status: 200 })
    }
    return new Response(JSON.stringify({ status: 'error' }), { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({ phone: '01712345678', message: 'hi', kind: 'password_otp' })
    assert.equal(r.ok, false)
    assert.equal(r.provider, 'sms.net.bd')
    assert.equal(calls.length, 2)
    assert.equal(calls.filter((url) => url.includes('sms.net.bd')).length, 1)
    assert.equal((r.error || '').includes('net-key'), false)
  } finally {
    globalThis.fetch = orig
    console.error = origErr
    restore(prev)
  }
})

test('sms.net.bd primary then 24bulksmsbd failover (mocked HTTP)', async () => {
  const prev = stash(SMS_ENV)
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  process.env.SMS_NET_BD_URL = 'https://api.sms.net.bd/sendsms'
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  process.env.BULKSMS24_URL = 'https://www.24bulksmsbd.com/api/smsSendApi'
  delete process.env.SMS_MODE
  delete process.env.SMS_CUSTOMER_ID
  process.env.SMS_SENDER_ID = 'LawyerDiary'
  delete process.env.SMS_API_URL
  delete process.env.SMS_API_KEY

  const calls: { url: string; body: string; contentType: string }[] = []
  const orig = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const body = String(init?.body || '')
    const contentType = new Headers(init?.headers).get('content-type') || ''
    calls.push({ url, body, contentType })
    if (url.includes('sms.net.bd')) {
      return new Response(JSON.stringify({ error: 1, msg: 'fail' }), { status: 200 })
    }
    return new Response(JSON.stringify({ status: 'ok', sms_id: 'abc123' }), { status: 200 })
  }) as typeof fetch

  try {
    const r = await sendSmsHybrid({ phone: '01712345678', message: 'নমস্কার', kind: 'otp' })
    assert.equal(r.ok, true)
    assert.equal(r.provider, '24bulksmsbd')
    assert.equal(calls.length, 2)
    assert.match(calls[0].url, /sms\.net\.bd/)
    assert.match(calls[0].body, /api_key=net-key/)
    const netParams = new URLSearchParams(calls[0].body)
    assert.equal(netParams.get('sender_id'), null)
    assert.equal(netParams.get('content_id'), null)
    assert.equal(calls[1].url, 'https://www.24bulksmsbd.com/api/DynamicSMSApi')
    assert.equal(calls[1].contentType, 'application/json')
    const sent = JSON.parse(calls[1].body) as {
      customer_id: number
      api_key: string
      messages: { to: string; message: string }[]
      senderid?: string
      sender_id?: string
    }
    assert.equal(sent.customer_id, 1684)
    assert.equal(typeof sent.customer_id, 'number')
    assert.equal(sent.api_key, 'bulk-key')
    assert.deepEqual(sent.messages, [{ to: '8801712345678', message: 'নমস্কার' }])
    assert.equal(sent.senderid, undefined)
    assert.equal(sent.sender_id, undefined)
  } finally {
    globalThis.fetch = orig
    restore(prev)
  }
})

test('sms.net.bd success does not call failover', async () => {
  const prev = stash(SMS_ENV)
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  delete process.env.SMS_MODE
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

test('24bulksmsbd failure is not treated as sent and does not echo the key', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.BULKSMS24_API_KEY = 'bulk-key-secret'
  process.env.SMS_MODE = 'production'
  const orig = globalThis.fetch
  const origErr = console.error
  const lines: string[] = []
  console.error = ((...args: unknown[]) => {
    lines.push(args.map((a) => String(a)).join(' '))
  }) as typeof console.error
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ success: false, error: 'invalid number' }), { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({ phone: '01712345678', message: 'hi', kind: 'otp' })
    assert.equal(r.ok, false)
    assert.equal(r.provider, '24bulksmsbd')
    assert.equal((r.error || '').includes('bulk-key-secret'), false)
    assert.equal(lines.some((line) => line.includes('bulk-key-secret')), false)
    assert.equal(lines.some((line) => line.includes('invalid number')), false)
  } finally {
    globalThis.fetch = orig
    console.error = origErr
    restore(prev)
  }
})

test('24bulksmsbd-only send when primary missing', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.BULKSMS24_API_KEY = 'bulk-key'
  const orig = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), 'https://www.24bulksmsbd.com/api/DynamicSMSApi')
    assert.equal(new Headers(init?.headers).get('content-type'), 'application/json')
    const sent = JSON.parse(String(init?.body || '')) as {
      customer_id: number
      api_key: string
      messages: { to: string; message: string }[]
      senderid?: string
      sender_id?: string
    }
    assert.equal(sent.customer_id, 1684)
    assert.equal(typeof sent.customer_id, 'number')
    assert.equal(sent.api_key, 'bulk-key')
    assert.deepEqual(sent.messages, [{ to: '8801712345678', message: 'hi' }])
    assert.equal(sent.senderid, undefined)
    assert.equal(sent.sender_id, undefined)
    return new Response(JSON.stringify({ status: 'ok', sms_id: 'abc123' }), { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendBulkSms24('01712345678', 'hi')
    assert.equal(r.ok, true)
  } finally {
    globalThis.fetch = orig
    restore(prev)
  }
})

test('24bulksmsbd countdown starts only when status is ok', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.BULKSMS24_API_KEY = 'bulk-key-secret'
  const cases: { http: number; body: string; ok: boolean }[] = [
    { http: 200, body: JSON.stringify({ status: 'ok', sms_id: 'abc123' }), ok: true },
    { http: 200, body: JSON.stringify({ status: 'OK' }), ok: true },
    { http: 200, body: 'SUCCESS', ok: false },
    { http: 200, body: JSON.stringify({ response_code: 202 }), ok: false },
    { http: 200, body: JSON.stringify({ status: 'failed', sms_id: 'abc123' }), ok: false },
    { http: 200, body: JSON.stringify({ status: 'error' }), ok: false },
    { http: 200, body: JSON.stringify({ status: 1003 }), ok: false },
    { http: 200, body: JSON.stringify({ status: '1003' }), ok: false },
    { http: 200, body: JSON.stringify({ status: 1002 }), ok: false },
    { http: 200, body: JSON.stringify({ status: 1001 }), ok: false },
    { http: 200, body: '', ok: false },
    { http: 500, body: JSON.stringify({ status: 'ok', sms_id: 'abc123' }), ok: false },
  ]
  const orig = globalThis.fetch
  const origLog = console.log
  const origErr = console.error
  const lines: string[] = []
  const push = (...args: unknown[]) => {
    lines.push(args.map((a) => String(a)).join(' '))
  }
  console.log = ((...args: unknown[]) => push(...args)) as typeof console.log
  console.error = ((...args: unknown[]) => push(...args)) as typeof console.error
  try {
    for (const c of cases) {
      globalThis.fetch = (async () => new Response(c.body, { status: c.http })) as typeof fetch
      const r = await sendBulkSms24('01712345678', 'marker-text')
      assert.equal(r.ok, c.ok, c.body || `http ${c.http}`)
    }
    assert.ok(lines.includes('[sms] 24bulksmsbd accept http=200 status=ok sms_id=abc123'))
    assert.ok(lines.includes('[sms] 24bulksmsbd reject http=200 status=failed sms_id=abc123'))
    assert.ok(lines.includes('[sms] 24bulksmsbd reject http=200 status=1003'))
    for (const line of lines) {
      assert.equal(line.includes('bulk-key-secret'), false)
      assert.equal(line.includes('marker-text'), false)
      assert.equal(line.includes('01712345678'), false)
      assert.equal(line.includes('8801712345678'), false)
    }
  } finally {
    globalThis.fetch = orig
    console.log = origLog
    console.error = origErr
    restore(prev)
  }
})

type Captured = { url: string; body: string; contentType: string }

function captureLogs(): { lines: string[]; restore: () => void } {
  const origLog = console.log
  const origErr = console.error
  const lines: string[] = []
  const push = (...args: unknown[]) => {
    lines.push(args.map((a) => String(a)).join(' '))
  }
  console.log = ((...args: unknown[]) => push(...args)) as typeof console.log
  console.error = ((...args: unknown[]) => push(...args)) as typeof console.error
  return {
    lines,
    restore: () => {
      console.log = origLog
      console.error = origErr
    },
  }
}

function assertSafeLines(lines: string[], otp: string) {
  for (const line of lines) {
    assert.equal(line.includes('bulk-key-secret'), false, line)
    assert.equal(line.includes('1712345678'), false, line)
    assert.equal(line.includes(otp), false, line)
  }
}

test('password OTP in production posts smsSendApi form fields and does not fall back when ok', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.SMS_MODE = 'production'
  process.env.BULKSMS24_API_KEY = 'bulk-key-secret'
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  process.env.SMS_SENDER_ID = 'LawyerDiary'
  const otp = '482913'
  const message = otpRequestMessage(otp)
  const calls: Captured[] = []
  const orig = globalThis.fetch
  const logs = captureLogs()
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      body: String(init?.body || ''),
      contentType: new Headers(init?.headers).get('content-type') || '',
    })
    return new Response(
      JSON.stringify({ status: 'ok', message: 'Successfully Sent SMS', sms_id: 'abc123' }),
      { status: 200 },
    )
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({
      phone: '+8801712345678',
      message,
      kind: 'password_otp',
      otp: true,
    })
    assert.equal(r.ok, true)
    assert.equal(r.provider, '24bulksmsbd')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'https://www.24bulksmsbd.com/api/smsSendApi')
    assert.equal(calls[0].contentType, 'application/x-www-form-urlencoded')
    const params = new URLSearchParams(calls[0].body)
    assert.equal([...params.keys()].sort().join(','), 'api_key,customer_id,message,mobile_no')
    assert.equal(params.get('customer_id'), '1684')
    assert.equal(params.get('api_key'), 'bulk-key-secret')
    assert.equal(params.get('mobile_no'), '01712345678')
    assert.equal(params.get('message'), 'MAMLAQ-Lawyer Dairy\nYour forgot password 6 digit OTP is 482913\nmamlaq.com')
    assert.equal(params.get('sender_id'), null)
    assert.equal(params.get('senderid'), null)
    assert.equal(calls.some((c) => c.url.includes('DynamicSMSApi')), false)
    assert.equal(logs.lines.length, 1)
    assert.match(
      logs.lines[0],
      /^\[sms\] 24bulksms smsSendApi http=200 status=ok id=abc123 body=\{"status":"ok","message":"Successfully Sent SMS","sms_id":"abc123"\}$/,
    )
    assertSafeLines(logs.lines, otp)
  } finally {
    globalThis.fetch = orig
    logs.restore()
    restore(prev)
  }
})

test('smsSendApi success parsing', () => {
  const cases: { http: number; body: string; accepted: boolean; status?: string; id?: string }[] = [
    {
      http: 200,
      body: JSON.stringify({ status: 'ok', message: 'Successfully Sent SMS', sms_id: 'abc123' }),
      accepted: true,
      status: 'ok',
      id: 'abc123',
    },
    { http: 200, body: JSON.stringify({ status: 'success' }), accepted: true, status: 'success' },
    { http: 200, body: JSON.stringify({ status: 'OK' }), accepted: true, status: 'OK' },
    { http: 200, body: JSON.stringify({ success: true }), accepted: true },
    { http: 200, body: JSON.stringify({ sms_id: 98765 }), accepted: true, id: '98765' },
    { http: 200, body: JSON.stringify({ data: { request_id: 'r-1' } }), accepted: true, id: 'r-1' },
    { http: 200, body: JSON.stringify({ status: 'ok', error: 0 }), accepted: true },
    { http: 200, body: JSON.stringify({ status: 'failed', sms_id: 'abc123' }), accepted: false },
    { http: 200, body: JSON.stringify({ status: 'error' }), accepted: false },
    { http: 200, body: JSON.stringify({ status: '1003' }), accepted: false },
    { http: 200, body: JSON.stringify({ success: false, sms_id: 'x1' }), accepted: false },
    { http: 200, body: JSON.stringify({ error: 'Invalid API key' }), accepted: false },
    { http: 200, body: JSON.stringify({ sms_id: 'x1', message: 'Insufficient balance' }), accepted: false },
    { http: 200, body: JSON.stringify({ status: 'pending_review' }), accepted: false },
    { http: 200, body: JSON.stringify({ message: 'Received' }), accepted: false },
    { http: 200, body: '', accepted: false },
    { http: 200, body: 'SUCCESS', accepted: false },
    { http: 200, body: '[]', accepted: false },
    { http: 500, body: JSON.stringify({ status: 'ok', sms_id: 'abc123' }), accepted: false },
  ]
  for (const c of cases) {
    const parsed = parseBulk24SingleResponse(c.http, c.body)
    assert.equal(parsed.accepted, c.accepted, `${c.http} ${c.body}`)
    if (c.status !== undefined) assert.equal(parsed.status, c.status)
    if (c.id !== undefined) assert.equal(parsed.id, c.id)
  }
})

test('smsSendApi whitelist error is a failure, is logged safely, and falls back once', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.SMS_MODE = 'production'
  process.env.BULKSMS24_API_KEY = 'bulk-key-secret'
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  const otp = '705218'
  const calls: string[] = []
  const orig = globalThis.fetch
  const logs = captureLogs()
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    calls.push(url)
    if (url.includes('sms.net.bd')) {
      return new Response(JSON.stringify({ error: 0, data: { request_id: 7 } }), { status: 200 })
    }
    return new Response(
      JSON.stringify({
        status: 'error',
        message: `OTP content not whitelisted for 01712345678: ${otp} api_key=bulk-key-secret`,
      }),
      { status: 200 },
    )
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({
      phone: '01712345678',
      message: otpRequestMessage(otp),
      kind: 'password_otp',
      otp: true,
    })
    assert.equal(r.ok, true)
    assert.equal(r.provider, 'sms.net.bd')
    assert.equal(calls.length, 2)
    assert.equal(calls[0], 'https://www.24bulksmsbd.com/api/smsSendApi')
    assert.match(calls[1], /api\.sms\.net\.bd/)
    const line = logs.lines.find((l) => l.startsWith('[sms] 24bulksms smsSendApi'))
    assert.ok(line)
    assert.match(line, /^\[sms\] 24bulksms smsSendApi http=200 status=error id=- body=/)
    assert.match(line, /whitelisted/)
    assert.match(line, /\[phone\]/)
    assert.match(line, /\[code\]/)
    assert.match(line, /\[key\]/)
    assertSafeLines(logs.lines, otp)
  } finally {
    globalThis.fetch = orig
    logs.restore()
    restore(prev)
  }

  const plain = parseBulk24SingleResponse(
    200,
    JSON.stringify({ message: 'Please whitelist this OTP template first' }),
  )
  assert.equal(plain.accepted, false)
})

test('smsSendApi empty body is a failure and is logged', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.SMS_MODE = 'production'
  process.env.BULKSMS24_API_KEY = 'bulk-key-secret'
  const orig = globalThis.fetch
  const logs = captureLogs()
  let hits = 0
  globalThis.fetch = (async () => {
    hits++
    return new Response('', { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({
      phone: '01712345678',
      message: otpRequestMessage('111222'),
      kind: 'password_otp',
      otp: true,
    })
    assert.equal(r.ok, false)
    assert.equal(r.provider, '24bulksmsbd')
    assert.equal(hits, 1)
    assert.ok(logs.lines.includes('[sms] 24bulksms smsSendApi http=200 status=- id=- body='))
    assertSafeLines(logs.lines, '111222')
  } finally {
    globalThis.fetch = orig
    logs.restore()
    restore(prev)
  }
})

test('smsSendApi id-only response counts as accepted and never calls sms.net.bd', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.SMS_MODE = 'production'
  process.env.BULKSMS24_API_KEY = 'bulk-key-secret'
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  const calls: string[] = []
  const orig = globalThis.fetch
  const logs = captureLogs()
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input))
    return new Response(JSON.stringify({ sms_id: 'id-777' }), { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({
      phone: '01712345678',
      message: otpRequestMessage('333444'),
      kind: 'password_otp',
      otp: true,
    })
    assert.equal(r.ok, true)
    assert.equal(r.provider, '24bulksmsbd')
    assert.deepEqual(calls, ['https://www.24bulksmsbd.com/api/smsSendApi'])
  } finally {
    globalThis.fetch = orig
    logs.restore()
    restore(prev)
  }
})

test('password OTP never uses DynamicSMSApi on the failover path either', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.SMS_NET_BD_API_KEY = 'net-key'
  process.env.BULKSMS24_API_KEY = 'bulk-key-secret'
  const calls: string[] = []
  const orig = globalThis.fetch
  const logs = captureLogs()
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    calls.push(url)
    if (url.includes('sms.net.bd')) {
      return new Response(JSON.stringify({ error: 1, msg: 'fail' }), { status: 200 })
    }
    return new Response(JSON.stringify({ status: 'ok', sms_id: 'abc123' }), { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendSmsHybrid({
      phone: '01712345678',
      message: otpRequestMessage('555666'),
      kind: 'password_otp',
      otp: true,
    })
    assert.equal(r.ok, true)
    assert.equal(r.provider, '24bulksmsbd')
    assert.equal(calls.length, 2)
    assert.equal(calls[1], 'https://www.24bulksmsbd.com/api/smsSendApi')
    assert.equal(calls.some((url) => url.includes('DynamicSMSApi')), false)
  } finally {
    globalThis.fetch = orig
    logs.restore()
    restore(prev)
  }
})

test('smsSendApi rejects a non-BD number before any HTTP call', async () => {
  const prev = stash(SMS_ENV)
  for (const n of SMS_ENV) delete process.env[n]
  process.env.BULKSMS24_API_KEY = 'bulk-key-secret'
  const orig = globalThis.fetch
  let hits = 0
  globalThis.fetch = (async () => {
    hits++
    return new Response('{}', { status: 200 })
  }) as typeof fetch
  try {
    const r = await sendBulkSms24Single('01212345678', 'x')
    assert.equal(r.ok, false)
    assert.equal(r.error, 'invalid_phone')
    assert.equal(hits, 0)
  } finally {
    globalThis.fetch = orig
    restore(prev)
  }
})
