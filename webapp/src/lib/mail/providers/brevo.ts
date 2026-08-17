import { parseFromAddress } from '../config'
import type { SendResult } from '../types'

/**
 * Brevo Transactional API — primary for campaigns / batch.
 * https://developers.brevo.com/reference/sendtransacemail
 */
export async function sendViaBrevo(opts: {
  from: string
  to: string
  subject: string
  html: string
}): Promise<SendResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, dryRun: false, provider: 'brevo', error: 'BREVO_API_KEY missing' }
  }

  const sender = parseFromAddress(opts.from)

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
      }),
    })

    const data = (await res.json().catch(() => ({}))) as {
      messageId?: string
      message?: string
      code?: string
    }

    if (!res.ok) {
      return {
        ok: false,
        dryRun: false,
        provider: 'brevo',
        error: data.message || data.code || res.statusText,
      }
    }

    return {
      ok: true,
      dryRun: false,
      provider: 'brevo',
      id: data.messageId || `brevo-${Date.now()}`,
    }
  } catch (e) {
    return { ok: false, dryRun: false, provider: 'brevo', error: String(e) }
  }
}
