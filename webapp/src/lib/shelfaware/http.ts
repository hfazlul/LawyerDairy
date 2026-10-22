import { NextRequest, NextResponse } from 'next/server'

export function shelfKeyError(req: NextRequest): NextResponse | null {
  const expected = (process.env.SHELFAWARE_APP_KEY || '').trim()
  if (!expected) {
    return NextResponse.json({ message: 'shelfaware_unconfigured' }, { status: 503 })
  }
  if (req.headers.get('x-shelf-key') !== expected) {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
  }
  return null
}

export function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET
  const hdr =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return Boolean(secret && hdr === secret)
}
