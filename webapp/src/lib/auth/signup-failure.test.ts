import assert from 'node:assert/strict'
import test from 'node:test'
import {
  kSignupDatabaseMessage,
  kSignupMissingSecretMessage,
  kSignupUnexpectedMessage,
  signupFailureMessage,
} from './signup-failure'

test('missing signing secret becomes a clear Bangla message', () => {
  const env = { JWT_SECRET: '' } as NodeJS.ProcessEnv
  assert.equal(signupFailureMessage(new Error('secretOrPrivateKey must have a value'), env), kSignupMissingSecretMessage)
  assert.equal(signupFailureMessage(new Error('boom'), env), kSignupMissingSecretMessage)
})

test('a present secret still explains a jwt key failure', () => {
  const env = { JWT_SECRET: 'test-secret' } as NodeJS.ProcessEnv
  assert.equal(
    signupFailureMessage(new Error('secretOrPrivateKey must have a value'), env),
    kSignupMissingSecretMessage,
  )
})

test('a missing table is not the vague client fallback', () => {
  const env = { JWT_SECRET: 'test-secret' } as NodeJS.ProcessEnv
  const err = Object.assign(new Error('The table `public.User` does not exist in the current database.'), {
    code: 'P2021',
  })
  const message = signupFailureMessage(err, env)
  assert.equal(message, kSignupDatabaseMessage)
  assert.equal(message.includes('তথ্য ঠিক করে'), false)
})

test('any other throw still returns a Bangla message string', () => {
  const env = { JWT_SECRET: 'test-secret' } as NodeJS.ProcessEnv
  const message = signupFailureMessage(new Error('signup conflict lookup failed'), env)
  assert.equal(typeof message, 'string')
  assert.equal(message, kSignupUnexpectedMessage)
})
