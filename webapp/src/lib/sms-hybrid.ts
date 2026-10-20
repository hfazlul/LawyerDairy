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

function bulk24Ok(status: number, text: string): boolean {
  const json = parseJson(text)
  if (json) {
    const code = json.response_code ?? json.error ?? json.status
    if (code === 0 || code === '0' || code === 202 || code === '202' || code === 'SUCCESS') return true
    if (typeof code === 'number' && code >= 1000) return false
  }
  if (/invalid|insufficient|failed|error/i.test(text) && !/success/i.test(text)) return false
  return status >= 200 && status < 300
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

export async function sendBulkSms24(phone: string, message: string): Promise<{
  ok: boolean
  skipped?: string
  error?: string
}> {
  const key = bulkSms24Key()
  if (!key) return { ok: false, skipped: 'sms_unconfigured' }
  const to = formatSmsPhone(phone, 'e164')
  const url = bulkSms24Url()
  const body = new URLSearchParams({
    api_key: key,
    senderid: senderId(),
    number: to,
    message,
  })
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const text = await res.text()
    if (!bulk24Ok(res.status, text)) {
      return { ok: false, error: `24bulksmsbd ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '24bulksmsbd_failed' }
  }
}

export async function sendSmsHybrid(input: {
  phone: string
  message: string
  kind: string
  workspaceId?: string | null
}): Promise<{ ok: boolean; skipped?: string; provider?: string; error?: string }> {
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
