/** Full-page form POST — clears httpOnly cookies server-side and redirects. */
export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        className="btn ghost"
        type="submit"
        style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
      >
        Logout
      </button>
    </form>
  )
}
