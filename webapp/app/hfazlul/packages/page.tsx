import { requireAdminPage } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { AdminShell } from '@/ui/app-nav'

export const dynamic = 'force-dynamic'

export default async function AdminPackagesPage() {
  await requireAdminPage('/hfazlul/packages')
  const rows = await prisma.subscriptionPackage.findMany({ orderBy: { sortOrder: 'asc' } })
  return (
    <AdminShell title="Packages">
        {rows.map((p) => (
          <form key={p.id} className="card" action="/api/admin/packages" method="post" style={{ marginTop: '0.75rem' }}>
            <input type="hidden" name="id" value={p.id} />
            <strong>{p.code}</strong>
            <div className="grid-2">
              <input className="input" name="nameBn" defaultValue={p.nameBn} />
              <input className="input" name="nameEn" defaultValue={p.nameEn} />
              <input className="input" name="priceBdt" type="number" defaultValue={p.priceBdt} />
              <input className="input" name="yearlyBdt" type="number" defaultValue={p.yearlyBdt ?? 0} />
              <input className="input" name="smsMonthly" type="number" defaultValue={p.smsMonthly} />
              <input className="input" name="teamSeats" type="number" defaultValue={p.teamSeats} />
            </div>
            <label><input type="checkbox" name="active" defaultChecked={p.active} /> active</label>
            {' '}
            <button className="btn" type="submit">Update</button>
          </form>
        ))}
      </AdminShell>
  )
}
