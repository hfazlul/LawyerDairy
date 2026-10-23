import assert from 'node:assert/strict'
import test from 'node:test'
import { otpRequestMessage } from './auth/password-otp'
import { smsSegments } from './credits'
import { codePointLength, formatHearingDate, hearingSms } from './hearing-sms'

test('forgot-password SMS uses the provider-whitelisted format', () => {
  const text = otpRequestMessage('482913')
  assert.equal(
    text,
    'MAMLAQ-Lawyer Dairy\nYour forgot password 6 digit OTP is 482913\nmamlaq.com',
  )
  assert.equal(text.includes('123456'), false)
})

test('hearing SMS uses জনাব or জনাবা and stays within 70 code points', () => {
  const male = hearingSms({
    client: 'করিম',
    date: formatHearingDate(25, 10),
    court: 'ঢাকা',
    lawyer: 'রহিম',
  })
  const female = hearingSms({
    gender: 'female',
    client: 'করিম',
    date: '২৫ অক্টো',
    court: 'ঢাকা',
    lawyer: 'রহিম',
  })
  assert.equal(formatHearingDate(25, 10), '২৫ অক্টো')
  assert.match(male, /^জনাব করিম, কেসের শুনানি ২৫ অক্টো, ঢাকা আদালত। উকিল রহিম।$/)
  assert.match(female, /^জনাবা /)
  assert.ok(codePointLength(male) <= 70)
  assert.ok(codePointLength(female) <= 70)
  assert.equal(smsSegments(male), 1)
  assert.doesNotMatch(male, /MAMLAQ/)
  assert.doesNotMatch(male, /দেওয়ানি/)
})

test('long hearing names shrink only on word boundaries', () => {
  const client = 'মোঃ আব্দুল করিম উদ্দিন চৌধুরী'
  const lawyer = 'মোহাম্মদ ফজলুল হক শিকদার'
  const text = hearingSms({
    client,
    date: '২৫ অক্টো',
    court: 'ঢাকা',
    lawyer,
  })
  assert.ok(codePointLength(text) <= 70)
  assert.match(text, /জনাব /)
  assert.match(text, /আদালত। উকিল/)
  const allowed = new Set(
    `${client} ${lawyer} জনাব কেসের শুনানি ২৫ অক্টো ঢাকা আদালত উকিল`.split(/\s+/),
  )
  for (const token of text.replace(/[।,]/g, ' ').split(/\s+/).filter(Boolean)) {
    assert.equal(allowed.has(token), true, token)
  }
})
