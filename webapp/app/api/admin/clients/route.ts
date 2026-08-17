import { NextRequest, NextResponse } from 'next/server'
import { requireAppRole } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

/** Admin: list clients (email, phone) across chambers. */
export async function GET(req: NextRequest) {
  const admin = await requireAppRole(req, ['ADMIN'])
  if (!admin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const q = req.nextUrl.searchParams.get('q')?.trim()

  const users = await prisma.user.findMany({
    where: {
      appRole: 'USER',
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
              { name: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      chamber: {
        select: { id: true, name: true, plan: true, subscriptionEndsAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return NextResponse.json({ clients: users })
}
