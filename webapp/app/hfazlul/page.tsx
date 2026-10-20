import { requireAdminPage } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { AdminShell } from '@/ui/app-nav'
import { ga4Configured } from '@/lib/ga4'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  await requireAdminPage('/hfazlul')
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 86400000)
  const monthAgo = new Date(now.getTime() - 30 * 86400000)
  const twoMonth = new Date(now.getTime() - 60 * 86400000)

  const [
    users,
    realtime,
    paidWs,
    starter,
    pro,
    proA,
    adv,
    ge1,
    ge2,
    events,
    eventsRt,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null, appRole: 'USER' } }),
    prisma.user.count({ where: { lastSeenAt: { gte: dayAgo } } }),
    prisma.workspace.count({ where: { plan: { not: 'FREE' }, planExpiresAt: { gt: now } } }),
    prisma.workspace.count({ where: { plan: 'STARTER', planExpiresAt: { gt: now } } }),
    prisma.workspace.count({ where: { plan: 'PRO', planExpiresAt: { gt: now } } }),
    prisma.workspace.count({ where: { plan: 'PRO_ADVANCE', planExpiresAt: { gt: now } } }),
    prisma.workspace.count({ where: { plan: 'ADVANCE', planExpiresAt: { gt: now } } }),
    prisma.user.count({ where: { createdAt: { lte: monthAgo }, deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { lte: twoMonth }, deletedAt: null } }),
    prisma.analyticsEvent.count(),
    prisma.analyticsEvent.count({ where: { createdAt: { gte: dayAgo } } }),
  ])

  const cards = [
    ['ইউজার', users],
    ['Realtime (২৪ঘ)', realtime],
    ['পেইড ওয়ার্কস্পেস', paidWs],
    ['Starter', starter],
    ['Pro', pro],
    ['Pro Advance', proA],
    ['Advance', adv],
    ['≥১ মাস ইউজার', ge1],
    ['≥২ মাস ইউজার', ge2],
    ['ওয়েব ইভেন্ট মোট', events],
    ['ইভেন্ট realtime', eventsRt],
  ]

  return (
    <AdminShell title="অ্যাডমিন ড্যাশবোর্ড">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <p className="font-bengali text-sm text-muted-foreground">
          GA4 মালিক কনফিগ · নিচের সংখ্যা first-party DB।
        </p>
        <Badge variant={ga4Configured() ? 'success' : 'secondary'}>
          GA4 {ga4Configured() ? 'সেট' : 'খালি'}
        </Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map(([k, v]) => (
          <Card key={String(k)}>
            <CardHeader className="pb-2">
              <CardTitle className="font-bengali text-sm font-medium text-muted-foreground">{k}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-navy">{v}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-8 font-bengali text-sm">
        <Link href="/hfazlul/users" className="font-semibold text-navy-soft no-underline hover:underline">
          পেইড ইউজার পিভট
        </Link>
        {' · '}
        <Link href="/hfazlul/analytics" className="font-semibold text-navy-soft no-underline hover:underline">
          ইভেন্ট
        </Link>
      </p>
    </AdminShell>
  )
}
