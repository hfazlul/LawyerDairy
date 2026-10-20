import { NextResponse } from 'next/server'
import { limitationPackFor } from '@/lib/content/limitation'

/** Returns the Bangladesh Limitation Act 1908 pack. */
export async function GET() {
  const pack = limitationPackFor('BD')
  return NextResponse.json(pack)
}
