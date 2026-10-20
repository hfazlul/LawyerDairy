import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  emailFieldIssue,
  kLoginEmptyMessage,
  kLoginUnknownMessage,
  kLoginWrongPasswordMessage,
  kPhoneNotRegisteredMessage,
  passwordIssues,
  phoneFieldIssue,
  signupEmailIssue,
  signupNameIssue,
  signupPasswordIssue,
  signupPhoneIssue,
} from './identity'

describe('auth field rules', () => {
  it('accepts a 6 character password and rejects a shorter one', () => {
    assert.equal(passwordIssues('628449'), null)
    assert.match(passwordIssues('12345') || '', /৬ অক্ষর/)
  })

  it('accepts only an 11 digit 01 mobile', () => {
    assert.equal(phoneFieldIssue('01712345678'), null)
    assert.match(phoneFieldIssue('1712345678') || '', /১১ সংখ্যা/)
    assert.match(phoneFieldIssue('0171234567') || '', /১১ সংখ্যা/)
    assert.match(phoneFieldIssue('017123456789') || '', /১১ সংখ্যা/)
  })

  it('checks optional email shape', () => {
    assert.equal(emailFieldIssue(''), null)
    assert.equal(emailFieldIssue('example@mail.com'), null)
    assert.match(emailFieldIssue('not-an-email') || '', /example@mail.com/)
  })

  it('signup name is letters and spaces only', () => {
    assert.equal(signupNameIssue('Rahim Khan'), null)
    assert.equal(signupNameIssue('রাহিম'), null)
    assert.equal(signupNameIssue('Rahim1'), 'Text only.')
    assert.equal(signupNameIssue('Rahim-Khan'), 'Text only.')
    assert.equal(signupNameIssue(''), 'Text only.')
  })

  it('signup phone is an 11 digit 01 number', () => {
    assert.equal(signupPhoneIssue('01712345678'), null)
    assert.equal(signupPhoneIssue('01112345678'), 'ফোন নম্বর ১১ সংখ্যার হতে হবে এবং ০১ দিয়ে শুরু হবে।')
    assert.equal(signupPhoneIssue('1712345678'), 'ফোন নম্বর ১১ সংখ্যার হতে হবে এবং ০১ দিয়ে শুরু হবে।')
    assert.equal(signupPhoneIssue('017-1234-5678'), 'ফোন নম্বর ১১ সংখ্যার হতে হবে এবং ০১ দিয়ে শুরু হবে।')
  })

  it('signup email requires @ and .com only when typed', () => {
    assert.equal(signupEmailIssue(''), null)
    assert.equal(signupEmailIssue('a@b.com'), null)
    assert.equal(signupEmailIssue('a@b.COM'), null)
    assert.equal(signupEmailIssue('user@mail.org'), 'ইমেইলে @ এবং .com থাকতে হবে।')
    assert.equal(signupEmailIssue('not-an-email'), 'ইমেইলে @ এবং .com থাকতে হবে।')
  })

  it('signup password is 6 to 10 digits and does not change the login rule', () => {
    assert.equal(signupPasswordIssue('123456'), null)
    assert.equal(signupPasswordIssue('1234567890'), null)
    assert.equal(signupPasswordIssue('12345'), 'পাসওয়ার্ড ৬ থেকে ১০ সংখ্যা হতে হবে।')
    assert.equal(signupPasswordIssue('12345678901'), 'পাসওয়ার্ড ৬ থেকে ১০ সংখ্যা হতে হবে।')
    assert.equal(signupPasswordIssue('abcdef'), 'পাসওয়ার্ড ৬ থেকে ১০ সংখ্যা হতে হবে।')
    assert.equal(passwordIssues('abcdef'), null)
  })

  it('keeps the public login and forgot-password messages', () => {
    assert.equal(kLoginEmptyMessage, 'নাম ও পাসওয়ার্ড দিন।')
    assert.equal(kLoginUnknownMessage, 'নাম বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।')
    assert.equal(kLoginWrongPasswordMessage, 'পাসওয়ার্ড ভুল।')
    assert.equal(kPhoneNotRegisteredMessage, 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট নেই।')
  })
})
