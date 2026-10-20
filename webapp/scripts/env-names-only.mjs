/**
 * Names-only .env report. NEVER prints values, lengths, or prefixes.
 * State: SET | EMPTY | COMMENTED_SET | COMMENTED_EMPTY
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env')

const INTEREST = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CRON_SECRET',
  'ZINIPAY_API_KEY',
  'ZINI_API_KEY',
  'ZINIPAY_KEY',
  'ZINI_PAY_API_KEY',
  'ZINIPAY_SECRET',
  'ZINI_PAY_KEY',
  'ZINIPAY_TOKEN',
  'ZINIPAY_API_KEY_HEADER',
  'ZINIPAY_WEBHOOK_SECRET',
  'ZINIPAY_BASE_URL',
  'ZINIPAY_ALLOW_SANDBOX',
  'PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'SMS_NET_BD_API_KEY',
  'SMS_API_URL',
  'SMS_SENDER_ID',
  'BULKSMS24_API_KEY',
  'WABA_TOKEN',
  'WABA_PHONE_NUMBER_ID',
  'ADMOB_APP_ID',
  'ADMOB_NATIVE_ID',
  'ADMOB_REWARDED_INTERSTITIAL_ID',
  'META_PLACEMENT_ID',
  'LIFTOFF_APP_ID',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'BREVO_API_KEY',
  'RESEND_API_KEY',
  'SEED_ADMIN_PASSWORD',
]

const ALIAS = {
  ZINI_API_KEY: 'ZINIPAY_API_KEY',
  ZINIPAY_KEY: 'ZINIPAY_API_KEY',
  ZINI_PAY_API_KEY: 'ZINIPAY_API_KEY',
  ZINI_PAY_KEY: 'ZINIPAY_API_KEY',
  ZINIPAY_SECRET: 'ZINIPAY_API_KEY',
  ZINIPAY_TOKEN: 'ZINIPAY_API_KEY',
}

function parseVal(raw) {
  let v = raw.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  return v.trim()
}

function hasValue(v) {
  return Boolean(v)
}

const raw = readFileSync(envPath, 'utf8')
const nl = raw.includes('\r\n') ? '\r\n' : '\n'
const lines = raw.split(/\r?\n/)
const assignRe = /^\s*(#)?\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/

const rows = []
const uncommented = []

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(assignRe)
  if (!m) continue
  const commented = m[1] === '#'
  const name = m[2]
  const val = parseVal(m[3])
  if (!INTEREST.includes(name) && !(name in ALIAS)) continue
  rows.push({ i, name, commented, set: hasValue(val) })
}

// Uncomment ZiniPay-family lines that have a value (in .env only).
for (const r of rows) {
  if (!r.commented || !r.set) continue
  const canon = ALIAS[r.name] || r.name
  if (canon !== 'ZINIPAY_API_KEY' && r.name !== 'ZINIPAY_API_KEY' && r.name !== 'ZINIPAY_ALLOW_SANDBOX') {
    continue
  }
  const m = lines[r.i].match(assignRe)
  if (!m) continue
  lines[r.i] = `${m[2]}=${m[3].trim()}`
  r.commented = false
  uncommented.push(r.name)
}

if (uncommented.length) {
  writeFileSync(envPath, lines.join(nl), 'utf8')
}

const names = {}
for (const name of INTEREST) {
  const hits = rows.filter((r) => r.name === name)
  if (!hits.length) {
    names[name] = 'EMPTY'
    continue
  }
  if (hits.some((r) => !r.commented && r.set)) names[name] = 'SET'
  else if (hits.some((r) => r.commented && r.set)) names[name] = 'COMMENTED_SET'
  else names[name] = 'EMPTY'
}

const ziniSet = ['ZINIPAY_API_KEY', 'ZINI_API_KEY', 'ZINIPAY_KEY', 'ZINI_PAY_API_KEY', 'ZINIPAY_SECRET', 'ZINI_PAY_KEY', 'ZINIPAY_TOKEN']
  .some((n) => names[n] === 'SET')

console.log(JSON.stringify({
  uncommented_names: uncommented,
  zinipay_canonical: ziniSet ? 'SET' : 'EMPTY',
  names,
}, null, 2))
