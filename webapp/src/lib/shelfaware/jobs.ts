import { spawn } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { prisma } from '@/lib/prisma'
import { sendShelfPush, shelfFirebaseJson, shelfServiceAccount } from './fcm'
import { SHELF_DUE_GRACE_MS, redactJobTail } from './schedule'

function money(micros: bigint | null | undefined): string {
  const n = Number(micros ?? 0n) / 1_000_000
  return n.toFixed(2)
}

export { money }

export async function dispatchShelfReminders() {
  const now = Date.now()
  const from = new Date(now - SHELF_DUE_GRACE_MS)
  const to = new Date(now)
  const due = await prisma.shelfReminder.findMany({
    where: { sentAt: null, dueAt: { gte: from, lte: to } },
    include: { device: true },
    take: 200,
    orderBy: { dueAt: 'asc' },
  })
  let sent = 0
  let failed = 0
  for (const row of due) {
    const token = row.device.fcmToken
    if (!token) continue
    const result = await sendShelfPush({
      token,
      title: row.title,
      body: row.body || row.title,
      itemKey: row.itemKey,
    })
    if (result === 'sent') {
      sent += 1
      await prisma.shelfReminder.update({
        where: { id: row.id },
        data: { sentAt: new Date() },
      })
    } else if (result === 'invalid') {
      failed += 1
      await prisma.shelfDevice.update({
        where: { id: row.deviceId },
        data: { fcmToken: null },
      })
    } else if (result === 'failed') {
      failed += 1
    }
  }
  await prisma.shelfOpsBeat.upsert({
    where: { id: 'push' },
    create: { id: 'push', detail: `sent=${sent} failed=${failed} due=${due.length}` },
    update: { lastRunAt: new Date(), detail: `sent=${sent} failed=${failed} due=${due.length}` },
  })
  return { due: due.length, sent, failed }
}

function runChild(command: string, args: string[], cwd: string, extraEnv: Record<string, string>) {
  return new Promise<{ code: number; tail: string }>((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let tail = ''
    const push = (chunk: Buffer) => {
      tail = (tail + chunk.toString()).slice(-1500)
    }
    child.stdout?.on('data', push)
    child.stderr?.on('data', push)
    child.on('error', (err) => resolve({ code: 1, tail: err.message }))
    child.on('close', (code) => resolve({ code: code ?? 1, tail }))
  })
}

export function shelfAgentDir(): string {
  return process.env.SHELFAWARE_AGENT_DIR || path.resolve(process.cwd(), '..', 'shelfaware-agent')
}

export function shelfHealthDir(): string {
  return process.env.SHELFAWARE_HEALTH_DIR || path.resolve(process.cwd(), '..', 'shelfaware-health')
}

/**
 * Env for a fresh Node process. process-queue.js reads
 * VERCEL_FUNCTION_MAX_DURATION_MS and FUNCTION_TIME_BUDGET_MS at import, so
 * these must already be set when that module loads. ShelfAware Firebase
 * replaces any Mamlaq FIREBASE_* / GOOGLE_APPLICATION_CREDENTIALS inherited
 * from the web process.
 */
export function shelfAgentChildEnv(): Record<string, string> {
  const env: Record<string, string> = {
    VERCEL_FUNCTION_MAX_DURATION_MS: '600000',
    FUNCTION_TIME_BUDGET_MS: '540000',
    CRON_SECRET: process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET || '',
    FIREBASE_PROJECT_ID: '',
    FIREBASE_CLIENT_EMAIL: '',
    FIREBASE_PRIVATE_KEY: '',
    GOOGLE_APPLICATION_CREDENTIALS: '',
  }
  const groq = (process.env.GROQ_API_KEY || '').trim()
  if (!(process.env.GROQ_KEYS || '').trim() && groq) env.GROQ_KEYS = groq
  const openRouter = (process.env.OPENROUTER_API_KEY || '').trim()
  if (!(process.env.OPENROUTER_KEYS || '').trim() && openRouter) env.OPENROUTER_KEYS = openRouter
  const json = shelfServiceAccount()
  if (!json) return env
  const projectId = String(json.project_id || '')
  const clientEmail = String(json.client_email || '')
  const privateKey = String(json.private_key || '').replace(/\r?\n/g, '\\n')
  if (projectId) env.FIREBASE_PROJECT_ID = projectId
  if (clientEmail) env.FIREBASE_CLIENT_EMAIL = clientEmail
  if (privateKey) env.FIREBASE_PRIVATE_KEY = privateKey
  return env
}

