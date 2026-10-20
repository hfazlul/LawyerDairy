import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, Briefcase, CalendarDays, ShieldCheck } from '@/components/icons'
import { Brand, SiteHeader, MobileTabBar } from '@/ui/site-chrome'

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
  eyebrow?: string
}

const benefits = [
  { icon: CalendarDays, text: 'তারিখ, কজ লিস্ট ও কাজ এক নজরে' },
  { icon: Briefcase, text: 'মামলা ও মক্কেলের তথ্য একই কর্মক্ষেত্রে' },
  { icon: ShieldCheck, text: 'নিরাপদ অ্যাকাউন্ট ও ডিভাইস সেশন' },
]

export function AuthShell({
  title,
  description,
  children,
  footer,
  eyebrow = 'MAMLAQ ACCOUNT',
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f3ea] pb-20 md:pb-0">
      <SiteHeader />
      <main className="relative isolate overflow-hidden px-4 py-8 sm:px-6 md:py-14 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(198,161,91,.16),transparent_28rem),radial-gradient(circle_at_85%_20%,rgba(30,58,95,.12),transparent_32rem)]" />
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-card backdrop-blur-xl lg:min-h-[650px] lg:grid-cols-[1.05fr_.95fr]">
          <section className="premium-grid relative hidden overflow-hidden bg-gradient-to-br from-navy-deep via-navy to-navy-soft p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brass/20 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="relative">
              <Brand light />
              <h2 className="mt-16 max-w-md font-bengali text-4xl font-extrabold leading-[1.25] tracking-tight">
                আপনার আইনি কাজের<br />শান্ত, গোছানো কর্মক্ষেত্র
              </h2>
              <p className="mt-5 max-w-md font-bengali text-base leading-8 text-white/68">
                আদালত, চেম্বার ও চলার পথে—একই তথ্য, একই হিসাব, একই ডায়েরি।
              </p>
            </div>
            <div className="relative space-y-3">
              {benefits.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brass/15 text-brass-soft">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-bengali text-sm text-white/82">{text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex items-center p-5 sm:p-9 lg:p-12 xl:p-16">
            <div className="mx-auto w-full max-w-md">
              <span className="eyebrow">{eyebrow}</span>
              <h1 className="mt-5 font-bengali text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{title}</h1>
              <p className="mt-3 font-bengali text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
              <div className="mt-8">{children}</div>
              {footer ? <div className="mt-6 border-t border-border/70 pt-5">{footer}</div> : null}
              <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-navy-soft no-underline hover:text-brass">
                হোমে ফিরুন <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <MobileTabBar />
    </div>
  )
}
