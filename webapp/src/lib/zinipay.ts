/**
 * ZiniPay hosted invoice adapter.
 * Public docs: https://api.zinipay.com
 *
 * Create: POST /v1/payment/create
 * Verify: POST /v1/payment/verify  { invoice_id }
 *
 * Header: zini-api-key (or zinipay-api-key when ZINIPAY_API_KEY_HEADER says so).
 * Always re-verify via /verify before fulfilling. Never invent COMPLETED.
 * The docs sample sandbox_test_8f4c9a2e7b31 is never live.
 * Other sandbox_test_ keys are not live unless ZINIPAY_ALLOW_SANDBOX=true,
 * and production mode refuses every sandbox_test_ key.
 * A real brand key is accepted in production. Aliases: ZINIPAY_API_KEY, ZINI_API_KEY, ZINIPAY_KEY, ZINIPAY_SECRET.
 */

import { zinipayApiKeyFromEnv } from './env-aliases'

/** Public documentation sample. Not a brand key. */
export const ZINIPAY_DOCS_SAMPLE_KEY = 'sandbox_test_8f4c9a2e7b31'

export type ZiniCreateInput = {
  cusName: string
  cusEmail?: string | null
  amountBdt: number
  metadata: Record<string, string>
  redirectUrl: string
  cancelUrl: string
  webhookUrl: string
}

export type ZiniCreateResult =
  | { ok: true; paymentUrl: string; invoiceId?: string; raw: Record<string, unknown> }
  | { ok: false; reason: 'unconfigured' | 'vendor'; message: string }

export type ZiniVerifyResult =
  | { ok: true; status: string; amount: number | null; invoiceId: string; transactionId: string | null; raw: Record<string, unknown> }
  | { ok: false; reason: 'unconfigured' | 'vendor'; message: string }

type FetchLike = typeof fetch

function zinipayFetch(): FetchLike {
  return globalThis.fetch.bind(globalThis)
}

function baseUrl(): string {
  return (process.env.ZINIPAY_BASE_URL || 'https://api.zinipay.com').replace(/\/$/, '')
}

export function zinipayApiKey(): string {
  return zinipayApiKeyFromEnv()
}

/** Preferred docs header is zini-api-key. */
export function zinipayHeaderName(): string {
  const raw = (process.env.ZINIPAY_API_KEY_HEADER || '').trim().toLowerCase()
  if (raw === 'zinipay-api-key') return 'zinipay-api-key'
  return 'zini-api-key'
}

/** production refuses documentation sandbox keys even if ZINIPAY_ALLOW_SANDBOX is set. */
export function zinipayMode(): 'production' | 'sandbox' {
  const raw = (process.env.ZINIPAY_MODE || '').trim().toLowerCase()
  if (raw === 'production' || raw === 'live') return 'production'
  return 'sandbox'
}

export function zinipayConfigured(): boolean {
  const key = zinipayApiKey()
  if (!key) return false
  if (key === ZINIPAY_DOCS_SAMPLE_KEY) return false
  const sample = /^sandbox_test_/i.test(key)
  if (sample && zinipayMode() === 'production') return false
  if (sample && process.env.ZINIPAY_ALLOW_SANDBOX !== 'true') return false
  return true
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    [zinipayHeaderName()]: zinipayApiKey(),
  }
}

/**
 * ZiniPay requires cus_email. Phone signup leaves User.email empty, and create
 * then returns 400 with no payment_url. A real address is kept. Otherwise a
 * stable address is built from the phone or id so the hosted page can open.
 */
export function checkoutCustomerEmail(user: {
  email?: string | null
  phone?: string | null
  id?: string | null
}): string {
  const email = (user.email || '').trim().toLowerCase()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return email
  const digits = (user.phone || '').replace(/\D/g, '')
  if (digits.length >= 10) return `${digits}@users.mamlaq.com`
  const id = (user.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 24)
  return `${id || 'member'}@users.mamlaq.com`
}

/**
 * Live create returns val_id plus payment_url, and those ids differ.
 * /verify accepts the id in the payment URL and returns 404 for val_id.
 */
