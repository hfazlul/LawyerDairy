import type { ReactNode } from 'react'

/** Private admin entrance. No public site chrome and no path names. */
export function AdminGate({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea] px-4 py-12">
      <div className="w-full max-w-[440px] rounded-3xl border border-[#e7dfd0] bg-white px-8 py-10 shadow-[0_24px_60px_rgba(14,27,44,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c6a15b]">Mamlaq</p>
        <h1 className="mt-4 font-bengali text-3xl font-extrabold tracking-tight text-[#12263f]">{title}</h1>
        <p className="mt-2 font-bengali text-sm leading-7 text-[#5c6b7a]">{description}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}
