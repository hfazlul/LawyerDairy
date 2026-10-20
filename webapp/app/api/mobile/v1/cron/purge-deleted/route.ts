import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ACCOUNT_GRACE_MS, anonymizeDeletedUser } from '@/lib/auth/account-deletion'

/** Cron: anonymise accounts whose 30-day deletion grace has ended. */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET
  const hdr = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!secret || hdr !== secret) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - ACCOUNT_GRACE_MS)
  const rows = await prisma.user.findMany({
    where: { deletedAt: { not: null, lte: cutoff } },
    select: { id: true, username: true },
    take: 100,
  })
  let n = 0
  for (const u of rows) {
    if (u.username.startsWith('deleted_')) continue
    await anonymizeDeletedUser(u.id)
    n += 1
  }
  return NextResponse.json({ purged: n })
}
