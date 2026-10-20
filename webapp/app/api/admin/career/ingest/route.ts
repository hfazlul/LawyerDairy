import { NextRequest, NextResponse } from 'next/server'
import { requireAppRole } from '@/lib/auth-middleware'
import { originAllowed } from '@/lib/csrf'
import { ingestBarCouncilContent } from '@/lib/master/career-ingest'
import { ingestHighCourtContent } from '@/lib/master/hc-ingest'
import { ingestBjsContent } from '@/lib/master/bjs-ingest'

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const admin = await requireAppRole(req, ['ADMIN'])
  if (!admin) return NextResponse.redirect(new URL('/hfazlul/login', req.url), 303)
  const bar = await ingestBarCouncilContent().catch((e) => ({ error: String(e) }))
  const hc = await ingestHighCourtContent().catch((e) => ({ error: String(e) }))
  const bjs = await ingestBjsContent().catch((e) => ({ error: String(e) }))
  return NextResponse.json({ bar, hc, bjs })
}
