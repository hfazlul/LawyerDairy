import {
  providerHasKey,
  resolveFromAddress,
  resolveProviderOrder,
} from './config'
import { canSendWithinDailyLimit, recordSends } from './daily-limit'
import { sendViaBrevo } from './providers/brevo'
import { sendViaResend } from './providers/resend'
import type { MailProviderName, SendEmailInput, SendResult } from './types'

async function dispatch(
  provider: MailProviderName,
  opts: { from: string; to: string; subject: string; html: string },
): Promise<SendResult> {
  if (provider === 'brevo') return sendViaBrevo(opts)
  return sendViaResend(opts)
}

/**
 * Send one email via Brevo / Resend (or dry-run when no API keys).
 * Password-reset OTP does not use this path. It uses Gmail SMTP and fails closed.
 * `EMAIL_PROVIDER=auto` tries primary then fallback.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const from = resolveFromAddress(input.from ?? 'noreply')
  const order = resolveProviderOrder(input.provider)
  const available = order.filter(providerHasKey)

  if (available.length === 0) {
    console.info('[email:dry-run]', {
      to: input.to,
      subject: input.subject,
      from,
      providersTried: order,
    })
    return {
      ok: true,
      dryRun: true,
      provider: 'dry_run',
      id: `dry-${Date.now()}`,
    }
  }

  if (!canSendWithinDailyLimit(1)) {
    return {
      ok: false,
      dryRun: false,
      error: `Daily mail limit reached (MAIL_DAILY_LIMIT). Try again tomorrow or raise the limit.`,
    }
  }

  const errors: string[] = []
  for (const provider of available) {
    const result = await dispatch(provider, {
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    })
    if (result.ok) {
      recordSends(1)
      return result
    }
    errors.push(`${provider}: ${result.error || 'failed'}`)
  }

  return {
    ok: false,
    dryRun: false,
    error: errors.join(' | '),
  }
}
