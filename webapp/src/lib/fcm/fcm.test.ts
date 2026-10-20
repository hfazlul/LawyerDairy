import assert from 'node:assert/strict'
import test from 'node:test'
import { hearingOffset, premiumOffset, canPushDevice, isUnregisteredFcmError } from './logic'
import {
  hearingDigestPayload,
  premiumPayload,
  stringifyFcmData,
  isHighPriorityKind,
  PREMIUM_NEAR_TITLE,
} from './payload'
import { addYmd, diffYmd } from './dhaka'
import { fcmConfigured, parseServiceAccountJson } from './config'

test('hearing D-0 / D-1 offsets vs Dhaka ymd', () => {
  assert.equal(hearingOffset('2026-09-08', '2026-09-08'), 0)
  assert.equal(hearingOffset('2026-09-09', '2026-09-08'), 1)
  assert.equal(hearingOffset('2026-09-10', '2026-09-08'), null)
  assert.equal(addYmd('2026-09-08', 1), '2026-09-09')
  assert.equal(diffYmd('2026-09-12', '2026-09-08'), 4)
})

test('subscription D-4 / D-3 only', () => {
  assert.equal(premiumOffset('2026-09-12', '2026-09-08'), 4)
  assert.equal(premiumOffset('2026-09-12', '2026-09-09'), 3)
  assert.equal(premiumOffset('2026-09-12', '2026-09-10'), null)
  assert.equal(premiumOffset('2026-09-08', '2026-09-08'), null)
})

test('skip push when master off or no token', () => {
  assert.equal(
    canPushDevice({ pushToken: 'abc', pushEnabled: true, revokedAt: null }),
    true,
  )
  assert.equal(
    canPushDevice({ pushToken: 'abc', pushEnabled: false, revokedAt: null }),
    false,
  )
  assert.equal(
    canPushDevice({ pushToken: null, pushEnabled: true, revokedAt: null }),
    false,
  )
  assert.equal(
    canPushDevice({ pushToken: 'abc', pushEnabled: true, revokedAt: new Date() }),
    false,
  )
})

test('typed FCM data has routeName not a URL; no phone; no buy CTA', () => {
  const hearing = hearingDigestPayload({
    offset: 0,
    count: 2,
    userId: '11111111-1111-1111-1111-111111111111',
    ymd: '2026-09-08',
  })
  assert.equal(hearing.data.routeName, 'diary')
  assert.equal(hearing.data.kind, 'hearing.today')
  const data = stringifyFcmData(hearing.data)
  assert.equal(data.routeName, 'diary')
  assert.equal(Object.values(data).some((v) => v.includes('https://')), false)
  assert.equal(isHighPriorityKind('hearing.today'), true)
  assert.equal(isHighPriorityKind('premium.d3'), true)

  const one = hearingDigestPayload({
    offset: 1,
    count: 1,
    caseId: '22222222-2222-2222-2222-222222222222',
    userId: '11111111-1111-1111-1111-111111111111',
    ymd: '2026-09-08',
  })
  assert.equal(one.data.routeName, 'case')
  assert.equal(one.data.caseId, '22222222-2222-2222-2222-222222222222')

  const prem = premiumPayload({
    offset: 4,
    endsYmd: '2026-09-12',
    userId: '11111111-1111-1111-1111-111111111111',
  })
  assert.equal(prem.data.routeName, 'premium')
  assert.equal(prem.title, PREMIUM_NEAR_TITLE)
  assert.equal(prem.body.includes('নবায়ন'), false)
  assert.equal(prem.body.includes('কিনুন'), false)
  assert.equal(/\+880|01[3-9]\d{8}/.test(prem.body), false)
})

test('invalid FCM token errors are detected without logging secrets', () => {
  assert.equal(
    isUnregisteredFcmError({ code: 'messaging/registration-token-not-registered' }),
    true,
  )
  assert.equal(isUnregisteredFcmError({ code: 'messaging/internal-error' }), false)
  assert.equal(isUnregisteredFcmError(new Error('UNREGISTERED')), true)
})

test('FCM credentials are off unless env is set; JSON parse does not throw', () => {
  const prevJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const prevPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS
  assert.equal(fcmConfigured(), false)
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{not-json'
  assert.equal(parseServiceAccountJson(), null)
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{"project_id":"mamlaq-lawyer-diary"}'
  assert.equal(parseServiceAccountJson()?.project_id, 'mamlaq-lawyer-diary')
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = prevJson
  process.env.GOOGLE_APPLICATION_CREDENTIALS = prevPath
})
