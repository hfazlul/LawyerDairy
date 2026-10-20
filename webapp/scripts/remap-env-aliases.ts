/**
 * Local .env: lift commented portal keys onto named vars the code reads.
 * Never prints values. Never commits. Comments are not loaded by dotenv.
 *
 * Recognized owner mix-ups:
 *   # SMS_API_URL="<key>" near portal.sms.net.bd  → SMS_NET_BD_API_KEY
 *   # Your Api key is: <key> near 24bulksmsbd     → BULKSMS24_API_KEY
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env')

function upsertNamed(src: string, name: string, value: string): string {
  const line = `${name}=${JSON.stringify(value)}`
  const re = new RegExp(`^${name}=.*$`, 'm')
  if (re.test(src)) return src.replace(re, line)
  return `${src.trimEnd()}\n${line}\n`
}

function namedValue(src: string, name: string): string {
  const m = src.match(new RegExp(`^${name}="?([^"\\n]*)"?\\s*$`, 'm'))
  return (m?.[1] || '').trim()
}

function looksPlaceholder(v: string): boolean {
  return !v || /your-sms-api-key|sms-gateway\.com|change-me/i.test(v)
}

const actions: string[] = []

if (!existsSync(envPath)) {
  console.log('NO_FILE')
  process.exit(0)
}

let src = readFileSync(envPath, 'utf8')

const netComment = src.match(/portal\.sms\.net\.bd[\s\S]{0,240}?^\s*#\s*SMS_API_URL="([^"]+)"/m)
if (netComment?.[1] && !/^https?:\/\//i.test(netComment[1]) && netComment[1].length >= 16) {
  const existing = namedValue(src, 'SMS_NET_BD_API_KEY')
  if (looksPlaceholder(existing)) {
    src = upsertNamed(src, 'SMS_NET_BD_API_KEY', netComment[1])
    actions.push('SET SMS_NET_BD_API_KEY (from commented SMS_API_URL near portal.sms.net.bd)')
  }
}

const bulkComment = src.match(/24bulksmsbd\.com[\s\S]{0,240}?Your Api key is:\s*([A-Za-z0-9]+)/i)
if (bulkComment?.[1] && bulkComment[1].length >= 16) {
  const existing = namedValue(src, 'BULKSMS24_API_KEY')
  if (looksPlaceholder(existing)) {
    src = upsertNamed(src, 'BULKSMS24_API_KEY', bulkComment[1])
    actions.push('SET BULKSMS24_API_KEY (from 24bulksmsbd comment)')
  }
}

const smsUrl = namedValue(src, 'SMS_API_URL')
if (looksPlaceholder(smsUrl) || !/^https?:\/\//i.test(smsUrl)) {
  src = upsertNamed(src, 'SMS_API_URL', 'https://api.sms.net.bd/sendsms')
  actions.push('SET SMS_API_URL (sms.net.bd send URL; was placeholder or a key)')
}

if (!/^ZINIPAY_API_KEY=/m.test(src)) {
  src = upsertNamed(src, 'ZINIPAY_API_KEY', '')
  actions.push('ADDED ZINIPAY_API_KEY empty (name present; value still missing)')
}

if (!/^PUBLIC_APP_URL=/m.test(src)) {
  const next = namedValue(src, 'NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'
  src = upsertNamed(src, 'PUBLIC_APP_URL', next)
  actions.push('ADDED PUBLIC_APP_URL (alias of NEXT_PUBLIC_APP_URL)')
}

if (!/^NEXT_PUBLIC_SITE_URL=/m.test(src)) {
  const next = namedValue(src, 'NEXT_PUBLIC_APP_URL') || namedValue(src, 'PUBLIC_APP_URL') || 'http://localhost:3000'
  src = upsertNamed(src, 'NEXT_PUBLIC_SITE_URL', next)
  actions.push('ADDED NEXT_PUBLIC_SITE_URL (alias)')
}

writeFileSync(envPath, src.endsWith('\n') ? src : `${src}\n`)
console.log(JSON.stringify({ file: 'webapp/.env', actions, valuesPrinted: false }, null, 2))
