import assert from 'node:assert/strict'
import test from 'node:test'
import { issuePasswordOtp, OTP_DAILY_LIMIT_BN, OTP_EMAIL_FAILED_MESSAGE_BN } from './issue-password-otp'
import { otpSendKey } from './password-otp-quota'
import { hasGmailSmtp, resolveBrevoOtpFrom, resolveGmailOtpFrom } from '../mail/config'
import { sendViaGmail, setGmailTransportFactory, type GmailOutbound, type GmailTransportOptions } from '../mail/providers/gmail'

const FAKE_APP_PASSWORD = 'gmail-app-password-test'
const FAKE_BREVO_KEY = 'brevo-otp-fallback-test'
const FROM_ACCOUNT = 'hfazlul860@gmail.com'
const RECIPIENT = 'person@example.com'
const OTP = '482913'
const NOREPLY = 'Lawyer Diary BD <noreply@lawyerdiarybd.com>'
const EMAIL_FROM_VALUE = 'Lawyer Diary BD <fallback@lawyerdiarybd.com>'

const ENV_NAMES = [
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'BREVO_API_KEY',
  'RESEND_API_KEY',
  'MAIL_FROM_NOREPLY',
  'EMAIL_FROM',
] as const

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

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

test('password OTP email uses Gmail first and does not call Brevo when Gmail accepts', async () => {
  const saved = Object.fromEntries(ENV_NAMES.map((name) => [name, remember(name)])) as Record<
    (typeof ENV_NAMES)[number],
    string | undefined
  >
  const previousFetch = globalThis.fetch
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'] as const
  const savedConsole = Object.fromEntries(consoleMethods.map((name) => [name, console[name]])) as Record<
    (typeof consoleMethods)[number],
    (...args: unknown[]) => void
  >
  const logs: string[] = []
  const sentKeys = new Set<string>()
  let records = 0
  let brevoOrResendHits = 0
  const smtpCalls: GmailTransportOptions[] = []
  const sent: GmailOutbound[] = []
  const user = { id: 'u-gmail', phone: '+8801858173601', email: RECIPIENT }
  const now = new Date('2026-10-23T12:00:00.000Z')
  const userDeps = {
    findUserByEmail: async () => user,
    findUserByEmailAndPhone: async () => null,
    storeChallenge: async () => {},
    sendSms: async () => ({ ok: false }),
    alreadySent: async (userId: string, channel: 'email' | 'phone', at: Date) =>
      sentKeys.has(otpSendKey(userId, channel, at)),
    recordSent: async (userId: string, channel: 'email' | 'phone', at: Date) => {
      records += 1
      sentKeys.add(otpSendKey(userId, channel, at))
    },
    now: () => now,
    generateOtp: () => OTP,
  }

  try {
    for (const name of consoleMethods) {
      console[name] = (...args: unknown[]) => {
        logs.push(args.map((item) => String(item)).join(' '))
      }
    }
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = requestUrl(input)
      if (url.includes('brevo') || url.includes('resend')) brevoOrResendHits += 1
      throw new Error('mail network disabled in test')
    }) as typeof fetch

    process.env.BREVO_API_KEY = FAKE_BREVO_KEY
    process.env.RESEND_API_KEY = 'resend-not-used-for-otp'
    process.env.MAIL_FROM_NOREPLY = NOREPLY
    process.env.GMAIL_USER = FROM_ACCOUNT
    process.env.GMAIL_APP_PASSWORD = FAKE_APP_PASSWORD
    setGmailTransportFactory((options) => {
      smtpCalls.push(options)
      return {
        sendMail: async (mail) => {
          sent.push(mail)
          return { messageId: 'gmail-test-1' }
        },
      }
    })

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
    assert.equal(records, 1)
    assert.equal(resolveGmailOtpFrom(), FROM_ACCOUNT)

    const second = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(second.ok, false)
    if (!second.ok) {
      assert.equal(second.error, 'otp_daily_limit')
      assert.equal(second.messageBn, OTP_DAILY_LIMIT_BN)
      assert.equal(second.messageBn, 'আজকের কোড নেওয়া হয়ে গেছে। কাল আবার চেষ্টা করুন।')
    }
    assert.equal(smtpCalls.length, 1)
    assert.equal(sent.length, 1)
    assert.equal(brevoOrResendHits, 0)
    assert.equal(records, 1)

    setGmailTransportFactory(() => ({
      sendMail: async () => {
        throw new Error(`535 rejected for ${RECIPIENT} code ${OTP} pass ${FAKE_APP_PASSWORD}`)
      },
    }))
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
    assert.equal(brevoOrResendHits, 0)

    delete process.env.GMAIL_USER
    process.env.GMAIL_APP_PASSWORD = FAKE_APP_PASSWORD
    assert.equal(resolveGmailOtpFrom(), NOREPLY)
    delete process.env.MAIL_FROM_NOREPLY
    process.env.EMAIL_FROM = EMAIL_FROM_VALUE
    assert.equal(resolveGmailOtpFrom(), EMAIL_FROM_VALUE)

    const leakedPassword = logs.some((line) => line.includes(FAKE_APP_PASSWORD))
    const leakedBrevo = logs.some((line) => line.includes(FAKE_BREVO_KEY))
    const leakedRecipient = logs.some((line) => line.includes(RECIPIENT))
    const leakedOtp = logs.some((line) => line.includes(OTP))
    const leakedSavedPassword =
      Boolean(saved.GMAIL_APP_PASSWORD) && logs.some((line) => line.includes(saved.GMAIL_APP_PASSWORD as string))
    const leakedSavedBrevo =
      Boolean(saved.BREVO_API_KEY) && logs.some((line) => line.includes(saved.BREVO_API_KEY as string))
    assert.equal(leakedPassword, false)
    assert.equal(leakedBrevo, false)
    assert.equal(leakedRecipient, false)
    assert.equal(leakedOtp, false)
    assert.equal(leakedSavedPassword, false)
    assert.equal(leakedSavedBrevo, false)
  } finally {
    setGmailTransportFactory(null)
    globalThis.fetch = previousFetch
    for (const name of consoleMethods) console[name] = savedConsole[name]
    for (const name of ENV_NAMES) restore(name, saved[name])
  }
})

