import { NextRequest, NextResponse } from 'next/server'
import { fcmConfigured } from '@/lib/fcm/config'
import { runFcmReminderJobs } from '@/lib/fcm/jobs'

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

/** Hearing D-1/D-0 + subscription D-4/D-3. No SMS. Idempotent via FcmDispatch. */
async function handle(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  if (!fcmConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: 'fcm_unconfigured',
      sent: 0,
    })
  }
  try {
    const result = await runFcmReminderJobs()
    return NextResponse.json({ ok: true, ...result })
  } catch {
    return NextResponse.json({ ok: false, error: 'fcm_job_failed', sent: 0 }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return handle(req)
}

/** Vercel Cron sends GET; same secret header still required. */
export async function GET(req: NextRequest) {
  return handle(req)
}
