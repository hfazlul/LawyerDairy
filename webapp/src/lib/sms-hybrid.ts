import { formatSmsPhone, sendSms, smsGatewayConfigured } from './sms-otp'
import { prisma } from './prisma'
import {
  bulkSms24KeyFromEnv,
  bulkSms24UrlFromEnv,
  envTrim,
  smsNetBdKeyFromEnv,
  smsNetBdUrlFromEnv,
} from './env-aliases'

/**
 * SIM bulk SMS hybrid: sms.net.bd primary, 24bulksmsbd failover.
 * Skip-if-no-keys. WhatsApp Cloud auto-send is removed.
 * Named aliases: SMS_NET_BD_API_KEY / SMS_API_URL-as-key, BULKSMS24_API_KEY / SMS_FAILOVER_KEY.
 * 24bulksmsbd posts JSON to DynamicSMSApi: customer_id, api_key, messages[{to,message}].
 * Hearing texts differ per client, so the same-text endpoint is not used. OTP is one entry in that same array.
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

function senderId(): string {
  return envTrim('SMS_SENDER_ID') || 'LawyerDiary'
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
  const sid = senderId()
  if (sid) body.set('sender_id', sid)
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

function smsProductionMode(): boolean {
  return envTrim('SMS_MODE').toLowerCase() === 'production'
}

export async function sendSmsHybrid(input: {
  phone: string
  message: string
  kind: string
  workspaceId?: string | null
}): Promise<{ ok: boolean; skipped?: string; provider?: string; error?: string }> {
  // Production uses the non-masking account (BULKSMS24_API_KEY) only.
  // sms.net.bd and the generic gateway stay off so a dummy or old key cannot send.
  if (smsProductionMode()) {
    if (!bulkSms24Configured()) return { ok: false, skipped: 'sms_unconfigured' }
    const sent = await sendBulkSms24(input.phone, input.message)
    if (sent.ok) {
      await recordSmsUsage({
        provider: '24bulksmsbd',
        kind: input.kind,
        workspaceId: input.workspaceId,
        phone: input.phone,
      })
      return { ok: true, provider: '24bulksmsbd' }
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
      const fail = await sendBulkSms24(input.phone, input.message)
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
      const fail = await sendBulkSms24(input.phone, input.message)
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
      const fail = await sendBulkSms24(input.phone, input.message)
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
    const fail = await sendBulkSms24(input.phone, input.message)
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
