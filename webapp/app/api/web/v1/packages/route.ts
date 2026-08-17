import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** Public catalog for dashboard checkout UI (payment on web only). */
export async function GET() {
  const packages = await prisma.subscriptionPackage.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ packages })
}
