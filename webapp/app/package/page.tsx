import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { getCms } from '@/lib/cms'
import { MobileTabBar, SiteFooter, SiteHeader } from '@/ui/site-chrome'
import { FeatureMatrix, PackageCards } from '@/ui/packages'
import { BuyButtons } from './buy-buttons'

export const dynamic = 'force-dynamic'

export default async function PackagePage() {
  const cms = await getCms()
  const authed = Boolean((await cookies()).get('ldb_access')?.value)
  return (
    <div className="min-h-screen bg-[#eef1f6] pb-20 md:pb-0">
      <SiteHeader authed={authed} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="font-bengali text-3xl font-extrabold text-navy">প্যাকেজ</h1>
        <p className="mt-2 max-w-2xl font-bengali text-muted-foreground">
          পেমেন্ট শুধু এই ওয়েবসাইট থেকে। মোবাইল অ্যাপে আলাদা বিলিং নেই।
        </p>
        <div className="mt-8">
          <PackageCards showBuy />
        </div>
        <h2 className="mt-12 font-bengali text-xl font-bold text-navy">আনলক ম্যাট্রিক্স</h2>
        <div className="mt-4">
          <FeatureMatrix />
        </div>
        <h2 className="mt-12 font-bengali text-xl font-bold text-navy">কিনুন</h2>
        <Suspense fallback={<p className="mt-3 font-bengali text-muted-foreground">লোড হচ্ছে…</p>}>
          <BuyButtons />
        </Suspense>
      </main>
      <SiteFooter blurb={cms.footerBlurb} email={cms.contactEmail} phone={cms.contactPhone} whatsapp={cms.contactWhatsapp} />
      <MobileTabBar authed={authed} />
    </div>
  )
}