test('failed Gmail OTP does not consume the daily email slot before Brevo is tried', async () => {
  const saved = Object.fromEntries(ENV_NAMES.map((name) => [name, remember(name)])) as Record<
    (typeof ENV_NAMES)[number],
    string | undefined
  >
  const previousFetch = globalThis.fetch
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'] as const
  const savedConsole = Object.fromEntries(consoleMethods.map((name) => [name, console[name]])) as Record<
    (typeof consoleMethods)[number],
    (...args: unknown[]) => void
  >
  const logs: string[] = []
  const sentKeys = new Set<string>()
  let records = 0
  let gmailAttempts = 0
  let resendHits = 0
  let userId = 'u-fallback'
  let gmailMode: 'missing-password' | 'throw' = 'throw'
  let brevoMode: 'ok' | 'fail' | 'throw' = 'ok'
  const brevoSenders: string[] = []
  const recordsWhenBrevoStarted: number[] = []

  const now = new Date('2026-10-23T12:00:00.000Z')
  const userDeps = {
    findUserByEmail: async () => ({ id: userId, phone: '+8801858173601', email: RECIPIENT }),
    findUserByEmailAndPhone: async () => null,
    storeChallenge: async () => {},
    sendSms: async () => ({ ok: false }),
    alreadySent: async (id: string, channel: 'email' | 'phone', at: Date) => sentKeys.has(otpSendKey(id, channel, at)),
    recordSent: async (id: string, channel: 'email' | 'phone', at: Date) => {
      records += 1
      sentKeys.add(otpSendKey(id, channel, at))
    },
    now: () => now,
    generateOtp: () => OTP,
  }

  try {
    for (const name of consoleMethods) {
      console[name] = (...args: unknown[]) => {
        logs.push(args.map((item) => String(item)).join(' '))
      }
    }
    process.env.GMAIL_USER = FROM_ACCOUNT
    process.env.GMAIL_APP_PASSWORD = FAKE_APP_PASSWORD
    process.env.BREVO_API_KEY = FAKE_BREVO_KEY
    process.env.RESEND_API_KEY = 'resend-not-used-for-otp'
    process.env.MAIL_FROM_NOREPLY = NOREPLY
    process.env.EMAIL_FROM = EMAIL_FROM_VALUE
    assert.equal(resolveBrevoOtpFrom(), NOREPLY)

    setGmailTransportFactory(() => ({
      sendMail: async () => {
        gmailAttempts += 1
        if (gmailMode === 'throw') {
          throw new Error(`452 quota ${RECIPIENT} ${OTP} ${FAKE_APP_PASSWORD}`)
        }
        return { messageId: 'gmail-unexpected' }
      },
    }))

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input)
      if (url.includes('resend')) {
        resendHits += 1
        throw new Error('resend disabled')
      }
      assert.equal(url, 'https://api.brevo.com/v3/smtp/email')
      recordsWhenBrevoStarted.push(records)
      const headers = init?.headers as Record<string, string>
      assert.equal(sameText(headers?.['api-key'], FAKE_BREVO_KEY), true)
      const body = JSON.parse(String(init?.body)) as {
        sender: { name: string; email: string }
        to: Array<{ email: string }>
        htmlContent: string
      }
      brevoSenders.push(body.sender.email)
      assert.equal(body.to[0].email, RECIPIENT)
      assert.equal(body.htmlContent.includes(OTP), true)
      if (brevoMode === 'throw') throw new Error('network down')
      if (brevoMode === 'fail') {
        return { ok: false, statusText: 'Bad Request', json: async () => ({ message: 'rejected' }) }
      }
      return { ok: true, statusText: 'Created', json: async () => ({ messageId: 'brevo-test-1' }) }
    }) as typeof fetch

    const beforeMissingPassword = records
    delete process.env.GMAIL_APP_PASSWORD
    gmailMode = 'missing-password'
    userId = 'u-missing-password'
    const viaBrevo = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(viaBrevo.ok, true)
    assert.equal(gmailAttempts, 0)
    assert.equal(recordsWhenBrevoStarted[0], beforeMissingPassword)
    assert.equal(records, beforeMissingPassword + 1)
    assert.equal(brevoSenders[0], 'noreply@lawyerdiarybd.com')
    assert.equal(resendHits, 0)

    const gmailAttemptsAfterAccept = gmailAttempts
    const brevoAfterAccept = brevoSenders.length
    const second = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(second.ok, false)
    if (!second.ok) {
      assert.equal(second.error, 'otp_daily_limit')
      assert.equal(second.messageBn, 'আজকের কোড নেওয়া হয়ে গেছে। কাল আবার চেষ্টা করুন।')
    }
    assert.equal(gmailAttempts, gmailAttemptsAfterAccept)
    assert.equal(brevoSenders.length, brevoAfterAccept)
    assert.equal(records, beforeMissingPassword + 1)

    process.env.GMAIL_APP_PASSWORD = FAKE_APP_PASSWORD
    gmailMode = 'throw'
    brevoMode = 'fail'
    userId = 'u-both-fail'
    const beforeBothFail = records
    const gmailBeforeBothFail = gmailAttempts
    const rejected = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(rejected.ok, false)
    if (!rejected.ok) {
      assert.equal(rejected.error, 'email_failed')
      assert.equal(rejected.messageBn, OTP_EMAIL_FAILED_MESSAGE_BN)
      assert.equal(rejected.messageBn, 'ইমেইল পাঠানো যায়নি। আবার চেষ্টা করুন।')
    }
    assert.equal(gmailAttempts, gmailBeforeBothFail + 1)
    assert.equal(recordsWhenBrevoStarted.at(-1), beforeBothFail)
    assert.equal(records, beforeBothFail)

    brevoMode = 'throw'
    const network = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(network.ok, false)
    if (!network.ok) assert.equal(network.messageBn, OTP_EMAIL_FAILED_MESSAGE_BN)
    assert.equal(records, beforeBothFail)
    assert.equal(recordsWhenBrevoStarted.at(-1), beforeBothFail)

    brevoMode = 'ok'
    const retried = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(retried.ok, true)
    assert.equal(records, beforeBothFail + 1)
    assert.equal(recordsWhenBrevoStarted.at(-1), beforeBothFail)

    delete process.env.MAIL_FROM_NOREPLY
    assert.equal(resolveBrevoOtpFrom(), EMAIL_FROM_VALUE)
    userId = 'u-email-from'
    const fromEmailFrom = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(fromEmailFrom.ok, true)
    assert.equal(brevoSenders.at(-1), 'fallback@lawyerdiarybd.com')

    delete process.env.EMAIL_FROM
    assert.equal(resolveBrevoOtpFrom(), FROM_ACCOUNT)
    userId = 'u-gmail-from'
    const fromGmailUser = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(fromGmailUser.ok, true)
    assert.equal(brevoSenders.at(-1), FROM_ACCOUNT)

    delete process.env.BREVO_API_KEY
    delete process.env.GMAIL_APP_PASSWORD
    userId = 'u-no-brevo-key'
    const brevoBeforeMissingKey = brevoSenders.length
    const beforeMissingKey = records
    const missingKey = await issuePasswordOtp({ channel: 'email', email: RECIPIENT }, userDeps)
    assert.equal(missingKey.ok, false)
    if (!missingKey.ok) assert.equal(missingKey.messageBn, OTP_EMAIL_FAILED_MESSAGE_BN)
    assert.equal(brevoSenders.length, brevoBeforeMissingKey)
    assert.equal(records, beforeMissingKey)
    assert.equal(resendHits, 0)

    const leakedPassword = logs.some((line) => line.includes(FAKE_APP_PASSWORD))
    const leakedBrevo = logs.some((line) => line.includes(FAKE_BREVO_KEY))
    const leakedRecipient = logs.some((line) => line.includes(RECIPIENT))
    const leakedOtp = logs.some((line) => line.includes(OTP))
    const leakedSavedPassword =
      Boolean(saved.GMAIL_APP_PASSWORD) && logs.some((line) => line.includes(saved.GMAIL_APP_PASSWORD as string))
    const leakedSavedBrevo =
      Boolean(saved.BREVO_API_KEY) && logs.some((line) => line.includes(saved.BREVO_API_KEY as string))
    assert.equal(leakedPassword, false)
    assert.equal(leakedBrevo, false)
    assert.equal(leakedRecipient, false)
    assert.equal(leakedOtp, false)
    assert.equal(leakedSavedPassword, false)
    assert.equal(leakedSavedBrevo, false)
  } finally {
    setGmailTransportFactory(null)
    globalThis.fetch = previousFetch
    for (const name of consoleMethods) console[name] = savedConsole[name]
    for (const name of ENV_NAMES) restore(name, saved[name])
  }
})
