import { cookies } from 'next/headers'
import { getCms } from '@/lib/cms'
import { MobileTabBar, SiteFooter, SiteHeader } from '@/ui/site-chrome'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MessageCircle, Send } from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const cms = await getCms()
  const authed = Boolean((await cookies()).get('ldb_access')?.value)
  const rows = [
    { icon: Mail, label: 'ইমেইল', value: cms.contactEmail },
    { icon: Phone, label: 'ফোন', value: cms.contactPhone },
    { icon: MessageCircle, label: 'WhatsApp', value: cms.contactWhatsapp },
    { icon: Send, label: 'Telegram', value: cms.contactTelegram },
  ]
  return (
    <div className="min-h-screen bg-[#eef1f6] pb-20 md:pb-0">
      <SiteHeader authed={authed} />
      <main className="mx-auto max-w-xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="font-bengali text-3xl font-extrabold text-navy">যোগাযোগ</h1>
        <p className="mt-2 font-bengali text-muted-foreground">{cms.contactIntro || 'আমাদের সাথে যোগাযোগ করুন।'}</p>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-bengali">যোগাযোগের তথ্য</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.map((r) => {
              const Icon = r.icon
              return (
                <div key={r.label} className="flex items-start gap-3 font-bengali">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground">{r.label}</div>
                    <div className="text-sm font-medium text-navy">{r.value || '—'}</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </main>
      <SiteFooter blurb={cms.footerBlurb} email={cms.contactEmail} phone={cms.contactPhone} whatsapp={cms.contactWhatsapp} />
      <MobileTabBar authed={authed} />
    </div>
  )
}
