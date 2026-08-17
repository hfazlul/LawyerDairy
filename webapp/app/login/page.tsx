import Link from 'next/link'

type Props = {
  searchParams?: Promise<{ error?: string; next?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = (await searchParams) || {}
  const error = params.error || ''
  const next = params.next && params.next.startsWith('/') && !params.next.startsWith('//')
    ? params.next
    : '/dashboard'

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          Lawyer Diary BD
        </Link>
        <Link href="/signup">Signup</Link>
      </nav>
      <main className="page" style={{ maxWidth: 420 }}>
        <h1 className="hero-title">Login</h1>
        <p className="muted">Web email/password · Mobile uses phone OTP separately.</p>
        {/* Native form POST — Set-Cookie + 303 redirect (no client fetch). */}
        <form className="card" action="/api/auth/login" method="post" style={{ marginTop: '1rem' }}>
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label className="label" htmlFor="email">
              Email
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
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit">
            Login
          </button>
        </form>
      </main>
    </>
  )
}
