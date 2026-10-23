import assert from 'node:assert/strict'
import test from 'node:test'
import { issuePasswordOtp, OTP_EMAIL_FAILED_MESSAGE_BN } from './issue-password-otp'
import { hasGmailSmtp, resolveGmailOtpFrom } from '../mail/config'
import { sendViaGmail, setGmailTransportFactory, type GmailOutbound, type GmailTransportOptions } from '../mail/providers/gmail'

const FAKE_APP_PASSWORD = 'gmail-app-password-test'
const FROM_ACCOUNT = 'hfazlul860@gmail.com'
const RECIPIENT = 'person@example.com'
const OTP = '482913'

function remember(name: string): string | undefined {
  return process.env[name]
}

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

function sameText(actual: string | undefined, expected: string): boolean {
  if (actual == null || actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i += 1) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

test('password OTP email uses Gmail SMTP and fails closed without the app password', async () => {
  const envNames = [
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'BREVO_API_KEY',
    'RESEND_API_KEY',
    'MAIL_FROM_NOREPLY',
    'EMAIL_FROM',
  ] as const
  const saved = Object.fromEntries(envNames.map((name) => [name, remember(name)])) as Record<
    (typeof envNames)[number],
    string | undefined
  >
  const previousFetch = globalThis.fetch
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'] as const
  const savedConsole = Object.fromEntries(consoleMethods.map((name) => [name, console[name]])) as Record<
    (typeof consoleMethods)[number],
    (...args: unknown[]) => void
  >
  const logs: string[] = []
  let brevoOrResendHits = 0
  const smtpCalls: GmailTransportOptions[] = []
  const sent: GmailOutbound[] = []

  const userDeps = {
    findUserByEmail: async () => ({ id: 'u1', phone: '+8801858173601', email: RECIPIENT }),
    findUserByEmailAndPhone: async () => null,
    storeChallenge: async () => {},
    sendSms: async () => ({ ok: false }),
    alreadySent: async () => false,
    recordSent: async () => {},
    now: () => new Date('2026-10-23T00:00:00Z'),
    generateOtp: () => OTP,
  }

  function installRecordingTransport() {
    setGmailTransportFactory((options) => {
      smtpCalls.push(options)
      return {
        sendMail: async (mail) => {
          sent.push(mail)
          return { messageId: 'gmail-test-1' }
        },
      }
    })
  }

  try {
    for (const name of consoleMethods) {
      console[name] = (...args: unknown[]) => {
        logs.push(args.map((item) => String(item)).join(' '))
      }
    }
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (url.includes('brevo') || url.includes('resend')) brevoOrResendHits += 1
      throw new Error('mail network disabled in test')
    }) as typeof fetch

    delete process.env.BREVO_API_KEY
    delete process.env.RESEND_API_KEY
    process.env.MAIL_FROM_NOREPLY = 'Lawyer Diary BD <noreply@lawyerdiarybd.com>'
    process.env.GMAIL_USER = FROM_ACCOUNT
    process.env.GMAIL_APP_PASSWORD = FAKE_APP_PASSWORD
    installRecordingTransport()

    const mailed = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(mailed.ok, true)
    assert.equal(hasGmailSmtp(), true)
    assert.equal(smtpCalls.length, 1)
    assert.equal(smtpCalls[0].host, 'smtp.gmail.com')
    assert.equal(smtpCalls[0].port, 465)
    assert.equal(smtpCalls[0].secure, true)
    assert.equal(smtpCalls[0].auth.user, FROM_ACCOUNT)
    assert.equal(sameText(smtpCalls[0].auth.pass, FAKE_APP_PASSWORD), true)
    assert.equal(sent.length, 1)
    assert.equal(sent[0].from, FROM_ACCOUNT)
    assert.equal(sent[0].to, RECIPIENT)
    assert.equal(sent[0].html.includes(OTP), true)
    assert.equal(brevoOrResendHits, 0)
    assert.equal(resolveGmailOtpFrom(), FROM_ACCOUNT)

    delete process.env.GMAIL_APP_PASSWORD
    delete process.env.BREVO_API_KEY
    delete process.env.RESEND_API_KEY
    const missingPassword = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(missingPassword.ok, false)
    if (!missingPassword.ok) {
      assert.equal(missingPassword.error, 'email_failed')
      assert.equal(missingPassword.messageBn, OTP_EMAIL_FAILED_MESSAGE_BN)
      assert.equal(missingPassword.messageBn.includes('ইমেইল পাঠানো যায়নি'), true)
    }
    assert.equal(hasGmailSmtp(), false)
    assert.equal(sent.length, 1)
    assert.equal(brevoOrResendHits, 0)

    process.env.BREVO_API_KEY = 'brevo-not-used-for-otp'
    process.env.RESEND_API_KEY = 'resend-not-used-for-otp'
    const stillMissing = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(stillMissing.ok, false)
    if (!stillMissing.ok) assert.equal(stillMissing.error, 'email_failed')
    assert.equal(sent.length, 1)
    assert.equal(brevoOrResendHits, 0)

    process.env.GMAIL_APP_PASSWORD = FAKE_APP_PASSWORD
    setGmailTransportFactory(() => ({
      sendMail: async () => {
        throw new Error(`535 rejected for ${RECIPIENT} code ${OTP} pass ${FAKE_APP_PASSWORD}`)
      },
    }))
    const rejected = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(rejected.ok, false)
    if (!rejected.ok) {
      assert.equal(rejected.error, 'email_failed')
      assert.equal(rejected.messageBn, OTP_EMAIL_FAILED_MESSAGE_BN)
    }
    const direct = await sendViaGmail({
      to: RECIPIENT,
      subject: 'MAMLAQ — পাসওয়ার্ড কোড',
      html: `<p>${OTP}</p>`,
    })
    assert.equal(direct.ok, false)
    assert.equal(direct.dryRun, false)
    assert.equal(direct.provider, 'gmail')
    assert.equal(direct.error?.includes(RECIPIENT), false)
    assert.equal(direct.error?.includes(OTP), false)
    assert.equal(direct.error?.includes(FAKE_APP_PASSWORD), false)

    delete process.env.GMAIL_USER
    process.env.GMAIL_APP_PASSWORD = FAKE_APP_PASSWORD
    assert.equal(resolveGmailOtpFrom(), 'Lawyer Diary BD <noreply@lawyerdiarybd.com>')
    const missingUser = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(missingUser.ok, false)
    if (!missingUser.ok) assert.equal(missingUser.error, 'email_failed')

    delete process.env.MAIL_FROM_NOREPLY
    process.env.EMAIL_FROM = 'Lawyer Diary BD <fallback@lawyerdiarybd.com>'
    assert.equal(resolveGmailOtpFrom(), 'Lawyer Diary BD <fallback@lawyerdiarybd.com>')

    const leakedPassword = logs.some((line) => line.includes(FAKE_APP_PASSWORD))
    const leakedRecipient = logs.some((line) => line.includes(RECIPIENT))
    const leakedOtp = logs.some((line) => line.includes(OTP))
    const leakedSavedPassword = Boolean(saved.GMAIL_APP_PASSWORD) && logs.some((line) => line.includes(saved.GMAIL_APP_PASSWORD as string))
    assert.equal(leakedPassword, false)
    assert.equal(leakedRecipient, false)
    assert.equal(leakedOtp, false)
    assert.equal(leakedSavedPassword, false)
  } finally {
    setGmailTransportFactory(null)
    globalThis.fetch = previousFetch
    for (const name of consoleMethods) console[name] = savedConsole[name]
    for (const name of envNames) restore(name, saved[name])
  }
})
