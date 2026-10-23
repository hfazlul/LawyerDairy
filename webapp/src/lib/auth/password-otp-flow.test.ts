import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { OTP_TTL_MS } from './password-otp'
import { issuePasswordOtp, OTP_ACCOUNT_MISMATCH_BN, OTP_DAILY_LIMIT_BN } from './issue-password-otp'
import { otpSendKey } from './password-otp-quota'

const hint =
  'মোবাইলে ওটিপি না এলে পেছনে গিয়ে ইমেইল বেছে নিন। ইমেইল বাটনে চাপ দিয়ে ইমেইল দিয়ে ওটিপি নিন।'

test('password OTP lasts 5 minutes and the phone hint is only on the phone step', () => {
  assert.equal(OTP_TTL_MS, 300000)
  const form = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../../app/user/forgot/forgot-form.tsx'),
    'utf8',
  )
  assert.match(form, /const OTP_SECONDS = 5 \* 60/)
  assert.doesNotMatch(form, /১০ মিনিট/)
  assert.match(form, /channel === 'phone' \? <PhoneOtpHint \/> : null/)
  assert.equal(form.includes(hint), true)
  const emailBranch = form.slice(form.indexOf("channel === 'email'"), form.indexOf("channel === 'phone'"))
  assert.equal(emailBranch.includes('PhoneOtpHint'), false)
})

test('phone mismatch never sends SMS and email OTP never sends SMS', async () => {
  let sms = 0
  let email = 0
  const deps = {
    findUserByEmail: async () => null,
    findUserByEmailAndPhone: async () => null,
    storeChallenge: async () => {
      throw new Error('no challenge')
    },
    sendSms: async () => {
      sms += 1
      return { ok: true }
    },
    sendEmail: async () => {
      email += 1
      return { ok: true }
    },
    alreadySent: async () => false,
    recordSent: async () => {},
    now: () => new Date('2026-10-23T00:00:00Z'),
    generateOtp: () => '482913',
  }

  const missing = await issuePasswordOtp(
    { channel: 'phone', email: 'a@b.com', phone: '01858173601' },
    deps,
  )
  assert.equal(missing.ok, false)
  if (!missing.ok) {
    assert.equal(missing.error, 'mismatch')
    assert.equal(missing.messageBn, OTP_ACCOUNT_MISMATCH_BN)
  }
  assert.equal(sms, 0)

  const unknownEmail = await issuePasswordOtp({ channel: 'email', email: 'missing@mail.com' }, deps)
  assert.equal(unknownEmail.ok, true)
  assert.equal(sms, 0)
  assert.equal(email, 0)

  const mailed = await issuePasswordOtp(
    { channel: 'email', email: 'a@b.com' },
    {
      ...deps,
      findUserByEmail: async () => ({ id: 'u1', phone: '+8801858173601', email: 'a@b.com' }),
      storeChallenge: async () => {},
    },
  )
  assert.equal(mailed.ok, true)
  assert.equal(sms, 0)
  assert.equal(email, 1)
})

test('one email OTP and one phone OTP per Asia/Dhaka day, counted only after a real handoff', async () => {
  const sent = new Set<string>()
  let emailCalls = 0
  let smsCalls = 0
  let records = 0
  let emailOk = false
  let smsOk = true
  let clock = new Date('2026-10-23T12:00:00.000Z')
  const user = { id: 'u1', phone: '+8801858173601', email: 'person@example.com' }
  const deps = {
    findUserByEmail: async () => user,
    findUserByEmailAndPhone: async () => user,
    storeChallenge: async () => {},
    sendEmail: async () => {
      emailCalls += 1
      return { ok: emailOk }
    },
    sendSms: async () => {
      smsCalls += 1
      return { ok: smsOk }
    },
    alreadySent: async (userId: string, channel: 'email' | 'phone', now: Date) =>
      sent.has(otpSendKey(userId, channel, now)),
    recordSent: async (userId: string, channel: 'email' | 'phone', now: Date) => {
      records += 1
      sent.add(otpSendKey(userId, channel, now))
    },
    now: () => clock,
    generateOtp: () => '482913',
  }

  assert.notEqual(
    otpSendKey('u1', 'email', new Date('2026-10-23T17:59:59.000Z')),
    otpSendKey('u1', 'email', new Date('2026-10-23T18:00:00.000Z')),
  )
  assert.notEqual(otpSendKey('u1', 'email', clock), otpSendKey('u1', 'phone', clock))

  const failedEmail = await issuePasswordOtp({ channel: 'email', email: user.email }, deps)
  assert.equal(failedEmail.ok, false)
  assert.equal(emailCalls, 1)
  assert.equal(records, 0)

  emailOk = true
  const emailed = await issuePasswordOtp({ channel: 'email', email: user.email }, deps)
  assert.equal(emailed.ok, true)
  assert.equal(emailCalls, 2)
  assert.equal(records, 1)

  const secondEmail = await issuePasswordOtp({ channel: 'email', email: user.email }, deps)
  assert.equal(secondEmail.ok, false)
  if (!secondEmail.ok) {
    assert.equal(secondEmail.error, 'otp_daily_limit')
    assert.equal(secondEmail.messageBn, OTP_DAILY_LIMIT_BN)
    assert.equal(secondEmail.messageBn, 'আজকের কোড নেওয়া হয়ে গেছে। কাল আবার চেষ্টা করুন।')
  }
  assert.equal(emailCalls, 2)
  assert.equal(smsCalls, 0)

  const phoned = await issuePasswordOtp(
    { channel: 'phone', email: user.email, phone: '01858173601' },
    deps,
  )
  assert.equal(phoned.ok, true)
  assert.equal(smsCalls, 1)
  assert.equal(records, 2)

  const secondPhone = await issuePasswordOtp(
    { channel: 'phone', email: user.email, phone: '01858173601' },
    deps,
  )
  assert.equal(secondPhone.ok, false)
  if (!secondPhone.ok) assert.equal(secondPhone.messageBn, OTP_DAILY_LIMIT_BN)
  assert.equal(smsCalls, 1)

  smsOk = false
  clock = new Date('2026-10-23T18:30:00.000Z')
  const nextDayFail = await issuePasswordOtp(
    { channel: 'phone', email: user.email, phone: '01858173601' },
    deps,
  )
  assert.equal(nextDayFail.ok, false)
  assert.equal(smsCalls, 2)
  assert.equal(records, 2)

  smsOk = true
  const nextDay = await issuePasswordOtp(
    { channel: 'phone', email: user.email, phone: '01858173601' },
    deps,
  )
  assert.equal(nextDay.ok, true)
  assert.equal(smsCalls, 3)
  assert.equal(records, 3)
})
