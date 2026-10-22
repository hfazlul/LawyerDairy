import { NextRequest, NextResponse } from 'next/server'
import { cronAuthorized } from '@/lib/shelfaware/http'
import { runCentralAgent } from '@/lib/shelfaware/jobs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  if (!cronAuthorized(req)) return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
  const result = await runCentralAgent()
  return NextResponse.json({ ok: result.code === 0, code: result.code })
}
