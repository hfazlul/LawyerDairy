import { NextRequest, NextResponse } from 'next/server'
import { isJurisdiction, type JurisdictionCode } from '@/lib/jurisdiction'
import { limitationPackFor } from '@/lib/content/limitation'

/** Testing helper — returns limitation pack for ?j=BD|IN|PK */
export async function GET(req: NextRequest) {
  const j = (req.nextUrl.searchParams.get('j') || 'BD').toUpperCase()
  if (!isJurisdiction(j)) {
    return NextResponse.json({ message: 'Invalid jurisdiction' }, { status: 400 })
  }
  const pack = limitationPackFor(j as JurisdictionCode)
  return NextResponse.json(pack)
}
