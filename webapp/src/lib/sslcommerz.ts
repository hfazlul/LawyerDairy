/**
 * SSLCommerz session + IPN validation (Easy Checkout v4).
 * Env: SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASS, SSLCOMMERZ_IS_LIVE, NEXT_PUBLIC_APP_URL
 * Leftover adapter — website checkout is ZiniPay.
 */

import { appBaseUrl } from './app-url'

export { appBaseUrl }

export type SslInitInput = {
  tranId: string
  amountBdt: number
  productName: string
  customer: {
    name: string
    email?: string | null
    phone: string
  }
}

export type SslInitResult =
  | { ok: true; gatewayPageUrl: string; sessionKey?: string }
  | { ok: false; message: string }

function isLive(): boolean {
  return process.env.SSLCOMMERZ_IS_LIVE === 'true'
}

function storeId(): string {
  return (process.env.SSLCOMMERZ_STORE_ID || '').trim()
}

function storePass(): string {
  return (process.env.SSLCOMMERZ_STORE_PASS || '').trim()
}

export function sslcommerzConfigured(): boolean {
  const id = storeId()
  const pass = storePass()
  return Boolean(id && pass && id !== 'your-store-id' && pass !== 'your-store-password')
}

export function sslcommerzBaseUrl(): string {
  return isLive()
    ? 'https://securepay.sslcommerz.com'
    : 'https://sandbox.sslcommerz.com'
}

export async function createSslcommerzSession(
  input: SslInitInput,
  reqUrl?: string,
): Promise<SslInitResult> {
  if (!sslcommerzConfigured()) {
    return { ok: false, message: 'SSLCommerz credentials not configured' }
  }

  const origin = appBaseUrl(reqUrl)
  const params = new URLSearchParams({
    store_id: storeId(),
    store_passwd: storePass(),
    total_amount: String(input.amountBdt),
    currency: 'BDT',
    tran_id: input.tranId,
    success_url: `${origin}/api/web/v1/checkout/callback?status=success`,
    fail_url: `${origin}/api/web/v1/checkout/callback?status=fail`,
    cancel_url: `${origin}/api/web/v1/checkout/callback?status=cancel`,
    ipn_url: `${origin}/api/web/v1/checkout/ipn`,
    cus_name: input.customer.name || 'Lawyer Diary user',
    cus_email: input.customer.email || 'noreply@lawyerdiary.local',
    cus_add1: 'Dhaka',
    cus_city: 'Dhaka',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: input.customer.phone || '01700000000',
    shipping_method: 'NO',
    num_of_item: '1',
    product_name: input.productName.slice(0, 120),
    product_category: 'subscription',
    product_profile: 'non-physical-goods',
  })

  const res = await fetch(`${sslcommerzBaseUrl()}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const text = await res.text()
  let json: Record<string, unknown> = {}
  try {
    json = JSON.parse(text) as Record<string, unknown>
  } catch {
    return { ok: false, message: 'SSLCommerz returned non-JSON' }
  }

  const status = String(json.status || '')
  const url = String(json.GatewayPageURL || json.gatewayPageURL || '')
  if (status === 'SUCCESS' && url) {
    return { ok: true, gatewayPageUrl: url, sessionKey: String(json.sessionkey || '') }
  }
  return {
    ok: false,
    message: String(json.failedreason || json.message || `SSLCommerz ${status || 'error'}`),
  }
}

export async function validateSslcommerzPayment(valId: string): Promise<{
  valid: boolean
  amount?: number
  tranId?: string
  status?: string
}> {
  if (!sslcommerzConfigured() || !valId) return { valid: false }

  const qs = new URLSearchParams({
    val_id: valId,
    store_id: storeId(),
    store_passwd: storePass(),
    format: 'json',
  })
  const res = await fetch(
    `${sslcommerzBaseUrl()}/validator/api/validationserverAPI.php?${qs.toString()}`,
  )
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  const status = String(json.status || '')
  const valid = status === 'VALID' || status === 'VALIDATED'
  return {
    valid,
    status,
    amount: json.amount != null ? Number(json.amount) : undefined,
    tranId: json.tran_id != null ? String(json.tran_id) : undefined,
  }
}

export async function readSslForm(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') || ''
  const out: Record<string, string> = {}
  if (ct.includes('application/json')) {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>
    for (const [k, v] of Object.entries(json)) {
      if (v != null) out[k] = String(v)
    }
    return out
  }
  try {
    const fd = await req.formData()
    fd.forEach((value, key) => {
      if (typeof value === 'string') out[key] = value
    })
  } catch {
    /* empty */
  }
  return out
}
