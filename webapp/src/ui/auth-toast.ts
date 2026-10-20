/** Floating navy toast for auth validation. One message at a time. */
export function showAuthToast(message: string) {
  if (typeof document === 'undefined') return
  const id = 'auth-toast'
  document.getElementById(id)?.remove()
  const el = document.createElement('div')
  el.id = id
  el.setAttribute('role', 'status')
  el.textContent = message
  el.className =
    'fixed bottom-24 left-1/2 z-[80] w-[min(92vw,440px)] -translate-x-1/2 rounded-2xl border border-[#c6a15b] bg-[#12263f] px-4 py-3 text-center font-bengali text-sm font-semibold leading-6 text-white shadow-lg'
  document.body.appendChild(el)
  window.setTimeout(() => el.remove(), 4200)
}