export function extractInvoiceId(raw: Record<string, unknown>, paymentUrl?: string): string | undefined {
  const named = raw.invoice_id ?? raw.invoiceId
  if (typeof named === 'string' && named.length > 0) return named
  if (paymentUrl) {
    const m = paymentUrl.match(/\/payment\/([^/?#]+)/)
    if (m?.[1]) return m[1]
  }
  const fallback = raw.val_id ?? raw.valId ?? raw.id
  if (typeof fallback === 'string' && fallback.length > 0) return fallback
  return undefined
}

function vendorMessage(raw: Record<string, unknown>, fallback: string): string {
  const base = String(raw.message || fallback)
  const errors = raw.errors
  if (!Array.isArray(errors)) return base
  const detail = errors
    .slice(0, 3)
    .map((e) => {
      if (!e || typeof e !== 'object') return ''
      const row = e as { field?: unknown; message?: unknown }
      const field = typeof row.field === 'string' ? row.field.replace(/^body\./, '') : ''
      const message = typeof row.message === 'string' ? row.message : ''
      return [field, message].filter(Boolean).join(' ')
    })
    .filter(Boolean)
    .join('; ')
  return detail ? `${base} (${detail})` : base
}

/** Entitle only after /v1/payment/verify returns COMPLETED. Never invent COMPLETED from webhook status:true. */
export function shouldActivateFromVerify(
  verified: ZiniVerifyResult,
): boolean {
  return verified.ok && verified.status === 'COMPLETED'
}

export async function createZiniInvoice(
  input: ZiniCreateInput,
  fetchImpl: FetchLike = zinipayFetch(),
): Promise<ZiniCreateResult> {
  if (!zinipayConfigured()) {
    return { ok: false, reason: 'unconfigured', message: 'ZINIPAY_API_KEY is not set. Checkout is not live.' }
  }
  if (!(input.amountBdt > 0)) {
    return { ok: false, reason: 'vendor', message: 'amount must be greater than 0' }
  }
  try {
    const res = await fetchImpl(`${baseUrl()}/v1/payment/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: input.amountBdt,
        redirect_url: input.redirectUrl,
        cancel_url: input.cancelUrl,
        webhook_url: input.webhookUrl,
        cus_name: input.cusName,
        cus_email: input.cusEmail || undefined,
        metadata: input.metadata,
      }),
    })
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>
    const paymentUrl = typeof raw.payment_url === 'string' ? raw.payment_url : ''
    if (!res.ok || raw.status === false || !paymentUrl) {
      return {
        ok: false,
        reason: 'vendor',
        message: vendorMessage(raw, `ZiniPay create failed (${res.status})`),
      }
    }
    return { ok: true, paymentUrl, invoiceId: extractInvoiceId(raw, paymentUrl), raw }
  } catch (e) {
    return { ok: false, reason: 'vendor', message: String(e) }
  }
}

export async function verifyZiniInvoice(
  invoiceId: string,
  fetchImpl: FetchLike = zinipayFetch(),
): Promise<ZiniVerifyResult> {
  if (!zinipayConfigured()) {
    return { ok: false, reason: 'unconfigured', message: 'ZINIPAY_API_KEY is not set.' }
  }
  try {
    const res = await fetchImpl(`${baseUrl()}/v1/payment/verify`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ invoice_id: invoiceId }),
    })
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) {
      return { ok: false, reason: 'vendor', message: String(raw.message || `verify ${res.status}`) }
    }
    const status = String(raw.status || '').toUpperCase()
    const amountRaw = raw.amount
    const amount = typeof amountRaw === 'number' ? amountRaw : amountRaw != null ? Number(amountRaw) : null
    return {
      ok: true,
      status,
      amount: Number.isFinite(amount) ? amount : null,
      invoiceId: String(raw.invoice_id || invoiceId),
      transactionId: typeof raw.transaction_id === 'string' ? raw.transaction_id : null,
      raw,
    }
  } catch (e) {
    return { ok: false, reason: 'vendor', message: String(e) }
  }
}

/** Webhook payload hint only — never fulfill from this alone. */
export function webhookLooksPaid(body: Record<string, unknown>): boolean {
  const status = String(body.status ?? '').toLowerCase()
  return status === 'true' || status === 'completed' || status === 'paid' || status === 'success'
}
