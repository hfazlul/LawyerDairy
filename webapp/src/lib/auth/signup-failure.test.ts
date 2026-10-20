import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  kSignupUnexpectedMessage,
  logAuthFailure,
  plainAuthNotice,
  signupFailureMessage,
} from './signup-failure'

const webappRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')

function capture(run: () => void): string {
  const lines: string[] = []
  const original = console.error
  console.error = (...args: unknown[]) => {
    lines.push(args.map((item) => String(item)).join(' '))
  }
  try {
    run()
  } finally {
    console.error = original
  }
  return lines.join('\n')
}

test('missing signing secret stays a plain Bangla retry', () => {
  const env = { JWT_SECRET: '' } as NodeJS.ProcessEnv
  assert.equal(signupFailureMessage(new Error('secretOrPrivateKey must have a value'), env), kSignupUnexpectedMessage)
  assert.equal(signupFailureMessage(new Error('boom'), env), kSignupUnexpectedMessage)
  assert.equal(kSignupUnexpectedMessage.includes('JWT_SECRET'), false)
  assert.equal(kSignupUnexpectedMessage, 'অ্যাকাউন্ট তৈরি হয়নি। আবার চেষ্টা করুন।')
})

test('a jwt key failure does not name the server setting', () => {
  const env = { JWT_SECRET: 'test-secret' } as NodeJS.ProcessEnv
  const message = signupFailureMessage(new Error('secretOrPrivateKey must have a value'), env)
  assert.equal(message, kSignupUnexpectedMessage)
  assert.equal(/JWT|Prisma|টেবিল/.test(message), false)
})

test('a missing table stays the same plain retry', () => {
  const env = { JWT_SECRET: 'test-secret' } as NodeJS.ProcessEnv
  const err = Object.assign(new Error('The table `public.User` does not exist in the current database.'), {
    code: 'P2021',
  })
  const message = signupFailureMessage(err, env)
  assert.equal(message, kSignupUnexpectedMessage)
  assert.equal(message.includes('তথ্য ঠিক করে'), false)
  assert.equal(message.includes('ডাটাবেস'), false)
})

test('any other throw still returns the plain Bangla retry', () => {
  const env = { JWT_SECRET: 'test-secret' } as NodeJS.ProcessEnv
  const message = signupFailureMessage(new Error('signup conflict lookup failed'), env)
  assert.equal(message, kSignupUnexpectedMessage)
})

test('logs that JWT_SECRET is missing and never the secret value', () => {
  const missing = capture(() => {
    logAuthFailure(new Error('secretOrPrivateKey must have a value planted-secret'), { JWT_SECRET: '' } as NodeJS.ProcessEnv, 'signup failed')
  })
  assert.equal(missing, 'signup failed: JWT_SECRET is missing')
  assert.equal(missing.includes('planted-secret'), false)

  const present = capture(() => {
    logAuthFailure(new Error('secretOrPrivateKey must have a value'), { JWT_SECRET: 'real-jwt-value' } as NodeJS.ProcessEnv, 'signup failed')
  })
  assert.equal(present, 'signup failed: JWT_SECRET is missing')
  assert.equal(present.includes('real-jwt-value'), false)
})

test('logs a missing table without database URLs or the signing secret', () => {
  const secret = 'jwt-value-should-not-leak'
  const databaseUrl = 'postgres://lawyer:pw@127.0.0.1:5432/lawyer_diary'
  const env = { JWT_SECRET: secret, DATABASE_URL: databaseUrl } as NodeJS.ProcessEnv
  const err = Object.assign(
    new Error(`The table public.User does not exist ${secret} ${databaseUrl}`),
    { code: 'P2021' },
  )
  const logged = capture(() => logAuthFailure(err, env, 'signup failed'))
  assert.match(logged, /P2021/)
  assert.match(logged, /does not exist/)
  assert.equal(logged.includes(secret), false)
  assert.equal(logged.includes('postgres://'), false)
  assert.equal(logged.includes('lawyer:pw'), false)
})

test('plain notices keep typed-input errors and hide internals', () => {
  const fallback = kSignupUnexpectedMessage
  assert.equal(plainAuthNotice('সেভ হয়নি। এই মোবাইল নম্বরে অ্যাকাউন্ট আছে। লগইন করুন।', fallback), 'সেভ হয়নি। এই মোবাইল নম্বরে অ্যাকাউন্ট আছে। লগইন করুন।')
  assert.equal(plainAuthNotice('নাম বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।', fallback), 'নাম বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।')
  assert.equal(plainAuthNotice('অ্যাকাউন্ট তৈরি হয়নি। সার্ভারে JWT_SECRET সেট করা নেই।', fallback), fallback)
  assert.equal(plainAuthNotice('অ্যাকাউন্ট তৈরি হয়নি। ডাটাবেস টেবিল পাওয়া যায়নি।', fallback), fallback)
  assert.equal(plainAuthNotice('The table `public.User` does not exist in the current database.', fallback), fallback)
})

test('auth responses no longer contain the old technical signup sentences', () => {
  const files = [
    'src/lib/auth/signup-failure.ts',
    'src/api/auth/web-auth.ts',
    'src/api/admin/admin-auth.ts',
    'src/api/mobile/v1/auth/password.ts',
    'app/user/signup/signup-form.tsx',
    'app/hfazlul/signup/admin-signup-form.tsx',
    'app/user/login/login-form.tsx',
    'app/user/forgot/forgot-form.tsx',
  ]
  const banned = ['সার্ভারে JWT_SECRET সেট করা নেই', 'ডাটাবেস টেবিল পাওয়া যায়নি']
  for (const rel of files) {
    const src = readFileSync(join(webappRoot, rel), 'utf8')
    for (const phrase of banned) {
      assert.equal(src.includes(phrase), false, `${rel} contains ${phrase}`)
    }
  }
})
