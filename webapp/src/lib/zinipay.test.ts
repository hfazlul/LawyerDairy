import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createZiniInvoice,
  extractInvoiceId,
  shouldActivateFromVerify,
  verifyZiniInvoice,
  webhookLooksPaid,
  zinipayConfigured,
  zinipayHeaderName,
} from './zinipay'

test('sandbox_test_ prefix is not live unless ZINIPAY_ALLOW_SANDBOX', () => {
  const prev = process.env.ZINIPAY_API_KEY
  const allow = process.env.ZINIPAY_ALLOW_SANDBOX
  process.env.ZINIPAY_API_KEY = 'sandbox_test_placeholder'
  delete process.env.ZINIPAY_ALLOW_SANDBOX
  assert.equal(zinipayConfigured(), false)
  process.env.ZINIPAY_ALLOW_SANDBOX = 'true'
  assert.equal(zinipayConfigured(), true)
  if (prev === undefined) delete process.env.ZINIPAY_API_KEY
  else process.env.ZINIPAY_API_KEY = prev
  if (allow === undefined) delete process.env.ZINIPAY_ALLOW_SANDBOX
  else process.env.ZINIPAY_ALLOW_SANDBOX = allow
})

test('production mode refuses a sandbox_test_ key', () => {
  const prev = process.env.ZINIPAY_API_KEY
  const mode = process.env.ZINIPAY_MODE
  const allow = process.env.ZINIPAY_ALLOW_SANDBOX
  process.env.ZINIPAY_API_KEY = 'sandbox_test_placeholder'
  process.env.ZINIPAY_MODE = 'production'
  process.env.ZINIPAY_ALLOW_SANDBOX = 'true'
  assert.equal(zinipayConfigured(), false)
  if (prev === undefined) delete process.env.ZINIPAY_API_KEY
  else process.env.ZINIPAY_API_KEY = prev
  if (mode === undefined) delete process.env.ZINIPAY_MODE
  else process.env.ZINIPAY_MODE = mode
  if (allow === undefined) delete process.env.ZINIPAY_ALLOW_SANDBOX
  else process.env.ZINIPAY_ALLOW_SANDBOX = allow
})

test('create rejects amount that is not greater than 0', async () => {
  const prev = process.env.ZINIPAY_API_KEY
  const mode = process.env.ZINIPAY_MODE
  process.env.ZINIPAY_API_KEY = 'test_live_style_key'
  delete process.env.ZINIPAY_MODE
  const zero = await createZiniInvoice({
    cusName: 'Test',
    amountBdt: 0,
    metadata: {},
    redirectUrl: 'http://localhost:3000/r',
    cancelUrl: 'http://localhost:3000/c',
    webhookUrl: 'http://localhost:3000/w',
  })
  assert.equal(zero.ok, false)
  if (!zero.ok) assert.match(zero.message, /greater than 0/)
  if (prev === undefined) delete process.env.ZINIPAY_API_KEY
  else process.env.ZINIPAY_API_KEY = prev
  if (mode === undefined) delete process.env.ZINIPAY_MODE
  else process.env.ZINIPAY_MODE = mode
})

test('header name follows ZINIPAY_API_KEY_HEADER', () => {
  const prev = process.env.ZINIPAY_API_KEY_HEADER
  delete process.env.ZINIPAY_API_KEY_HEADER
  assert.equal(zinipayHeaderName(), 'zini-api-key')
  process.env.ZINIPAY_API_KEY_HEADER = 'zinipay-api-key'
  assert.equal(zinipayHeaderName(), 'zinipay-api-key')
  if (prev === undefined) delete process.env.ZINIPAY_API_KEY_HEADER
  else process.env.ZINIPAY_API_KEY_HEADER = prev
})

test('webhook paid detection and invoice parse', () => {
  assert.equal(webhookLooksPaid({ status: 'true' }), true)
  assert.equal(webhookLooksPaid({ status: 'pending' }), false)
  assert.equal(extractInvoiceId({ invoice_id: 'A1' }), 'A1')
  assert.equal(extractInvoiceId({ val_id: 'VAL-9' }), 'VAL-9')
  assert.equal(extractInvoiceId({}, 'https://secure.zinipay.com/payment/INV99'), 'INV99')
})

