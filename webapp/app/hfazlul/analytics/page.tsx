import { requireAdminPage } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { AdminShell } from '@/ui/app-nav'
import { ga4Configured } from '@/lib/ga4'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  await requireAdminPage('/hfazlul/analytics')
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ['name'],
    _count: { _all: true },
    orderBy: { _count: { name: 'desc' } },
    take: 40,
  })
  return (
    <AdminShell title="Analytics">
        <p className="muted">
          First-party. GA4 gtag {ga4Configured() ? 'SET' : 'EMPTY'} — Measurement ID পেস্ট হলে পাবলিক সাইটে যায়।
        </p>
        <table className="table">
          <thead><tr><th>Event</th><th>Count</th></tr></thead>
          <tbody>
            {grouped.map((g) => (
              <tr key={g.name}><td>{g.name}</td><td>{g._count._all}</td></tr>
            ))}
          </tbody>
        </table>
      </AdminShell>
  )
}
