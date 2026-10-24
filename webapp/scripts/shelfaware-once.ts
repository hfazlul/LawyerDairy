/**
 * One-shot ShelfAware run for the VPS. Not a loop.
 * Loads webapp/.env inside this process and prints status lines only.
 *
 * Env names read from that file (values are never printed):
 *   SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON
 *   FIREBASE_SERVICE_ACCOUNT_JSON          (health-checker name; used only if the shelf name is empty)
 *   GROQ_API_KEY, OPENROUTER_API_KEY, GEMINI_FREE_API_KEY, HF_API_TOKEN
 *   GROQ_KEYS, OPENROUTER_KEYS             (optional; agent falls back to the health-checker names)
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (optional)
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID   (health alerts; not printed)
 *   DATABASE_URL
 * Do not set SKIP_ALERTS.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { shelfFcmConfigured, shelfServiceAccount } from '../src/lib/shelfaware/fcm'
import { dispatchShelfReminders, runCentralAgent, runModelHealthCheck } from '../src/lib/shelfaware/jobs'
import { parseAgentResult } from '../src/lib/shelfaware/schedule'

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

async function main() {
  loadDotEnv()
  let failed = false

  try {
    const health = await runModelHealthCheck()
    if (health.code === 0) console.log('health ok')
    else {
      console.log('health failed')
      failed = true
    }
  } catch {
    console.log('health failed')
    failed = true
  }

  try {
    if (!shelfServiceAccount()) {
      console.log('agent skipped missing_firebase')
      failed = true
    } else {
      const result = await runCentralAgent()
      const parsed = parseAgentResult(result.tail)
      if (result.code !== 0 || !parsed || parsed.http >= 400) {
        console.log('agent failed')
        failed = true
      } else {
        console.log(`agent ok processed=${parsed.processed} resolved=${parsed.resolved}`)
      }
    }
  } catch {
    console.log('agent failed')
    failed = true
  }

  try {
    if (!shelfFcmConfigured()) {
      console.log('push skipped unconfigured')
      failed = true
    } else {
      const push = await dispatchShelfReminders()
      console.log(`push sent=${push.sent} failed=${push.failed}`)
      if (push.failed > 0) failed = true
    }
  } catch {
    console.log('push failed')
    failed = true
  }

  if (failed) process.exit(1)
}

main().catch(() => {
  console.log('run failed')
  process.exit(1)
})
