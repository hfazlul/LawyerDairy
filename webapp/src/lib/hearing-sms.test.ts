import assert from 'node:assert/strict'
import test from 'node:test'
import { otpRequestMessage } from './auth/password-otp'
import { HEARING_SMS_DEMO, hearingReminderSms } from './hearing-sms'

test('forgot-password SMS keeps MAMLAQ and has no URL', () => {
  const text = otpRequestMessage('482913')
  assert.equal(
    text,
    'MAMLAQ-Lawyer Dairy\nYour 6 digit code is : 482913',
  )
  assert.equal(text.includes('123456'), false)
})

test('hearing reminder keeps every field and the mamlaq.com footer', () => {
  const text = hearingReminderSms({
    ...HEARING_SMS_DEMO,
    lawyerName: 'আব্দুল করিম',
    chamberName: 'করিম চেম্বার',
    appearanceTime: 'সকাল ১০টা',
  })
  assert.match(text, /মক্কেল: করিম উদ্দিন \(নমুনা\)/)
  assert.match(text, /মামলা: দেওয়ানি ১২৩\/২০২৬ \(নমুনা\)/)
  assert.match(text, /আদালত: ঢাকা জজ আদালত \(নমুনা\)/)
  assert.match(text, /শুনানি: ২২\/১০\/২০২৬ \(নমুনা\)/)
  assert.match(text, /আইনজীবী: আব্দুল করিম/)
  assert.match(text, /চেম্বার: করিম চেম্বার/)
  assert.match(text, /সময়: সকাল ১০টা/)
  assert.ok(text.endsWith('MAMLAQ\nhttps://mamlaq.com'))
  assert.ok(text.length > 160)
})
