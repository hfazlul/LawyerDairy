/// <reference path="./nodemailer.d.ts" />
import nodemailer from 'nodemailer'
import { resolveGmailOtpFrom } from '../config'
import type { SendResult } from '../types'

const GMAIL_SMTP_HOST = 'smtp.gmail.com'
const GMAIL_SMTP_PORT = 465

export type GmailTransportOptions = {
  host: string
  port: number
  secure: boolean
  auth: { user: string; pass: string }
}

export type GmailOutbound = {
  from: string
  to: string
  subject: string
  html: string
}

export type GmailTransport = {
  sendMail: (mail: GmailOutbound) => Promise<{ messageId?: string }>
  close?: () => void
}

function createNodemailerTransport(options: GmailTransportOptions): GmailTransport {
  const transport = nodemailer.createTransport(options)
  return {
    sendMail: (mail) => transport.sendMail(mail),
    close: () => transport.close(),
  }
}

let transportFactory: (options: GmailTransportOptions) => GmailTransport = createNodemailerTransport

/** Tests inject a transport so OTP coverage never opens a real SMTP connection. */
export function setGmailTransportFactory(
  factory: ((options: GmailTransportOptions) => GmailTransport) | null,
): void {
  transportFactory = factory ?? createNodemailerTransport
}

function redactMailError(text: string, recipient: string): string {
  let out = text
  const password = process.env.GMAIL_APP_PASSWORD?.trim() || ''
  const secrets = [password, password.replace(/\s+/g, ''), recipient.trim()]
  for (const secret of secrets) {
    if (secret.length < 4) continue
    out = out.split(secret).join('[redacted]')
  }
  return out.replace(/\b\d{6}\b/g, '[redacted]')
}

/**
 * Password-reset OTP only. Missing Gmail credentials fail closed.
 * Other mail stays on Brevo / Resend.
 */
export async function sendViaGmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<SendResult> {
  const user = process.env.GMAIL_USER?.trim() || ''
  const pass = process.env.GMAIL_APP_PASSWORD?.trim() || ''
  if (!user || !pass) {
    return {
      ok: false,
      dryRun: false,
      provider: 'gmail',
      error: 'GMAIL_USER or GMAIL_APP_PASSWORD missing',
    }
  }

  const from = resolveGmailOtpFrom()
  if (!from) {
    return {
      ok: false,
      dryRun: false,
      provider: 'gmail',
      error: 'Gmail from address missing',
    }
  }

  let transport: GmailTransport | undefined
  try {
    transport = transportFactory({
      host: GMAIL_SMTP_HOST,
      port: GMAIL_SMTP_PORT,
      secure: true,
      auth: { user, pass },
    })
    const info = await transport.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    return {
      ok: true,
      dryRun: false,
      provider: 'gmail',
      id: info.messageId,
    }
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      dryRun: false,
      provider: 'gmail',
      error: redactMailError(raw, opts.to),
    }
  } finally {
    try {
      transport?.close?.()
    } catch {
      // Closing the socket must not replace the send result.
    }
  }
}
