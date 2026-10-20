import { NextRequest, NextResponse } from 'next/server'
import { smsHybridConfigured } from '@/lib/sms-hybrid'
import { isDhakaQuietHours } from '@/lib/dhaka-hours'
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
 * Automatic one-line hearing SMS is retired.
 * The lawyer sends from the bulk SMS page (name, chamber, arrival time)
 * for hearings 1 or 2 days away. That path checks the package quota.
 */
async function handle(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  if (!smsHybridConfigured()) {
    return NextResponse.json({ ok: true, skipped: 'sms_unconfigured', sent: 0 })
  }
  if (isDhakaQuietHours()) {
    return NextResponse.json({ ok: true, skipped: 'quiet_hours', sent: 0 })
  }
  return NextResponse.json({
    ok: true,
    skipped: 'bulk_sms_page',
    sent: 0,
    ymd: ymdInDhaka(),
  })
}

export async function POST(req: NextRequest) {
  return handle(req)
}

export async function GET(req: NextRequest) {
  return handle(req)
}
