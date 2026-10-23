// SMS adapter for hearing reminders, compose, and forgot-password OTP.
// Login/signup OTP stays locked off. Skip-if-no-keys — never invent a send.
// Vendor styles match mobile `sms_vendor_adapter.dart`.

export type SmsVendorStyle =
  | 'bearer_json'
  | 'json_body'
  | 'form_post'
  | 'query_get'
  | 'query_post'

export type SmsPhoneFormat = 'local01' | 'e164' | 'digits'
export type SmsKeyIn = 'header_bearer' | 'header' | 'query' | 'body'

export type SmsSendResult =
  | { ok: true; skipped?: undefined }
  | { ok: false; skipped: 'sms_unconfigured' }
  | { ok: false; skipped?: undefined; error: string }

function looksPlaceholder(value: string): boolean {
  if (!value) return true
  return /your-sms-api-key|your-sms-api|sms-gateway\.com|change-me/i.test(value)
}

export function smsGatewayConfigured(): boolean {
  const url = (process.env.SMS_API_URL || '').trim()
  const key = (process.env.SMS_API_KEY || '').trim()
  if (looksPlaceholder(url) || looksPlaceholder(key)) return false
  if (!/^https?:\/\//i.test(url)) return false
  return Boolean(url && key)
}

function env(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim()
}

export function vendorStyle(): SmsVendorStyle {
  const raw = env('SMS_VENDOR_STYLE', 'bearer_json').toLowerCase()
  if (
    raw === 'json_body' ||
    raw === 'form_post' ||
    raw === 'query_get' ||
    raw === 'query_post' ||
    raw === 'bearer_json'
  ) {
    return raw
  }
  return 'bearer_json'
}

export function formatSmsPhone(phone: string, format: SmsPhoneFormat = 'local01'): string {
  const d = phone.replace(/\D/g, '')
  let local = d
  if (local.startsWith('880')) local = local.slice(3)
  if (local.startsWith('0')) local = local.slice(1)
  if (!/^1[3-9]\d{8}$/.test(local)) return phone.trim()
  if (format === 'e164') return `880${local}`
  if (format === 'digits') return local
  return `0${local}`
}

function parseExtraFields(): Record<string, string> {
  const raw = env('SMS_EXTRA_FIELDS')
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v == null) continue
      out[k] = String(v)
    }
    return out
  } catch {
    return {}
  }
}

export function buildSmsRequest(input: {
  phone: string
  message: string
}): { url: string; method: 'GET' | 'POST'; headers: Record<string, string>; body?: string } {
  const style = vendorStyle()
  const baseUrl = env('SMS_API_URL')
  const apiKey = env('SMS_API_KEY')
  const secret = env('SMS_API_SECRET')
  const sender = env('SMS_SENDER_ID', 'LawyerDiary')
  const format = (env('SMS_PHONE_FORMAT', 'local01') as SmsPhoneFormat) || 'local01'
  const to = formatSmsPhone(input.phone, format)
  const toField = env('SMS_TO_FIELD') || (style === 'form_post' || style.startsWith('query') ? 'number' : 'to')
  const msgField = env('SMS_MESSAGE_FIELD') || (style === 'form_post' || style.startsWith('query') ? 'msg' : 'message')
  const senderField = env('SMS_SENDER_FIELD') || (style === 'form_post' ? 'senderid' : 'sender')
  const keyField = env('SMS_KEY_FIELD', 'api_key')
  const secretField = env('SMS_SECRET_FIELD', 'api_secret')
  const keyIn = (env('SMS_KEY_IN') || (style === 'bearer_json' ? 'header_bearer' : 'query')) as SmsKeyIn
  const authHeader = env('SMS_AUTH_HEADER', 'Authorization')
  const extra = parseExtraFields()
  const methodOverride = env('SMS_HTTP_METHOD').toUpperCase()

  const fields: Record<string, string> = {
    [toField]: to,
    [msgField]: input.message,
    [senderField]: sender,
    ...extra,
  }
  if (keyIn === 'query' || keyIn === 'body') fields[keyField] = apiKey
  if (secret && (keyIn === 'query' || keyIn === 'body')) fields[secretField] = secret

  const headers: Record<string, string> = {}
  if (keyIn === 'header_bearer') headers[authHeader] = `Bearer ${apiKey}`
  else if (keyIn === 'header') headers[authHeader] = apiKey

  const method: 'GET' | 'POST' =
    methodOverride === 'GET' || methodOverride === 'POST'
      ? methodOverride
      : style === 'query_get'
        ? 'GET'
        : 'POST'

  if (style === 'query_get' || (style === 'query_post' && method === 'GET') || method === 'GET') {
    const u = new URL(baseUrl)
    for (const [k, v] of Object.entries(fields)) u.searchParams.set(k, v)
    return { url: u.toString(), method: 'GET', headers }
  }

  if (style === 'form_post' || style === 'query_post') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    const body = new URLSearchParams(fields).toString()
    let url = baseUrl
    if (style === 'query_post') {
      const u = new URL(baseUrl)
      for (const [k, v] of Object.entries(fields)) u.searchParams.set(k, v)
      url = u.toString()
    }
    return { url, method: 'POST', headers, body: style === 'form_post' ? body : undefined }
  }

  headers['Content-Type'] = 'application/json'
  return {
    url: baseUrl,
    method: 'POST',
    headers,
    body: JSON.stringify(fields),
  }
}

function responseLooksOk(text: string, httpOk: boolean): boolean {
  const failNeedle = env('SMS_FAIL_CONTAINS')
  const okNeedle = env('SMS_SUCCESS_CONTAINS')
  if (failNeedle && text.toLowerCase().includes(failNeedle.toLowerCase())) return false
  if (okNeedle) return text.toLowerCase().includes(okNeedle.toLowerCase())
  return httpOk
}

export async function sendSms(phone: string, message: string): Promise<SmsSendResult> {
  // portal.sms.net.bd is off on purpose so it cannot conflict with 24bulksms.
  if (/sms\.net\.bd/i.test((process.env.SMS_API_URL || '').trim())) {
    return { ok: false, skipped: 'sms_unconfigured' }
  }
  if (!smsGatewayConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS] unconfigured — not sending to ${phone}`)
    }
    return { ok: false, skipped: 'sms_unconfigured' }
  }
  try {
    const req = buildSmsRequest({ phone, message })
    const response = await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    })
    const text = await response.text()
    if (!responseLooksOk(text, response.ok)) {
      return { ok: false, error: `SMS send failed: ${text.slice(0, 300)}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'sms_failed' }
  }
}

/** Throws when unconfigured — used by credits debit path that must not silent-succeed. */
export async function sendOtp(phone: string, message: string): Promise<void> {
  const result = await sendSms(phone, message)
  if (result.ok) return
  if (result.skipped === 'sms_unconfigured') throw new Error('sms_gateway_unconfigured')
  throw new Error(result.error || 'SMS send failed')
}

export async function sendBulkSms(
  recipients: { phone: string; message: string }[],
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0
  for (let i = 0; i < recipients.length; i += 50) {
    const batch = recipients.slice(i, i + 50)
    await Promise.allSettled(
      batch.map(async (r) => {
        try {
          await sendOtp(r.phone, r.message)
          sent++
        } catch {
          failed++
        }
      }),
    )
    if (i + 50 < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  if (failed > 0) {
    throw new Error(`sms_bulk_partial_fail:${failed}`)
  }
  return { sent, failed: 0 }
}
