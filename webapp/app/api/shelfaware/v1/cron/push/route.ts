import { NextRequest, NextResponse } from 'next/server'
import { cronAuthorized } from '@/lib/shelfaware/http'
import { dispatchShelfReminders } from '@/lib/shelfaware/jobs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!cronAuthorized(req)) return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
  const result = await dispatchShelfReminders()
  return NextResponse.json({ ok: true, ...result })
}
