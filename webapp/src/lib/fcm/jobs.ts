import { prisma } from '@/lib/prisma'
import { addYmd, utcPadAroundDhakaYmd, ymdInDhaka } from './dhaka'
import { canPushDevice, hearingOffset, notifyUserId, premiumOffset } from './logic'
import { hearingDigestPayload, leadIncomingPayload, premiumPayload } from './payload'
import { sendFcmToToken } from './send'

export type JobSummary = {
  sent: number
  skipped: number
  invalid: number
  failed: number
  unconfigured: boolean
}

export async function runFcmReminderJobs(now = new Date()): Promise<JobSummary> {
  const today = ymdInDhaka(now)
  const hearing = await runHearingJobs(today)
  const premium = await runPremiumJobs(today)
  return {
    sent: hearing.sent + premium.sent,
    skipped: hearing.skipped + premium.skipped,
    invalid: hearing.invalid + premium.invalid,
    failed: hearing.failed + premium.failed,
    unconfigured: hearing.unconfigured || premium.unconfigured,
  }
}

async function runHearingJobs(todayYmd: string): Promise<JobSummary> {
  const summary: JobSummary = { sent: 0, skipped: 0, invalid: 0, failed: 0, unconfigured: false }
  const tomorrow = addYmd(todayYmd, 1)
  const padToday = utcPadAroundDhakaYmd(todayYmd)
  const padTomorrow = utcPadAroundDhakaYmd(tomorrow)
  const gte = padToday.gte < padTomorrow.gte ? padToday.gte : padTomorrow.gte
  const lt = padToday.lt > padTomorrow.lt ? padToday.lt : padTomorrow.lt

  const cases = await prisma.case.findMany({
    where: {
      deletedAt: null,
      status: 'active',
      nextDate: { gte, lt },
    },
    select: {
      id: true,
      caseNo: true,
      nextDate: true,
      assignedToUserId: true,
      createdByUserId: true,
    },
  })

  type Bucket = { offset: 0 | 1; ids: string[] }
  const byUser = new Map<string, Bucket>()
  for (const c of cases) {
    if (!c.nextDate) continue
    const ymd = ymdInDhaka(c.nextDate)
    const offset = hearingOffset(ymd, todayYmd)
    if (offset === null) continue
    const uid = notifyUserId(c)
    const key = `${uid}|${offset}`
    const prev = byUser.get(key)
    if (prev) prev.ids.push(c.id)
    else byUser.set(key, { offset, ids: [c.id] })
  }

  for (const [key, bucket] of byUser) {
    const userId = key.split('|')[0]
    const payload = hearingDigestPayload({
      offset: bucket.offset,
      count: bucket.ids.length,
      caseId: bucket.ids.length === 1 ? bucket.ids[0] : undefined,
      userId,
      ymd: todayYmd,
    })
    await dispatchToUser({
      userId,
      kind: payload.data.kind,
      dedupeKey: payload.data.dedupeKey,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      summary,
    })
  }
  return summary
}

async function runPremiumJobs(todayYmd: string): Promise<JobSummary> {
  const summary: JobSummary = { sent: 0, skipped: 0, invalid: 0, failed: 0, unconfigured: false }
  const d3 = addYmd(todayYmd, 3)
  const d4 = addYmd(todayYmd, 4)
  const pad3 = utcPadAroundDhakaYmd(d3)
  const pad4 = utcPadAroundDhakaYmd(d4)
  const gte = pad4.gte < pad3.gte ? pad4.gte : pad3.gte
  const lt = pad3.lt > pad4.lt ? pad3.lt : pad4.lt

  const workspaces = await prisma.workspace.findMany({
    where: {
      deletedAt: null,
      plan: { not: 'FREE' },
      planExpiresAt: { gte, lt },
    },
    select: {
      id: true,
      ownerUserId: true,
      planExpiresAt: true,
    },
  })

  for (const ws of workspaces) {
    if (!ws.planExpiresAt) continue
    const endsYmd = ymdInDhaka(ws.planExpiresAt)
    const offset = premiumOffset(endsYmd, todayYmd)
    if (offset === null) continue
    const payload = premiumPayload({
      offset,
      endsYmd,
      userId: ws.ownerUserId,
    })
    await dispatchToUser({
      userId: ws.ownerUserId,
      kind: payload.data.kind,
      dedupeKey: payload.data.dedupeKey,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      summary,
    })
  }
  return summary
}

export async function notifyLeadIncoming(opts: {
  lawyerUserId: string
  appointmentId: string
}): Promise<void> {
  const summary: JobSummary = { sent: 0, skipped: 0, invalid: 0, failed: 0, unconfigured: false }
  const payload = leadIncomingPayload({
    userId: opts.lawyerUserId,
    appointmentId: opts.appointmentId,
  })
  await dispatchToUser({
    userId: opts.lawyerUserId,
    kind: payload.data.kind,
    dedupeKey: payload.data.dedupeKey,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    summary,
  })
}

async function dispatchToUser(input: {
  userId: string
  kind: string
  dedupeKey: string
  title: string
  body: string
  data: ReturnType<typeof hearingDigestPayload>['data']
  summary: JobSummary
}): Promise<void> {
  const claimed = await claimDispatch(input.userId, input.dedupeKey, input.kind)
  if (!claimed) {
    input.summary.skipped += 1
    return
  }

  const devices = await prisma.device.findMany({
    where: { userId: input.userId, revokedAt: null, pushToken: { not: null } },
    select: { id: true, pushToken: true, pushEnabled: true, revokedAt: true },
  })
  const targets = devices.filter(canPushDevice)
  if (targets.length === 0) {
    await releaseDispatch(input.dedupeKey)
    input.summary.skipped += 1
    return
  }

  let anySent = false
  let unconfigured = false
  for (const d of targets) {
    const token = d.pushToken
    if (!token) continue
    const result = await sendFcmToToken({
      token,
      title: input.title,
      body: input.body,
      data: input.data,
    })
    if (result === 'sent') {
      anySent = true
      input.summary.sent += 1
    } else if (result === 'invalid') input.summary.invalid += 1
    else if (result === 'unconfigured') {
      unconfigured = true
      input.summary.unconfigured = true
    } else input.summary.failed += 1
  }

  if (!anySent) await releaseDispatch(input.dedupeKey)
  if (unconfigured) input.summary.unconfigured = true
}

async function claimDispatch(userId: string, dedupeKey: string, kind: string): Promise<boolean> {
  try {
    await prisma.fcmDispatch.create({ data: { userId, dedupeKey, kind } })
    return true
  } catch {
    return false
  }
}

async function releaseDispatch(dedupeKey: string): Promise<void> {
  await prisma.fcmDispatch.deleteMany({ where: { dedupeKey } })
}
