import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET
  const hdr =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return Boolean(secret && hdr === secret)
}

/** Weekly WhatsApp digest removed — SIM SMS hybrid is the only auto channel. */
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    ok: true,
    sent: 0,
    skipped: 'whatsapp_auto_removed',
  })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
