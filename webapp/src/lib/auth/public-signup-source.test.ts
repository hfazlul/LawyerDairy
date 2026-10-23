import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { kSignupPasswordHelper } from '../identity'

const signupDir = join(dirname(fileURLToPath(import.meta.url)), '../../../app/user/signup')
const page = readFileSync(join(signupDir, 'page.tsx'), 'utf8')
const form = readFileSync(join(signupDir, 'signup-form.tsx'), 'utf8')

test('public /user/signup renders the phone form from this route', () => {
  assert.match(page, /from '\.\/signup-form'/)
  assert.doesNotMatch(page, /AuthShell/)
  assert.doesNotMatch(form, /ভাষা/)
  assert.doesNotMatch(form, /শর্তাবলী/)
  assert.doesNotMatch(form, /<select/)
  assert.doesNotMatch(form, /type="checkbox"/)
  assert.match(form, />Name</)
  assert.match(form, />Mobile</)
  assert.match(form, />Password</)
  assert.match(form, />Email</)
  assert.match(form, />Referral \(Optional\)</)
  assert.match(form, /অ্যাকাউন্ট তৈরি করুন/)
  assert.match(form, /acceptedTerms:\s*true/)
  assert.match(form, /value="true"/)
  assert.match(form, /kSignupPasswordHelper/)
  assert.equal(kSignupPasswordHelper, 'Use at least 6 numbers (123) or above. No more than 10.')
})
