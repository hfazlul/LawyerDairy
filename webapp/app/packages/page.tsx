import Link from 'next/link'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/jwt'
import { JURISDICTION_META, paymentRailFor, type JurisdictionCode } from '@/lib/jurisdiction'
import { BuyPackageButtons } from '../dashboard/buy-buttons'

export const dynamic = 'force-dynamic'

export default async function PackagesPage() {
  const packages = await prisma.subscriptionPackage.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  const jar = await cookies()
  const token = jar.get('ldb_access')?.value
  const payload = token ? verifyJwt(token) : null
  let jurisdiction: JurisdictionCode = 'BD'
  let loggedIn = false
  if (payload?.sub) {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      include: { chamber: true },
    })
    if (user) {
      loggedIn = true
      jurisdiction = user.chamber.jurisdiction as JurisdictionCode
    }
  }

  const rail = paymentRailFor(jurisdiction)
  const meta = JURISDICTION_META[jurisdiction]
  const webCheckout = rail === 'sslcommerz_web'

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          Lawyer Diary
        </Link>
        <Link href="/packages">Packages</Link>
        <Link href="/login">Login</Link>
        <Link href="/signup">Signup</Link>
        {loggedIn && <Link href="/dashboard">Dashboard</Link>}
      </nav>
      <main className="page">
        <h1 className="hero-title">Packages</h1>
        <p className="muted">
          {meta.flag} {meta.nameEn} · payment rail: <code>{rail}</code>
        </p>

        {!webCheckout && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h2>Play Billing (mobile)</h2>
            <p className="muted">
              For {meta.nameEn}, subscriptions are purchased in the Android app via Google Play.
              This page lists tiers for reference — web SSLCommerz checkout is BD-only.
            </p>
          </div>
        )}

        {webCheckout && (
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Bangladesh: buy on web (SSLCommerz scaffold). Mobile shows Active/Inactive only — no buy CTA.
          </p>
        )}

        <div className="grid-2" style={{ marginTop: '1rem' }}>
          {packages.length === 0 ? (
            <div className="card muted">
              No packages — run <code>npm run db:seed</code>.
            </div>
          ) : (
            packages.map((p) => (
              <div className="card" key={p.id}>
                <h3>{p.nameBn}</h3>
                <p className="muted">
                  {p.nameEn} · {p.code}
                </p>
                <p>
                  <strong>৳{p.priceBdt}</strong>/mo
                  {p.yearlyBdt != null && <> · ৳{p.yearlyBdt}/yr</>}
                </p>
                {webCheckout && loggedIn ? (
                  <BuyPackageButtons packageCode={p.code} />
                ) : webCheckout && !loggedIn ? (
                  <p className="muted" style={{ marginTop: '0.75rem' }}>
                    <Link href="/login?next=/packages">Login</Link> to purchase.
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  )
}
