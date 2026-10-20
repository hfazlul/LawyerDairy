import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PACKAGE_DEFS } from '@/lib/plans'

/** Public catalog for dashboard checkout UI (payment on web only). */
export async function GET() {
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ packages: packages.length ? packages : PACKAGE_DEFS.filter((p) => p.active) })
  } catch {
    return NextResponse.json({ packages: PACKAGE_DEFS.filter((p) => p.active), pg: 'PG_FAIL' })
  }
}
