import type { ReactNode } from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getCms } from '@/lib/cms'
import { MobileTabBar, SiteFooter, SiteHeader } from '@/ui/site-chrome'

export default async function ToolsLayout({ children }: { children: ReactNode }) {
  const cms = await getCms()
  const authed = Boolean((await cookies()).get('ldb_access')?.value)
  return (
    <div className="min-h-screen bg-[#f7f3ea] pb-20 md:pb-0">
      <SiteHeader authed={authed} />
      <div className="mx-auto max-w-5xl px-5 pt-4">
        <Link href="/tools" className="font-bengali text-sm font-bold text-navy-soft no-underline hover:underline">
          ← সব ক্যালকুলেটর
        </Link>
      </div>
      {children}
      <SiteFooter
        blurb={cms.footerBlurb}
        email={cms.contactEmail}
        phone={cms.contactPhone}
        whatsapp={cms.contactWhatsapp}
      />
      <MobileTabBar authed={authed} />
    </div>
  )
}
