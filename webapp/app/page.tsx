import Link from 'next/link'
import {
  guideVideoEmbedUrl,
  playStoreUrl,
  JURISDICTION_META,
  type JurisdictionCode,
} from '@/lib/jurisdiction'

const DEFAULT_JURISDICTION: JurisdictionCode = 'BD'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ j?: string }>
}) {
  const sp = await searchParams
  const jParam = (sp?.j || '').toUpperCase()
  const jurisdiction: JurisdictionCode =
    jParam === 'PK' || jParam === 'IN' || jParam === 'BD' ? jParam : DEFAULT_JURISDICTION
  const meta = JURISDICTION_META[jurisdiction]
  const embed = guideVideoEmbedUrl(jurisdiction)
  const playUrl = playStoreUrl()

  return (
    <>
      <nav className="nav">
        <span className="brand">Lawyer Diary</span>
        <Link href="/packages">Packages</Link>
        <Link href="/login">Login</Link>
        <Link href="/signup">Signup</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/admin">Admin</Link>
      </nav>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <p className="landing-eyebrow">
              {meta.flag} {meta.nameEn} · content pack
            </p>
            <h1 className="landing-brand">Lawyer Diary</h1>
            <p className="landing-tagline">
              Offline-first diary for advocates — sync entitlement across phone and web.
            </p>

            <div className="store-cards">
              <a
                className="store-card store-card-android"
                href={playUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div className="store-logo" aria-hidden>
                  LD
                </div>
                <div>
                  <strong>Android app</strong>
                  <p>Go to Play Store</p>
                </div>
              </a>
              <div className="store-card store-card-ios" aria-disabled>
                <div className="store-logo store-logo-muted" aria-hidden>
                  iOS
                </div>
                <div>
                  <strong>iPhone</strong>
                  <p>Coming Soon</p>
                </div>
              </div>
            </div>

            <div className="jurisdiction-switch">
              <span className="muted">Law pack:</span>
              {(['BD', 'IN', 'PK'] as const).map((code) => (
                <Link
                  key={code}
                  href={code === 'BD' ? '/' : `/?j=${code}`}
                  className={code === jurisdiction ? 'chip on' : 'chip'}
                >
                  {JURISDICTION_META[code].flag} {code}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section">
          <h2>Why lawyers use it</h2>
          <p className="muted">One job per outcome — less missed dates, cleaner fees, lower risk.</p>
          <div className="benefits-grid">
            <div>
              <h3>Time</h3>
              <p>Today’s board + reminders so hearings and limitation clocks stay visible.</p>
            </div>
            <div>
              <h3>Money</h3>
              <p>Fee ledger and payment visuals without juggling spreadsheets in court.</p>
            </div>
            <div>
              <h3>Risk</h3>
              <p>Limitation calculators and checklists reduce deadline and filing misses.</p>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <h2>Guide video</h2>
          <p className="muted">
            {meta.guideVideoKey}
            {meta.guideMayMentionWebPay
              ? ' · may soft-mention web packages (BD)'
              : ' · no web-pay steering (IN/PK)'}
          </p>
          <div className="video-frame">
            <iframe
              title={`Guide ${jurisdiction}`}
              src={embed}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>

        <section className="landing-section landing-cta">
          <Link className="btn" href="/signup">
            Create web account
          </Link>
          <Link className="btn ghost" href="/packages">
            View packages
          </Link>
        </section>
      </main>
    </>
  )
}
