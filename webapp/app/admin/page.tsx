import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJwt } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { CampaignPanel } from './campaign-panel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const jar = await cookies()
  const token = jar.get('ldb_access')?.value
  const payload = token ? verifyJwt(token) : null
  if (!payload?.sub) redirect('/login?next=/admin')

  const admin = await prisma.user.findUnique({ where: { id: payload.sub as string } })
  if (!admin || admin.appRole !== 'ADMIN') redirect('/dashboard')

  const clients = await prisma.user.findMany({
    where: { appRole: 'USER' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      chamber: { select: { plan: true, subscriptionEndsAt: true, name: true, jurisdiction: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">Lawyer Diary BD · Admin</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/admin">Clients</Link>
      </nav>
      <main className="page">
        <h1 className="hero-title">Admin dashboard</h1>
        <p className="muted">Owner view — all clients (email, phone) + email campaigns.</p>

        <CampaignPanel />

        <h2 style={{ marginTop: '1.75rem' }}>Clients ({clients.length})</h2>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Juris.</th>
                <th>Ends</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.phone}</td>
                  <td>{c.chamber.plan}</td>
                  <td>{c.chamber.jurisdiction}</td>
                  <td className="muted">
                    {c.chamber.subscriptionEndsAt
                      ? c.chamber.subscriptionEndsAt.toISOString().slice(0, 10)
                      : '—'}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">No clients yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
