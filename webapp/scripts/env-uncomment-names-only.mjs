/**
 * Uncomment credential assignments in webapp/.env in place.
 * NEVER prints values. Reports NAMES only: SET vs EMPTY vs COMMENTED_MOVED.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env')

const ALIAS = {
  ZINI_API_KEY: 'ZINIPAY_API_KEY',
  ZINIPAY_KEY: 'ZINIPAY_API_KEY',
  ZINI_PAY_API_KEY: 'ZINIPAY_API_KEY',
  ZINIPAY_SECRET: 'ZINIPAY_API_KEY',
  ZINIPAY_TOKEN: 'ZINIPAY_API_KEY',
  SMS_NETBD_API_KEY: 'SMS_NET_BD_API_KEY',
  SMS_NET_API_KEY: 'SMS_NET_BD_API_KEY',
  SMS_FAILOVER_KEY: 'BULKSMS24_API_KEY',
  BULKSMSBD_API_KEY: 'BULKSMS24_API_KEY',
  GA_MEASUREMENT_ID: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  ADMOB_APP_ID: 'ADMOB_APP_ID',
  ADMOB_NATIVE_ID: 'ADMOB_NATIVE_ID',
  ADMOB_REWARDED_INTERSTITIAL_ID: 'ADMOB_REWARDED_INTERSTITIAL_ID',
}

const INTEREST = new Set([
  'DATABASE_URL',
  'JWT_SECRET',
  'CRON_SECRET',
  'ZINIPAY_API_KEY',
  'ZINI_API_KEY',
  'ZINIPAY_KEY',
  'ZINI_PAY_API_KEY',
  'ZINIPAY_SECRET',
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
  'SMS_NETBD_API_KEY',
  'SMS_NET_API_KEY',
  'SMS_NET_BD_URL',
  'SMS_API_URL',
  'SMS_API_KEY',
  'SMS_SENDER_ID',
  'BULKSMS24_API_KEY',
  'BULKSMS24_URL',
  'SMS_FAILOVER_KEY',
  'SMS_FAILOVER_URL',
  'WABA_TOKEN',
  'WABA_PHONE_NUMBER_ID',
  'ADMOB_APP_ID',
  'ADMOB_NATIVE_ID',
  'ADMOB_REWARDED_INTERSTITIAL_ID',
  'META_PLACEMENT_ID',
  'LIFTOFF_APP_ID',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'BREVO_API_KEY',
  'RESEND_API_KEY',
  'SEED_ADMIN_PASSWORD',
  'CSRF_SECRET',
])

const PLACEHOLDER = /^(your-|change-me|changeme|xxx+|sandbox_test_|g-xxxxxxxx|ca-app-pub-xxxx|https?:\/\/api\.sms-gateway)/i

function parseVal(raw) {
  let v = raw.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  return v.trim()
}

function isSet(v) {
  if (!v) return false
  if (PLACEHOLDER.test(v)) return false
  return true
}

const raw = readFileSync(envPath, 'utf8')
const nl = raw.includes('\r\n') ? '\r\n' : '\n'
const lines = raw.split(/\r?\n/)

const active = new Map()
const commented = []

const assignRe = /^\s*(#)?\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(assignRe)
  if (!m) continue
  const name = m[2]
  const val = parseVal(m[3])
  if (m[1] === '#') {
    commented.push({ i, name, val, hasValue: isSet(val) })
  } else {
    active.set(name, { i, val, set: isSet(val) })
  }
}

const moved = []
const uncommented = []

function ensureActive(canonical, value, fromLine) {
  const cur = active.get(canonical)
  if (cur && cur.set) return
  if (cur) {
    const q = JSON.stringify(value)
    lines[cur.i] = `${canonical}=${q}`
    active.set(canonical, { i: cur.i, val: value, set: true })
    moved.push({ from: fromLine, to: canonical, action: 'filled_empty_active' })
    return
  }
  lines.push(`${canonical}=${JSON.stringify(value)}`)
  active.set(canonical, { i: lines.length - 1, val: value, set: true })
  moved.push({ from: fromLine, to: canonical, action: 'appended_canonical' })
}

for (const c of commented) {
  if (!c.hasValue) continue
  const canonical = ALIAS[c.name] || c.name
  if (!INTEREST.has(c.name) && !INTEREST.has(canonical)) continue
  // Uncomment in place if the same name is not already SET on an active line.
  const sameActive = active.get(c.name)
  if (!sameActive || !sameActive.set) {
    const q = JSON.stringify(c.val)
    lines[c.i] = `${c.name}=${q}`
    uncommented.push(c.name)
    active.set(c.name, { i: c.i, val: c.val, set: true })
  }
  if (canonical !== c.name) {
    ensureActive(canonical, c.val, c.name)
  }
}

// SMS_API_URL used as key when not http — map onto SMS_NET_BD_API_KEY
const smsUrl = active.get('SMS_API_URL')
if (smsUrl?.set && !/^https?:\/\//i.test(smsUrl.val)) {
  ensureActive('SMS_NET_BD_API_KEY', smsUrl.val, 'SMS_API_URL')
}

writeFileSync(envPath, lines.join(nl), 'utf8')

const report = {}
for (const name of [...INTEREST].sort()) {
  const a = active.get(name)
  report[name] = a?.set ? 'SET' : 'EMPTY'
}

console.log(JSON.stringify({
  uncommented_names: uncommented,
  remapped_to_canonical: moved.map((m) => ({ from: m.from, to: m.to, action: m.action })),
  names: report,
}, null, 2))
