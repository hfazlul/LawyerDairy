import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJwt } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { JURISDICTION_META, type JurisdictionCode } from '@/lib/jurisdiction'
import { LogoutButton } from '../logout-button'

export const dynamic = 'force-dynamic'

/** Documents / scan — phone only. Web shows placeholder. */
export default async function DocumentsPlaceholderPage() {
  const jar = await cookies()
  const token = jar.get('ldb_access')?.value
  const payload = token ? verifyJwt(token) : null
  if (!payload?.sub) redirect('/login?next=/dashboard/documents')

  const user = await prisma.user.findUnique({
    where: { id: payload.sub as string },
    include: { chamber: true },
  })
  if (!user) redirect('/login')

  const meta = JURISDICTION_META[user.chamber.jurisdiction as JurisdictionCode]

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          Lawyer Diary
        </Link>
        <span className="country-pill">
          {meta.flag} {meta.nameEn}
        </span>
        <Link href="/dashboard">Dashboard</Link>
        <LogoutButton />
      </nav>
      <main className="page">
        <h1 className="hero-title">Documents</h1>
        <div className="card" style={{ marginTop: '1rem', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <p style={{ fontSize: '2.5rem', margin: 0 }} aria-hidden>
            📱
          </p>
          <h2 style={{ marginTop: '0.75rem' }}>Available only on phone app</h2>
          <p className="muted">
            Document scan, OCR prefill, and the case vault run on Android. Use the Play Store app
            to capture and sync files — this web surface stays read-only for diary/cause-list.
          </p>
          <Link className="btn" href="/dashboard" style={{ marginTop: '1rem' }}>
            Back to dashboard
          </Link>
        </div>
      </main>
    </>
  )
}
