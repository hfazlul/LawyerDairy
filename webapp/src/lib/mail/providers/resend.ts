import type { SendResult } from '../types'

/**
 * Resend HTTP API — fallback / transactional.
 * https://resend.com/docs/api-reference/emails/send-email
 */
export async function sendViaResend(opts: {
  from: string
  to: string
  subject: string
  html: string
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, dryRun: false, provider: 'resend', error: 'RESEND_API_KEY missing' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: opts.from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    })

    const data = (await res.json().catch(() => ({}))) as {
      id?: string
      message?: string
      name?: string
    }

    if (!res.ok) {
      return {
        ok: false,
        dryRun: false,
        provider: 'resend',
        error: data.message || data.name || res.statusText,
      }
    }

    return {
      ok: true,
      dryRun: false,
      provider: 'resend',
      id: data.id,
    }
  } catch (e) {
    return { ok: false, dryRun: false, provider: 'resend', error: String(e) }
  }
}
