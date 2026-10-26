import { NextRequest, NextResponse } from 'next/server'
import { dhakaHour, isDhakaQuietHours } from '@/lib/dhaka-hours'
import { dispatchAutomaticHearings } from '@/lib/hearing-dispatch'
import { bulkSms24Configured } from '@/lib/sms-hybrid'
import { ymdInDhaka } from '@/lib/fcm/dhaka'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET
  const hdr =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return Boolean(secret && hdr === secret)
}

/**
 * Automatic hearing SMS for the one full-access account. The switch defaults on
 * until they save it off. One DynamicSMSApi batch per owned workspace, on the
 * saved day chips (one day before, once, until they save something else).
 * Other accounts are skipped. The sentence is the existing hearing text.
 */
async function handle(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  if (!bulkSms24Configured()) {
    return NextResponse.json({ ok: true, skipped: 'sms_unconfigured', sent: 0 })
  }
  if (isDhakaQuietHours()) {
    return NextResponse.json({ ok: true, skipped: 'quiet_hours', sent: 0 })
  }
  if (dhakaHour() < 10) {
    return NextResponse.json({ ok: true, skipped: 'before_10', sent: 0, ymd: ymdInDhaka() })
  }
  const result = await dispatchAutomaticHearings()
  return NextResponse.json({
    ok: result.failed === 0,
    sent: result.sent,
    skipped: result.skipped,
    failed: result.failed,
    workspaces: result.workspaces,
    ymd: ymdInDhaka(),
  })
}

export async function POST(req: NextRequest) {
  return handle(req)
}

export async function GET(req: NextRequest) {
  return handle(req)
}
