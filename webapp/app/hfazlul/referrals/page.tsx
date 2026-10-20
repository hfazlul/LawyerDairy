import { requireAdminPage } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { AdminShell } from '@/ui/app-nav'

export const dynamic = 'force-dynamic'

export default async function ReferralsAdminPage() {
  await requireAdminPage('/hfazlul/referrals')
  const rewards = await prisma.referralReward.findMany({
    include: { user: { select: { name: true, phone: true, referralCode: true } } },
    orderBy: { grantedAt: 'desc' },
    take: 200,
  })
  const n = await prisma.referralAttribution.count({ where: { qualifiedAt: { not: null } } })
  return (
    <AdminShell title="Referrals">
        <p className="muted">Qualified installs+accounts: {n}</p>
        <table className="table">
          <thead><tr><th>User</th><th>N</th><th>Months</th></tr></thead>
          <tbody>
            {rewards.map((r) => (
              <tr key={r.id}>
                <td>{r.user.name} · {r.user.phone}</td>
                <td>{r.qualifiedN}</td>
                <td>{r.monthsGranted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminShell>
  )
}
