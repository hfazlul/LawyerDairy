import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { buildLoginEnvelope } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const envelope = await buildLoginEnvelope(user.id)
  return NextResponse.json(envelope)
}
