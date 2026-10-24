import assert from 'node:assert/strict'
import test from 'node:test'
import { hearingDigestPayload, leadIncomingPayload, premiumPayload } from '../fcm/payload'
import { sendShelfPush, shelfPushMessage } from './fcm'

const SECRET_ENV = [
  'SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'GOOGLE_APPLICATION_CREDENTIALS',
] as const

test('shelfaware send path keeps stored reminder text and does not send without credentials', async () => {
  const prev = new Map(SECRET_ENV.map((key) => [key, process.env[key]]))
  for (const key of SECRET_ENV) delete process.env[key]
  try {
    const message = shelfPushMessage({
      title: 'মেয়াদ শেষ',
      body: 'দুধ আজ শেষ',
      itemKey: 'item-1',
    })
    assert.equal(message.notification.title, 'মেয়াদ শেষ')
    assert.equal(message.notification.body, 'দুধ আজ শেষ')
    assert.equal(message.data.type, 'expiry_reminder')
    const emptyBody = shelfPushMessage({ title: 'মেয়াদ শেষ', body: '', itemKey: 'item-1' })
    assert.equal(emptyBody.notification.body, 'মেয়াদ শেষ')
    const result = await sendShelfPush({
      token: 'dry-run-not-a-device-token',
      title: message.notification.title,
      body: message.notification.body,
      itemKey: 'item-1',
    })
    assert.equal(result, 'unconfigured')
  } finally {
    for (const key of SECRET_ENV) {
      const value = prev.get(key)
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('mamlaq send path uses its templates and does not send without credentials', async () => {
  const prev = new Map(SECRET_ENV.map((key) => [key, process.env[key]]))
  for (const key of SECRET_ENV) delete process.env[key]
  try {
    const hearing = hearingDigestPayload({
      offset: 0,
      count: 2,
      userId: '11111111-1111-1111-1111-111111111111',
      ymd: '2026-09-08',
    })
    const tomorrow = hearingDigestPayload({
      offset: 1,
      count: 1,
      userId: '11111111-1111-1111-1111-111111111111',
      ymd: '2026-09-08',
    })
    const premium = premiumPayload({
      offset: 4,
      endsYmd: '2026-09-12',
      userId: '11111111-1111-1111-1111-111111111111',
    })
    const lead = leadIncomingPayload({ userId: 'u1', appointmentId: 'a1' })
    assert.equal(hearing.title, 'আজকের শুনানি')
    assert.equal(hearing.body, '2টি মামলার শুনানি আজ')
    assert.equal(tomorrow.title, 'আগামীকালের শুনানি')
    assert.equal(tomorrow.body, '1টি মামলা আগামীকাল')
    assert.equal(premium.title, 'সাবস্ক্রিপশন শেষের কাছাকাছি')
    assert.equal(
      premium.body,
      'আপনার সাবস্ক্রিপশনের শেষ তারিখ 12/9/2026। সুবিধা দেখতে সাবস্ক্রিপশন পাতা খুলুন।',
    )
    assert.equal(lead.title, 'নতুন অ্যাপয়েন্টমেন্ট')
    assert.equal(lead.body, 'একজন ক্লায়েন্ট আপনার সঙ্গে যোগাযোগ করতে চেয়েছেন।')
    const { sendFcmToToken } = await import('../fcm/send')
    const result = await sendFcmToToken({
      token: 'dry-run-not-a-device-token',
      title: hearing.title,
      body: hearing.body,
      data: hearing.data,
    })
    assert.equal(result, 'unconfigured')
  } finally {
    for (const key of SECRET_ENV) {
      const value = prev.get(key)
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
