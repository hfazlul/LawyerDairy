/**
 * Local / host helper: POST FCM reminder cron using CRON_SECRET from webapp/.env.
 * Never prints secrets. Requires the webapp to be listening (npm run dev / start).
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DEFAULT_URL = 'http://localhost:3000/api/mobile/v1/cron/fcm-reminders'

function loadDotEnv() {
  const p = resolve(process.cwd(), '.env')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (!process.env[k]) process.env[k] = v
  }
}

function cronUrl(): string {
  const explicit = (process.env.CRON_FCM_URL || '').trim()
  if (explicit) return explicit
  // Default localhost only — do not follow NEXT_PUBLIC_APP_URL (that may be production).
  return DEFAULT_URL
}

async function main() {
  loadDotEnv()
  const secret = (process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET || '').trim()
  if (!secret) {
    console.error('cron:fcm missing CRON_SECRET (or INTERNAL_CRON_SECRET) in webapp/.env')
    process.exit(2)
  }
  const url = cronUrl()
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'x-cron-secret': secret },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`cron:fcm request failed (is the webapp running?): ${msg.split('\n')[0]}`)
    process.exit(1)
  }
  const text = await res.text()
  console.log(`cron:fcm HTTP ${res.status}`)
  console.log(text)
  if (!res.ok) process.exit(1)
}

main()