test('fulfill only after verify COMPLETED — never from webhook status:true', async () => {
  const prevKey = process.env.ZINIPAY_API_KEY
  const prevAllow = process.env.ZINIPAY_ALLOW_SANDBOX
  process.env.ZINIPAY_API_KEY = 'test_live_style_key'
  delete process.env.ZINIPAY_ALLOW_SANDBOX

  assert.equal(
    shouldActivateFromVerify({
      ok: false,
      reason: 'unconfigured',
      message: 'ZINIPAY_API_KEY is not set.',
    }),
    false,
  )
  assert.equal(
    shouldActivateFromVerify({
      ok: true,
      status: 'PENDING',
      amount: 99,
      invoiceId: 'INV-1',
      transactionId: null,
      raw: {},
    }),
    false,
  )
  assert.equal(
    shouldActivateFromVerify({
      ok: true,
      status: 'FAILED',
      amount: 99,
      invoiceId: 'INV-1',
      transactionId: null,
      raw: {},
    }),
    false,
  )
  assert.equal(
    shouldActivateFromVerify({
      ok: true,
      status: 'COMPLETED',
      amount: 99,
      invoiceId: 'INV-1',
      transactionId: 'TXN-1',
      raw: {},
    }),
    true,
  )
  assert.equal(webhookLooksPaid({ status: 'true', invoice_id: 'INV-1' }), true)
  assert.equal(
    shouldActivateFromVerify({
      ok: true,
      status: 'TRUE',
      amount: null,
      invoiceId: 'INV-1',
      transactionId: null,
      raw: { status: 'true' },
    }),
    false,
  )

  const unconfiguredPrev = process.env.ZINIPAY_API_KEY
  delete process.env.ZINIPAY_API_KEY
  const skipped = await createZiniInvoice({
    cusName: 'Test',
    amountBdt: 49,
    metadata: {},
    redirectUrl: 'http://localhost:3000/r',
    cancelUrl: 'http://localhost:3000/c',
    webhookUrl: 'http://localhost:3000/w',
  })
  assert.equal(skipped.ok, false)
  if (!skipped.ok) assert.equal(skipped.reason, 'unconfigured')
  process.env.ZINIPAY_API_KEY = unconfiguredPrev

  if (prevKey === undefined) delete process.env.ZINIPAY_API_KEY
  else process.env.ZINIPAY_API_KEY = prevKey
  if (prevAllow === undefined) delete process.env.ZINIPAY_ALLOW_SANDBOX
  else process.env.ZINIPAY_ALLOW_SANDBOX = prevAllow
})

test('create rejects vendor status:false; verify sends zini-api-key', async () => {
  const prevKey = process.env.ZINIPAY_API_KEY
  process.env.ZINIPAY_API_KEY = 'test_live_style_key'
  const failed = await createZiniInvoice(
    {
      cusName: 'Test',
      amountBdt: 49,
      metadata: {},
      redirectUrl: 'http://localhost:3000/r',
      cancelUrl: 'http://localhost:3000/c',
      webhookUrl: 'http://localhost:3000/w',
    },
    async () =>
      new Response(JSON.stringify({ status: false, message: 'domain mismatch' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  )
  assert.equal(failed.ok, false)
  if (!failed.ok) {
    assert.equal(failed.reason, 'vendor')
    assert.match(failed.message, /domain mismatch/)
  }

  const verifyFetch: typeof fetch = async (input, init) => {
    assert.match(String(input), /\/v1\/payment\/verify$/)
    const headers = new Headers(init?.headers)
    assert.equal(headers.get('zini-api-key'), 'test_live_style_key')
    return new Response(JSON.stringify({ status: 'PENDING', invoice_id: 'INV-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const pending = await verifyZiniInvoice('INV-1', verifyFetch)
  assert.equal(pending.ok, true)
  if (pending.ok) {
    assert.equal(pending.status, 'PENDING')
    assert.equal(shouldActivateFromVerify(pending), false)
  }

  if (prevKey === undefined) delete process.env.ZINIPAY_API_KEY
  else process.env.ZINIPAY_API_KEY = prevKey
})

test('create + verify use mocked HTTP (no live charge)', async () => {
  const prevKey = process.env.ZINIPAY_API_KEY
  const prevAllow = process.env.ZINIPAY_ALLOW_SANDBOX
  process.env.ZINIPAY_API_KEY = 'test_live_style_key'
  delete process.env.ZINIPAY_ALLOW_SANDBOX

  const createFetch: typeof fetch = async (input, init) => {
    const url = String(input)
    assert.match(url, /\/v1\/payment\/create$/)
    const headers = new Headers(init?.headers)
    assert.equal(headers.get('zini-api-key'), 'test_live_style_key')
    const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>
    assert.equal(body.amount, 99)
    assert.ok(body.redirect_url)
    assert.ok(body.webhook_url)
    return new Response(JSON.stringify({ payment_url: 'https://pay.example/payment/INV-1', invoice_id: 'INV-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const created = await createZiniInvoice(
    {
      cusName: 'Test',
      cusEmail: 't@example.com',
      amountBdt: 99,
      metadata: { subscriptionId: 'sub1' },
      redirectUrl: 'http://localhost:3000/return',
      cancelUrl: 'http://localhost:3000/cancel',
      webhookUrl: 'http://localhost:3000/webhook',
    },
    createFetch,
  )
  assert.equal(created.ok, true)
  if (created.ok) {
    assert.equal(created.paymentUrl, 'https://pay.example/payment/INV-1')
    assert.equal(created.invoiceId, 'INV-1')
  }

  const verifyFetch: typeof fetch = async (input, init) => {
    assert.match(String(input), /\/v1\/payment\/verify$/)
    const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>
    assert.equal(body.invoice_id, 'INV-1')
    return new Response(JSON.stringify({ status: 'COMPLETED', invoice_id: 'INV-1', amount: 99 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const verified = await verifyZiniInvoice('INV-1', verifyFetch)
  assert.equal(verified.ok, true)
  if (verified.ok) assert.equal(verified.status, 'COMPLETED')

  const pendingFetch: typeof fetch = async () =>
    new Response(JSON.stringify({ status: 'PENDING', invoice_id: 'INV-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  const pending = await verifyZiniInvoice('INV-1', pendingFetch)
  assert.equal(pending.ok, true)
  if (pending.ok) assert.equal(pending.status, 'PENDING')

  if (prevKey === undefined) delete process.env.ZINIPAY_API_KEY
  else process.env.ZINIPAY_API_KEY = prevKey
  if (prevAllow === undefined) delete process.env.ZINIPAY_ALLOW_SANDBOX
  else process.env.ZINIPAY_ALLOW_SANDBOX = prevAllow
})
