import { NextRequest, NextResponse } from 'next/server'
import { shelfKeyError } from '@/lib/shelfaware/http'
import { replaceShelfReminders } from '@/lib/shelfaware/register'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const denied = shelfKeyError(req)
  if (denied) return denied
  try {
    const body = (await req.json()) as Record<string, unknown>
    const result = await replaceShelfReminders(body)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ message: 'bad_request' }, { status: 400 })
  }
}
