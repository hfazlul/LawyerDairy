/**
 * VPS loop for ShelfAware. Push stays on its short interval and does nothing
 * when no reminder is due. The central agent does not.
 *
 * Once per Asia/Dhaka day, at or after 09:00 (the old Hobby cron 03:00 UTC),
 * if Firestore agent_queue has incomplete barcodes, the agent starts by itself.
 * That start drains the queue one batch of 30 at a time, yielding between
 * batches so the push interval still runs, until the queue is empty or 20
 * batches have run. It is not a 2-minute loop. A deeper pile continues the
 * next day. The model health check stays on its monthly cadence and replaces
 * dead model ids when it runs.
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
import { agentDue, dayDone, dayRuns, dhakaParts, parseAgentResult } from '../src/lib/shelfaware/schedule'

const PUSH_MS = 2 * 60 * 1000
const TICK_MS = 30 * 1000
const HEALTH_OK_MS = 28 * 24 * 60 * 60 * 1000
const HEALTH_RETRY_MS = 24 * 60 * 60 * 1000
const COUNT_GAP_MS = 15 * 60 * 1000
const MAX_DRAIN_BATCHES = 20
const DAY_BEAT = 'agent-day'

let lastPushAt = 0
let lastDepthCheckAt = 0
let agentDoneYmd = ''

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

function healthFailed(detail: string | null | undefined): boolean {
  const match = /^code=(\d+)/.exec((detail || '').trim())
  if (!match) return false
  return match[1] !== '0'
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
  const parts = dhakaParts(now)
  if (!agentDue(parts.hour, false)) return
  if (agentDoneYmd === parts.ymd) return
  const row = await prisma.shelfOpsBeat.findUnique({ where: { id: DAY_BEAT } })
  if (dayDone(row?.detail, parts.ymd)) {
    agentDoneYmd = parts.ymd
    return
  }
  const runs = dayRuns(row?.detail, parts.ymd)
  if (runs === 0) {
    if (lastDepthCheckAt && now.getTime() - lastDepthCheckAt < COUNT_GAP_MS) return
    lastDepthCheckAt = now.getTime()
    const counted = await countAgentQueue()
    if ('error' in counted) {
      console.error('agent queue count failed')
      return
    }
    if (counted.queue === 0) {
      await writeDay(`day=${parts.ymd} done=1 runs=0 depth=0 skipped=empty`, false)
      agentDoneYmd = parts.ymd
      console.log('agent skipped empty')
      return
    }
    const health = await prisma.shelfOpsBeat.findUnique({ where: { id: 'health' } })
    if (health && healthFailed(health.detail)) {
      await writeDay(`day=${parts.ymd} done=1 runs=0 depth=${counted.queue} skipped=health`, false)
      agentDoneYmd = parts.ymd
      console.log('agent skipped health')
      return
    }
    console.log(`agent start depth=${counted.queue}`)
  } else if (runs >= MAX_DRAIN_BATCHES) {
    await writeDay(`day=${parts.ymd} done=1 runs=${runs} skipped=cap`, true)
    agentDoneYmd = parts.ymd
    console.log('agent done cap')
    return
  }

  const result = await runCentralAgent()
  const parsed = parseAgentResult(result.tail)
  const again = await countAgentQueue()
  const remaining = 'error' in again ? -1 : again.queue
  const nextRuns = runs + 1
  const stop =
    result.code !== 0 ||
    !parsed ||
    parsed.http >= 400 ||
    parsed.processed === 0 ||
    remaining === 0 ||
    nextRuns >= MAX_DRAIN_BATCHES
  if (stop) agentDoneYmd = parts.ymd
  await writeDay(
    `day=${parts.ymd} done=${stop ? 1 : 0} runs=${nextRuns} remaining=${remaining} code=${result.code}`,
    true,
  )
  console.log(
    stop
      ? `agent done code=${result.code} batches=${nextRuns} remaining=${remaining}`
      : `agent batch code=${result.code} batches=${nextRuns} remaining=${remaining}`,
  )
}

async function main() {
  loadDotEnv()
  console.log('shelfaware worker up (push ~2m, agent 09:00 Asia/Dhaka, health ~28d)')
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
