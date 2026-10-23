import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { OTP_TTL_MS } from './password-otp'
import { issuePasswordOtp, OTP_ACCOUNT_MISMATCH_BN } from './issue-password-otp'

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
