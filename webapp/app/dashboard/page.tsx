import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJwt } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import {
  isPremiumActive,
  hasCauseListAccess,
  hasCaseManageAccess,
  maxTeamMembers,
} from '@/lib/auth-middleware'
import {
  JURISDICTION_META,
  paymentRailFor,
  type JurisdictionCode,
} from '@/lib/jurisdiction'
import { contentFor } from '@/lib/content/jurisdictions'
import { limitationPackFor } from '@/lib/content/limitation'
import { BuyPackageButtons } from './buy-buttons'
import { LogoutButton } from './logout-button'
import { JurisdictionPicker } from './jurisdiction-picker'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const jar = await cookies()
  const token = jar.get('ldb_access')?.value
  const payload = token ? verifyJwt(token) : null
  if (!payload?.sub) redirect('/login?next=/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: payload.sub as string },
    include: { chamber: true },
  })
  if (!user) redirect('/login')

  const packages = await prisma.subscriptionPackage.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  const active = isPremiumActive(user.chamber.plan, user.chamber.subscriptionEndsAt)
  const causeList = hasCauseListAccess(user.chamber.plan, user.chamber.subscriptionEndsAt)
  const caseManage = hasCaseManageAccess(user.chamber.plan, user.chamber.subscriptionEndsAt)
  const teamMax = maxTeamMembers(user.chamber.plan, user.chamber.subscriptionEndsAt)

  const jurisdiction = user.chamber.jurisdiction as JurisdictionCode
  const meta = JURISDICTION_META[jurisdiction]
  const rail = paymentRailFor(jurisdiction)
  const content = contentFor(jurisdiction)
  const limPack = limitationPackFor(jurisdiction)
  const webCheckout = rail === 'sslcommerz_web'

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          Lawyer Diary
        </Link>
        <span className="country-pill">
          {meta.flag} {meta.nameEn}
        </span>
        <Link href="/packages">Packages</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/dashboard/documents">Documents</Link>
        {user.appRole === 'ADMIN' && <Link href="/admin">Admin</Link>}
        <LogoutButton />
      </nav>
      <main className="page">
        <h1 className="hero-title">Dashboard</h1>
        <p className="muted">
          {user.name} · {user.email || user.phone} · UI: {user.uiLanguage}
        </p>

        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>
            {meta.flag} Country / law pack
          </h2>
          <p>
            <strong>{meta.nameEn}</strong> ({jurisdiction}) · rail:{' '}
            <code>{rail}</code>
            {!user.chamber.jurisdictionConfirmed && (
              <span className="badge off" style={{ marginLeft: 8 }}>
                Confirm required
              </span>
            )}
          </p>
          <p className="muted">{content.limitationLabel} — {content.limitationActNote}</p>
          <p className="muted">
            Limitation rows: {limPack.rules.length}
            {limPack.rules.some((r) => r.scaffoldOnly) ? ' (scaffold placeholders)' : ' (BD schedule)'}
          </p>
          <JurisdictionPicker
            current={jurisdiction}
            uiLanguage={user.uiLanguage}
            confirmed={user.chamber.jurisdictionConfirmed}
          />
        </div>

        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>Subscription</h2>
          <p>
            Plan: <strong>{user.chamber.plan}</strong>{' '}
            <span className={`badge ${active ? 'ok' : 'off'}`}>
              {active ? 'Active' : 'Inactive'}
            </span>
          </p>
          {user.chamber.subscriptionEndsAt && (
            <p className="muted">
              Ends: {user.chamber.subscriptionEndsAt.toISOString().slice(0, 10)}
            </p>
          )}
          <ul className="muted" style={{ marginTop: '0.5rem' }}>
            <li>Cause-list API: {causeList ? 'unlocked' : 'locked (need STARTER+)'}</li>
            <li>Web case manage: {caseManage ? 'unlocked' : 'locked (need PRO_ADVANCE)'}</li>
            <li>Team seats: {teamMax}</li>
          </ul>
        </div>

        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>Documents</h2>
          <p className="muted">Scan & vault are phone-only.</p>
          <Link className="btn ghost" href="/dashboard/documents">
            Open placeholder
          </Link>
        </div>

        <h2 style={{ marginTop: '1.75rem' }}>Packages</h2>
        {webCheckout ? (
          <p className="muted">BD web checkout (SSLCommerz scaffold). Mobile has no buy CTA.</p>
        ) : (
          <p className="muted">
            {meta.nameEn}: purchase via Play Billing in the Android app — web buy buttons hidden.
          </p>
        )}
        <div className="grid-2" style={{ marginTop: '0.75rem' }}>
          {packages.length === 0 ? (
            <div className="card muted">
              No packages seeded yet — run <code>npm run db:seed</code>.
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
                {webCheckout ? (
                  <BuyPackageButtons packageCode={p.code} />
                ) : (
                  <p className="muted" style={{ marginTop: '0.5rem' }}>
                    Use Play Billing on phone
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  )
}
