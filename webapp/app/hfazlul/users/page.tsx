import { requireAdminPage } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { AdminShell } from '@/ui/app-nav'
import { monthlySmsCredits } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireAdminPage('/hfazlul/users')
  const now = new Date()
  const workspaces = await prisma.workspace.findMany({
    where: { plan: { not: 'FREE' }, planExpiresAt: { gt: now } },
    include: { owner: true },
    take: 300,
    orderBy: { planExpiresAt: 'desc' },
  })
  return (
    <AdminShell title="Paid users">
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>নাম</th>
                <th>ফোন</th>
                <th>ইমেইল</th>
                <th>প্যাকেজ</th>
                <th>SMS কোটা</th>
                <th>SMS used (ক্রেডিট)</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((w) => (
                <tr key={w.id}>
                  <td>{w.owner.name}</td>
                  <td>{w.owner.phone}</td>
                  <td>{w.owner.email || '—'}</td>
                  <td>{w.plan}</td>
                  <td>{monthlySmsCredits(w.plan)}</td>
                  <td>{w.smsCredits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminShell>
  )
}