/** Firestore agent_queue size. One process-queue invocation reads at most 30 docs. */
export async function countAgentQueue(): Promise<{ queue: number } | { error: string }> {
  const dir = shelfAgentDir()
  const firestoreUrl = pathToFileURL(path.join(dir, 'lib', 'firestore.js')).href
  const script = `
    const { getDb } = await import(${JSON.stringify(firestoreUrl)});
    const snap = await getDb().collection('agent_queue').count().get();
    console.log(JSON.stringify({ queue: Number(snap.data().count || 0) }));
  `
  const result = await runChild(process.execPath, ['--input-type=module', '-e', script], dir, shelfAgentChildEnv())
  const matches = result.tail.match(/\{[^{}]*"queue"\s*:\s*\d+[^{}]*\}/g)
  const raw = matches?.[matches.length - 1]
  if (result.code !== 0 || !raw) {
    return { error: redactJobTail(raw || result.tail || 'queue_count_failed').slice(0, 300) }
  }
  try {
    const parsed = JSON.parse(raw) as { queue?: number }
    return { queue: Math.max(0, Math.trunc(Number(parsed.queue) || 0)) }
  } catch {
    return { error: 'queue_count_parse' }
  }
}

export async function runCentralAgent() {
  const dir = shelfAgentDir()
  const entry = pathToFileURL(path.join(dir, 'api', 'process-queue.js')).href
  // Spawn env is in place before Node evaluates this script, and therefore
  // before process-queue.js is imported.
  const script = `
    const mod = await import(${JSON.stringify(entry)});
    const req = { headers: { authorization: 'Bearer ' + (process.env.CRON_SECRET || '') }, method: 'POST' };
    const res = {
      _code: 200,
      status(code) { this._code = code; return this; },
      json(body) { console.log(JSON.stringify({ code: this._code || 200, body })); }
    };
    await mod.default(req, res);
  `
  const result = await runChild(process.execPath, ['--input-type=module', '-e', script], dir, shelfAgentChildEnv())
  const safe = { code: result.code, tail: redactJobTail(result.tail) }
  await prisma.shelfOpsBeat.upsert({
    where: { id: 'agent' },
    create: { id: 'agent', detail: `code=${safe.code} ${safe.tail.slice(0, 400)}` },
    update: { lastRunAt: new Date(), detail: `code=${safe.code} ${safe.tail.slice(0, 400)}` },
  })
  return safe
}

export async function runModelHealthCheck() {
  const dir = shelfHealthDir()
  const script = path.join(dir, 'tools', 'model_health_check.py')
  const shelfJson = shelfFirebaseJson()
  const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3')
  const result = await runChild(python, [script], dir, {
    SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON: shelfJson,
    FIREBASE_SERVICE_ACCOUNT_JSON: shelfJson,
    GOOGLE_APPLICATION_CREDENTIALS: '',
  })
  const safe = { code: result.code, tail: redactJobTail(result.tail) }
  await prisma.shelfOpsBeat.upsert({
    where: { id: 'health' },
    create: { id: 'health', detail: `code=${safe.code} ${safe.tail.slice(0, 400)}` },
    update: { lastRunAt: new Date(), detail: `code=${safe.code} ${safe.tail.slice(0, 400)}` },
  })
  return safe
}
