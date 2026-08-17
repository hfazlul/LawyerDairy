import Link from 'next/link'

type Props = {
  searchParams?: Promise<{ error?: string }>
}

export default async function SignupPage({ searchParams }: Props) {
  const params = (await searchParams) || {}
  const error = params.error || ''

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          Lawyer Diary
        </Link>
        <Link href="/login">Login</Link>
      </nav>
      <main className="page" style={{ maxWidth: 420 }}>
        <h1 className="hero-title">Signup</h1>
        <p className="muted">
          Confirm country (law pack) and UI language — content follows jurisdiction, not language.
        </p>
        {/* Native form POST — Set-Cookie + 303 → /dashboard (works with JS disabled). */}
        <form className="card" action="/api/auth/signup" method="post" style={{ marginTop: '1rem' }}>
          <div className="field">
            <label className="label" htmlFor="name">
              name
            </label>
            <input
              id="name"
              className="input"
              type="text"
              name="name"
              required
              minLength={2}
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="email">
              email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              name="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="phone">
              phone
            </label>
            <input
              id="phone"
              className="input"
              type="tel"
              name="phone"
              required
              minLength={11}
              maxLength={20}
              placeholder="017XXXXXXXX"
              autoComplete="tel"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">
              password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="jurisdiction">
              Country / law pack
            </label>
            <select id="jurisdiction" className="input" name="jurisdiction" defaultValue="BD">
              <option value="BD">🇧🇩 Bangladesh</option>
              <option value="IN">🇮🇳 India (WB/Tripura)</option>
              <option value="PK">🇵🇰 Pakistan</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="uiLanguage">
              UI language
            </label>
            <select id="uiLanguage" className="input" name="uiLanguage" defaultValue="bn">
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
              <option value="ur">اردو</option>
            </select>
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit">
            Create account
          </button>
        </form>
      </main>
    </>
  )
}
