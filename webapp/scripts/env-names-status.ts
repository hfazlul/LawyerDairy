/** Print .env NAME states only. Never prints values. */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env')
const names = [
  'ZINIPAY_API_KEY',
  'ZINI_API_KEY',
  'ZINIPAY_KEY',
  'SMS_NET_BD_API_KEY',
  'SMS_NETBD_API_KEY',
  'SMS_API_URL',
  'SMS_API_KEY',
  'BULKSMS24_API_KEY',
  'SMS_FAILOVER_KEY',
  'PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
]

function stateOf(src: string, name: string): string {
  const re = new RegExp(`^${name}=(.*)$`, 'm')
  const m = src.match(re)
  if (!m) return 'ABSENT'
  let v = m[1].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  if (!v) return 'EMPTY'
  if (name === 'NEXT_PUBLIC_GA_MEASUREMENT_ID') {
    if (/^G-X+$/i.test(v) || v === 'G-XXXXXXXX') return 'PLACEHOLDER'
    if (/^G-[A-Z0-9]+$/i.test(v)) return 'SET'
    return 'INVALID'
  }
  if (/your-sms-api-key|sms-gateway\.com|change-me/i.test(v)) return 'PLACEHOLDER'
  if (/URL$/.test(name) && /^https?:\/\//i.test(v)) return 'SET_URL'
  return 'SET'
}

if (!existsSync(envPath)) {
  console.log(JSON.stringify({ file: 'webapp/.env', missing: true }))
  process.exit(0)
}
const src = readFileSync(envPath, 'utf8')
const out: Record<string, string> = {}
for (const n of names) out[n] = stateOf(src, n)
console.log(JSON.stringify(out, null, 2))
