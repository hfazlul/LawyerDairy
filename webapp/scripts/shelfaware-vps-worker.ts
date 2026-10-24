/**
 * VPS loop for ShelfAware. Push stays frequent. The central agent does not.
 *
 * process-queue.js (shelfaware-agent) loads at most BATCH_SIZE (30) docs from
 * Firestore agent_queue per invocation, resolves them, and writes products +
 * product_templates. Hobby cron was once a day (vercel.json `0 3 * * *`);
 * GitHub Actions poked that 10-second route every hour. On the VPS one
 * invocation gets a 9-minute budget, so hourly polling is unnecessary.
 *
 * Queue depth picks the day's cap (local clock):
 *   0            skip, and do not consume the daily cap
 *   1–30         1 run (one invocation can see the whole pile)
 *   31–120       4 runs (up to four batches of 30)
 *   121+         5 runs (daily cap; a deeper backlog continues tomorrow)
 * Runs only from 08:00 through 20:00 local time, spaced across that window,
 * and only when the last model-health beat did not fail.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '../src/lib/prisma'
import {
  countAgentQueue,
  dispatchShelfReminders,
  runCentralAgent,
  runModelHealthCheck,
} from '../src/lib/shelfaware/jobs'

const PUSH_MS = 2 * 60 * 1000
const TICK_MS = 30 * 1000
const HEALTH_OK_MS = 28 * 24 * 60 * 60 * 1000
const HEALTH_RETRY_MS = 24 * 60 * 60 * 1000
const COUNT_GAP_MS = 15 * 60 * 1000
const BATCH = 30
const CAP = 5
const WINDOW_START_H = 8
const WINDOW_END_H = 20
const DAY_BEAT = 'agent-day'

let lastPushAt = 0
let lastDepthCheckAt = 0

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function localDay(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function inDaytime(now = new Date()): boolean {
  const h = now.getHours()
  return h >= WINDOW_START_H && h <= WINDOW_END_H
}

/** How many agent invocations are worth spending today for this pile. */
export function runsForQueueDepth(depth: number): number {
  if (depth <= 0) return 0
  if (depth <= BATCH) return 1
  if (depth <= BATCH * 4) return 4
  return CAP
}

/** Minimum time between attempts so a restart cannot fire the whole cap at once. */
export function minGapMs(target: number): number {
  if (target <= 1) return 12 * 60 * 60 * 1000
  const span = (WINDOW_END_H - WINDOW_START_H) * 60 * 60 * 1000
  return Math.floor(span / (target - 1))
}

function healthFailed(detail: string | null | undefined): boolean {
  const match = /^code=(\d+)/.exec((detail || '').trim())
  if (!match) return false
  return match[1] !== '0'
}

type DayState = { day: string; runs: number; target: number; lastRunAt: Date | null }

async function readDayState(now = new Date()): Promise<DayState> {
  const today = localDay(now)
  const row = await prisma.shelfOpsBeat.findUnique({ where: { id: DAY_BEAT } })
  if (!row) return { day: today, runs: 0, target: 0, lastRunAt: null }
  const day = /day=(\d{4}-\d{2}-\d{2})/.exec(row.detail)?.[1]
  if (day !== today) return { day: today, runs: 0, target: 0, lastRunAt: null }
  const runs = Math.max(0, Math.trunc(Number(/runs=(\d+)/.exec(row.detail)?.[1] || 0)))
  const target = Math.max(0, Math.trunc(Number(/target=(\d+)/.exec(row.detail)?.[1] || 0)))
  return { day: today, runs, target, lastRunAt: row.lastRunAt }
}

async function writeDay(detail: string, touchLastRun: boolean) {
  await prisma.shelfOpsBeat.upsert({
    where: { id: DAY_BEAT },
    create: { id: DAY_BEAT, detail },
    update: touchLastRun ? { detail, lastRunAt: new Date() } : { detail },
  })
}

async function maybeHealth(nowMs: number) {
  const beat = await prisma.shelfOpsBeat.findUnique({ where: { id: 'health' } })
  const age = beat ? nowMs - beat.lastRunAt.getTime() : Number.POSITIVE_INFINITY
  const failed = beat ? healthFailed(beat.detail) : false
  const due = !beat || (failed ? age >= HEALTH_RETRY_MS : age >= HEALTH_OK_MS)
  if (!due) return
  const result = await runModelHealthCheck()
  console.log(`health code=${result.code}`)
}

async function maybeAgent(now = new Date()) {
  if (!inDaytime(now)) return
  const state = await readDayState(now)
  if (state.runs >= CAP) return
  const since = state.lastRunAt ? now.getTime() - state.lastRunAt.getTime() : Number.POSITIVE_INFINITY
  if (state.runs > 0 && since < minGapMs(CAP)) return
  if (lastDepthCheckAt && now.getTime() - lastDepthCheckAt < COUNT_GAP_MS) return

  lastDepthCheckAt = now.getTime()
  const counted = await countAgentQueue()
  if ('error' in counted) {
    console.error(`agent queue count failed: ${counted.error}`)
    return
  }
  const target = runsForQueueDepth(counted.queue)
  if (target === 0) {
    await writeDay(`day=${state.day} runs=${state.runs} target=0 depth=0 skipped=empty`, false)
    return
  }
  if (state.runs >= target) return
  if (state.runs > 0 && since < minGapMs(target)) return

  const health = await prisma.shelfOpsBeat.findUnique({ where: { id: 'health' } })
  if (health && healthFailed(health.detail)) {
    await writeDay(
      `day=${state.day} runs=${state.runs} target=${target} depth=${counted.queue} skipped=health`,
      false,
    )
    console.log('agent skipped: last model health check failed')
    return
  }

  console.log(`agent start depth=${counted.queue} target=${target} runs=${state.runs + 1}`)
  const result = await runCentralAgent()
  await writeDay(
    `day=${state.day} runs=${state.runs + 1} target=${target} depth=${counted.queue} code=${result.code}`,
    true,
  )
  console.log(`agent done code=${result.code}`)
}

async function main() {
  loadDotEnv()
  console.log('shelfaware worker up (push ~2m, agent by queue depth, health ~28d)')
  for (;;) {
    const nowMs = Date.now()
    if (nowMs - lastPushAt >= PUSH_MS) {
      try {
        const push = await dispatchShelfReminders()
        console.log(`push due=${push.due} sent=${push.sent} failed=${push.failed}`)
      } catch (err) {
        console.error('push failed', err instanceof Error ? err.message : err)
      }
      lastPushAt = Date.now()
    }
    try {
      await maybeHealth(Date.now())
    } catch (err) {
      console.error('health failed', err instanceof Error ? err.message : err)
    }
    try {
      await maybeAgent(new Date())
    } catch (err) {
      console.error('agent schedule failed', err instanceof Error ? err.message : err)
    }
    await sleep(TICK_MS)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
