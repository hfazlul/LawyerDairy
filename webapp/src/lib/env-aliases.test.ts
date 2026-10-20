import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bulkSms24KeyFromEnv,
  looksLikeKeyNotUrl,
  looksLikeUrl,
  missingSecretNames,
  publicAppUrlFromEnv,
  smsNetBdKeyFromEnv,
  smsNetBdUrlFromEnv,
  zinipayApiKeyFromEnv,
} from './env-aliases'

const NAMES = [
  'ZINIPAY_API_KEY',
  'ZINI_API_KEY',
  'ZINIPAY_KEY',
  'PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_URL',
  'SMS_NET_BD_API_KEY',
  'SMS_NETBD_API_KEY',
  'SMS_API_URL',
  'SMS_API_KEY',
  'BULKSMS24_API_KEY',
  'SMS_FAILOVER_KEY',
  'SMS_NET_BD_URL',
]

function stash(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const n of NAMES) out[n] = process.env[n]
  return out
}

function restore(prev: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(prev)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
}

function clear() {
  for (const n of NAMES) delete process.env[n]
}

test('ZINI_API_KEY aliases ZINIPAY_API_KEY', () => {
  const prev = stash()
  clear()
  process.env.ZINI_API_KEY = 'alias-zini-key-value-16'
  assert.equal(zinipayApiKeyFromEnv(), 'alias-zini-key-value-16')
  restore(prev)
})

test('SMS_API_URL holding a key (not a URL) is treated as sms.net.bd key', () => {
  const prev = stash()
  clear()
  process.env.SMS_API_URL = 'smsnet-comment-style-key-16x'
  process.env.SMS_API_KEY = 'your-sms-api-key'
  assert.equal(looksLikeKeyNotUrl(process.env.SMS_API_URL!), true)
  assert.equal(looksLikeUrl(process.env.SMS_API_URL!), false)
  assert.equal(smsNetBdKeyFromEnv(), 'smsnet-comment-style-key-16x')
  assert.equal(smsNetBdUrlFromEnv(), 'https://api.sms.net.bd/sendsms')
  restore(prev)
})

test('SMS_NETBD_API_KEY alias and 24bulksms failover alias', () => {
  const prev = stash()
  clear()
  process.env.SMS_NETBD_API_KEY = 'netbd-alias-key-16xx'
  process.env.SMS_FAILOVER_KEY = 'bulk-alias-key-16xxxx'
  assert.equal(smsNetBdKeyFromEnv(), 'netbd-alias-key-16xx')
  assert.equal(bulkSms24KeyFromEnv(), 'bulk-alias-key-16xxxx')
  restore(prev)
})

test('NEXT_PUBLIC_APP_URL aliases PUBLIC_APP_URL; placeholders are missing', () => {
  const prev = stash()
  clear()
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  process.env.SMS_API_URL = 'https://api.sms-gateway.com/send'
  process.env.SMS_API_KEY = 'your-sms-api-key'
  assert.equal(publicAppUrlFromEnv(), 'http://localhost:3000')
  const missing = missingSecretNames()
  assert.ok(missing.includes('ZINIPAY_API_KEY'))
  assert.ok(missing.includes('SMS_NET_BD_API_KEY'))
  assert.ok(missing.includes('BULKSMS24_API_KEY'))
  restore(prev)
})
