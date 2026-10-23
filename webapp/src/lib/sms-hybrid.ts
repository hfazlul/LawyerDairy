import { formatSmsPhone, sendSms, smsGatewayConfigured } from './sms-otp'
import { prisma } from './prisma'
import {
  bulkSms24KeyFromEnv,
  bulkSms24SingleUrlFromEnv,
  bulkSms24UrlFromEnv,
  envTrim,
  smsNetBdKeyFromEnv,
  smsNetBdUrlFromEnv,
} from './env-aliases'

/**
 * SIM bulk SMS hybrid.
 * SMS_MODE=production tries 24bulksmsbd first. sms.net.bd is called
 * once only when that send is not accepted. An accepted send does not fall back.
 * Otherwise sms.net.bd is primary and 24bulksmsbd is the failover.
 * Skip-if-no-keys. WhatsApp Cloud auto-send is removed.
 * Named aliases: SMS_NET_BD_API_KEY / SMS_NETBD_API_KEY / SMS_API_URL-as-key, BULKSMS24_API_KEY / SMS_FAILOVER_KEY.
 * Hearing/bulk texts post JSON to DynamicSMSApi: customer_id, api_key, messages[{to,message}].
 * Password OTP posts form fields customer_id, api_key, message, mobile_no (01…) to smsSendApi,
 * because the provider whitelists OTP only on that endpoint. No sender_id.
 * sms.net.bd posts form fields api_key, to, and msg. It does not send sender_id or content_id.
 */

export function smsNetBdUrl(): string {
  return smsNetBdUrlFromEnv()
}

export function smsNetBdKey(): string {
  return smsNetBdKeyFromEnv()
}

export function bulkSms24Url(): string {
  return bulkSms24UrlFromEnv()
}

export function bulkSms24Key(): string {
  return bulkSms24KeyFromEnv()
}

export function smsNetBdConfigured(): boolean {
  return Boolean(smsNetBdKey())
}

export function bulkSms24Configured(): boolean {
  return Boolean(bulkSms24Key())
}

export function smsHybridConfigured(): boolean {
  return smsNetBdConfigured() || bulkSms24Configured() || smsGatewayConfigured()
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(text) as unknown
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  } catch {
    /* plain text body */
  }
  return null
}

function smsNetBdOk(status: number, text: string): boolean {
  const json = parseJson(text)
  if (json) {
    const err = json.error
    if (err === 0 || err === '0') return true
    if (typeof err === 'number' && err !== 0) return false
  }
  if (/insufficient|invalid api|error["']?\s*:\s*[1-9]/i.test(text)) return false
  return status >= 200 && status < 300
}

function redactProviderText(text: string): string {
  return text
    .replace(/(api[_-]?key|token|secret|password)(["'\s:=]+)[^&\s"']+/gi, '$1$2redacted')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

/** Short gateway token safe to print. Never the message, phone, or key. */
function bulk24StatusToken(json: Record<string, unknown> | null): string {
  if (!json || json.status == null) return ''
  const raw = json.status
  const text =
    typeof raw === 'number' && Number.isFinite(raw)
      ? String(raw)
      : typeof raw === 'string'
        ? raw.trim()
        : ''
  if (!text || !/^[A-Za-z0-9_-]{1,32}$/.test(text)) return ''
  return text
}

function bulk24SmsIdToken(json: Record<string, unknown> | null): string {
  if (!json || json.sms_id == null) return ''
  const raw = json.sms_id
  const text =
    typeof raw === 'number' && Number.isFinite(raw)
      ? String(raw)
      : typeof raw === 'string'
        ? raw.trim()
        : ''
  if (!text || !/^[A-Za-z0-9_-]{1,80}$/.test(text)) return ''
  return text
}

/**
 * Countdown may start only after the gateway accepts the SMS.
 * status ok means accepted. HTTP 200 alone does not.
 * failed, error, and 1003 are failures. 1002 is a later report code and is not required.
 */
function bulk24Ok(status: number, text: string): boolean {
  if (status < 200 || status >= 300) return false
  const gateway = bulk24StatusToken(parseJson(text)).toLowerCase()
  if (gateway === 'failed' || gateway === 'error' || gateway === '1003') return false
  return gateway === 'ok'
}

function logBulk24Result(httpStatus: number, text: string, accepted: boolean): void {
  const json = parseJson(text)
  const gateway = bulk24StatusToken(json)
  const smsId = bulk24SmsIdToken(json)
  const verb = accepted ? 'accept' : 'reject'
  const idPart = smsId ? ` sms_id=${smsId}` : ''
  const line = `[sms] 24bulksmsbd ${verb} http=${httpStatus} status=${gateway}${idPart}`
  if (accepted) console.log(line)
  else console.error(line)
}

export async function sendSmsNetBd(phone: string, message: string): Promise<{
  ok: boolean
  skipped?: string
  error?: string
}> {
  const key = smsNetBdKey()
  if (!key) return { ok: false, skipped: 'sms_unconfigured' }
  const to = formatSmsPhone(phone, 'local01')
  const url = smsNetBdUrl()
  const body = new URLSearchParams({
    api_key: key,
    to,
    msg: message,
  })
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const text = await res.text()
    if (!smsNetBdOk(res.status, text)) {
      return { ok: false, error: `sms.net.bd ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'sms.net.bd_failed' }
  }
}

function bulkSms24CustomerId(): number | string {
  const raw = envTrim('SMS_CUSTOMER_ID') || '1684'
  return /^\d+$/.test(raw) ? Number(raw) : raw
}

/** One recipient. JSON body; messages is an array so each client text can differ. */
export async function sendBulkSms24(phone: string, message: string): Promise<{
  ok: boolean
  skipped?: string
  error?: string
}> {
  const key = bulkSms24Key()
  if (!key) return { ok: false, skipped: 'sms_unconfigured' }
  // Gateway example is 880 then the mobile with no leading 0 (88017…).
  const to = formatSmsPhone(phone, 'e164')
  const url = bulkSms24Url()
  const body = JSON.stringify({
    customer_id: bulkSms24CustomerId(),
    api_key: key,
    messages: [{ to, message }],
  })
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    const text = await res.text()
    const accepted = bulk24Ok(res.status, text)
    logBulk24Result(res.status, text, accepted)
    if (!accepted) {
      return { ok: false, error: `24bulksmsbd ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    const detail = e instanceof Error ? e.message : '24bulksmsbd_failed'
    console.error('[sms] 24bulksmsbd request failed', redactProviderText(detail))
    return { ok: false, error: '24bulksmsbd_failed' }
  }
}

const SINGLE_OK_STATUS = new Set(['ok', 'success', 'successful', 'sent'])
const SINGLE_FAIL_STATUS = new Set(['failed', 'fail', 'failure', 'error', 'false', '1003'])
const SINGLE_ERROR_WORDS =
  /error|fail|invalid|whitelist|white list|insufficient|denied|unauthori[sz]ed|blocked|reject|not allowed/i
const SINGLE_ID_KEYS = ['sms_id', 'smsId', 'message_id', 'messageId', 'msg_id', 'request_id', 'id']

function idToken(raw: unknown): string {
  const text =
    typeof raw === 'number' && Number.isFinite(raw)
      ? String(raw)
      : typeof raw === 'string'
        ? raw.trim()
        : ''
  return /^[A-Za-z0-9_-]{1,80}$/.test(text) ? text : ''
}

function singleIdToken(json: Record<string, unknown>): string {
  const scopes: Record<string, unknown>[] = [json]
  const data = json.data
  if (data && typeof data === 'object' && !Array.isArray(data)) scopes.push(data as Record<string, unknown>)
  for (const scope of scopes) {
    for (const k of SINGLE_ID_KEYS) {
      const id = idToken(scope[k])
      if (id) return id
    }
  }
  return ''
}

function stringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) for (const v of value) stringValues(v, out)
  else if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) stringValues(v, out)
  }
  return out
}

function singleExplicitError(json: Record<string, unknown>): boolean {
  if (json.success === false || json.success === 'false') return true
  const err = json.error
  if (err != null && err !== false && err !== 0 && err !== '0' && err !== '') return true
  const status = bulk24StatusToken(json).toLowerCase()
  if (SINGLE_FAIL_STATUS.has(status)) return true
  return stringValues(json).some((v) => SINGLE_ERROR_WORDS.test(v))
}

/**
 * smsSendApi response shape is undocumented. Accepted only when the JSON body
 * has status ok/success (or success true), or carries an id, and no error marker.
 * Empty or non-JSON bodies are failures.
 */
export function parseBulk24SingleResponse(
  httpStatus: number,
  text: string,
): { accepted: boolean; status: string; id: string } {
  const json = parseJson(text)
  if (!json) return { accepted: false, status: '', id: '' }
  const status = bulk24StatusToken(json)
  const id = singleIdToken(json)
  if (httpStatus < 200 || httpStatus >= 300) return { accepted: false, status, id }
  if (singleExplicitError(json)) return { accepted: false, status, id }
  const okStatus = SINGLE_OK_STATUS.has(status.toLowerCase()) || json.success === true
  return { accepted: okStatus || Boolean(id), status, id }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Provider body safe for pm2 logs: no key, no phone, no message digits, max 200 chars. */
function scrubSingleBody(text: string, secrets: { key: string; phone: string; message: string }): string {
  let out = text
  if (secrets.key) out = out.split(secrets.key).join('[key]')
  out = out.replace(/(api[_-]?key|token|secret|password)(["'\s:=]+)[^&\s"',}]+/gi, '$1$2[key]')
  const local = secrets.phone.replace(/\D/g, '').replace(/^880/, '').replace(/^0/, '')
  if (local) out = out.replace(new RegExp(`(?:\\+?880|0)?${escapeRegExp(local)}`, 'g'), '[phone]')
  out = out.replace(/(?:\+?88)?01[3-9]\d{8}/g, '[phone]')
  if (secrets.message) out = out.split(secrets.message).join('[message]')
  for (const digits of secrets.message.match(/\d{4,}/g) || []) out = out.split(digits).join('[code]')
  return out.replace(/\s+/g, ' ').trim().slice(0, 200)
}

/** One recipient, form POST to smsSendApi. Used for the password OTP. */
export async function sendBulkSms24Single(phone: string, message: string): Promise<{
  ok: boolean
  skipped?: string
  error?: string
}> {
  const key = bulkSms24Key()
  if (!key) return { ok: false, skipped: 'sms_unconfigured' }
  const mobile = formatSmsPhone(phone, 'local01')
  if (!/^01[3-9]\d{8}$/.test(mobile)) return { ok: false, error: 'invalid_phone' }
  const url = bulkSms24SingleUrlFromEnv()
  const body = new URLSearchParams({
    customer_id: String(bulkSms24CustomerId()),
    api_key: key,
    message,
    mobile_no: mobile,
  })
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const text = await res.text()
    const parsed = parseBulk24SingleResponse(res.status, text)
    const safeBody = scrubSingleBody(text, { key, phone: mobile, message })
    const line =
      `[sms] 24bulksms smsSendApi http=${res.status} status=${parsed.status || '-'}` +
      ` id=${parsed.id || '-'} body=${safeBody}`
    if (parsed.accepted) console.log(line)
    else console.error(line)
    if (!parsed.accepted) return { ok: false, error: `24bulksmsbd smsSendApi ${res.status}` }
    return { ok: true }
  } catch (e) {
    const detail = e instanceof Error ? e.message : '24bulksmsbd_failed'
    console.error(
      '[sms] 24bulksms smsSendApi request failed',
      scrubSingleBody(detail, { key, phone: mobile, message }),
    )
    return { ok: false, error: '24bulksmsbd_failed' }
  }
}

function smsProductionMode(): boolean {
  return envTrim('SMS_MODE').toLowerCase() === 'production'
}

export async function sendSmsHybrid(input: {
  phone: string
  message: string
  kind: string
  workspaceId?: string | null
  /** Password OTP: 24bulksms goes through smsSendApi, never DynamicSMSApi. */
  otp?: boolean
}): Promise<{ ok: boolean; skipped?: string; provider?: string; error?: string }> {
  const send24 = input.otp ? sendBulkSms24Single : sendBulkSms24
  // Production tries 24bulksmsbd first. Fall back once only when that send is not
  // accepted. An accepted send must return here — a second call would send two SMS.
  if (smsProductionMode()) {
    if (!bulkSms24Configured()) return { ok: false, skipped: 'sms_unconfigured' }
    const sent = await send24(input.phone, input.message)
    if (sent.ok) {
      await recordSmsUsage({
        provider: '24bulksmsbd',
        kind: input.kind,
        workspaceId: input.workspaceId,
        phone: input.phone,
      })
      return { ok: true, provider: '24bulksmsbd' }
    }
    if (sent.skipped !== 'sms_unconfigured' && smsNetBdConfigured()) {
      const fallback = await sendSmsNetBd(input.phone, input.message)
      if (fallback.ok) {
        await recordSmsUsage({
          provider: 'sms.net.bd',
          kind: input.kind,
          workspaceId: input.workspaceId,
          phone: input.phone,
        })
        return { ok: true, provider: 'sms.net.bd' }
      }
      return {
        ok: false,
        provider: 'sms.net.bd',
        error: fallback.error,
        skipped: fallback.skipped,
      }
    }
    return { ok: false, provider: '24bulksmsbd', error: sent.error, skipped: sent.skipped }
  }

  if (smsNetBdConfigured()) {
    const primary = await sendSmsNetBd(input.phone, input.message)
    if (primary.ok) {
      await recordSmsUsage({
        provider: 'sms.net.bd',
        kind: input.kind,
        workspaceId: input.workspaceId,
        phone: input.phone,
      })
      return { ok: true, provider: 'sms.net.bd' }
    }
    if (bulkSms24Configured()) {
      const fail = await send24(input.phone, input.message)
      if (fail.ok) {
        await recordSmsUsage({
          provider: '24bulksmsbd',
          kind: input.kind,
          workspaceId: input.workspaceId,
          phone: input.phone,
        })
        return { ok: true, provider: '24bulksmsbd' }
      }
      return { ok: false, provider: '24bulksmsbd', error: fail.error || primary.error }
    }
    return { ok: false, provider: 'sms.net.bd', error: primary.error, skipped: primary.skipped }
  }

  if (smsGatewayConfigured()) {
    const generic = await sendSms(input.phone, input.message)
    if (generic.ok) {
      await recordSmsUsage({
        provider: 'primary',
        kind: input.kind,
        workspaceId: input.workspaceId,
        phone: input.phone,
      })
      return { ok: true, provider: 'primary' }
    }
    if (bulkSms24Configured() && generic.skipped !== 'sms_unconfigured') {
      const fail = await send24(input.phone, input.message)
      if (fail.ok) {
        await recordSmsUsage({
          provider: '24bulksmsbd',
          kind: input.kind,
          workspaceId: input.workspaceId,
          phone: input.phone,
        })
        return { ok: true, provider: '24bulksmsbd' }
      }
    }
    if (generic.skipped === 'sms_unconfigured' && bulkSms24Configured()) {
      const fail = await send24(input.phone, input.message)
      if (fail.ok) {
        await recordSmsUsage({
          provider: '24bulksmsbd',
          kind: input.kind,
          workspaceId: input.workspaceId,
          phone: input.phone,
        })
        return { ok: true, provider: '24bulksmsbd' }
      }
      return { ok: false, provider: '24bulksmsbd', error: fail.error }
    }
    return {
      ok: false,
      skipped: 'skipped' in generic ? generic.skipped : undefined,
      error: 'error' in generic ? generic.error : undefined,
      provider: 'primary',
    }
  }

  if (bulkSms24Configured()) {
    const fail = await send24(input.phone, input.message)
    if (fail.ok) {
      await recordSmsUsage({
        provider: '24bulksmsbd',
        kind: input.kind,
        workspaceId: input.workspaceId,
        phone: input.phone,
      })
      return { ok: true, provider: '24bulksmsbd' }
    }
    return { ok: false, provider: '24bulksmsbd', error: fail.error, skipped: fail.skipped }
  }

  return { ok: false, skipped: 'sms_unconfigured' }
}

/** Auto WhatsApp Cloud / WABA removed. Manual wa.me on device stays. */
export async function sendWhatsappOrSkip(_input: {
  phone: string
  template: string
  kind: string
  workspaceId?: string | null
  language?: string
}): Promise<{ ok: boolean; skipped?: string }> {
  return { ok: false, skipped: 'whatsapp_auto_removed' }
}

async function recordSmsUsage(input: {
  provider: string
  channel?: string
  kind: string
  workspaceId?: string | null
  phone: string
  costPaisa?: number
}) {
  if (!process.env.DATABASE_URL || process.env.NODE_TEST_CONTEXT) return
  const cms = await prisma.cmsSettings.findUnique({ where: { id: 'current' } }).catch(() => null)
  const rate = cms?.smsRatePaisa ?? 40
  const digits = input.phone.replace(/\D/g, '')
  const masked = digits.length >= 4 ? `${digits.slice(0, 3)}****${digits.slice(-2)}` : '****'
  try {
    await prisma.smsUsage.create({
      data: {
        workspaceId: input.workspaceId || null,
        provider: input.provider,
        channel: 'sms',
        kind: input.kind,
        qty: 1,
        costPaisa: input.costPaisa ?? rate,
        toMasked: masked,
      },
    })
  } catch {
    /* table may not exist until db push */
  }
}
