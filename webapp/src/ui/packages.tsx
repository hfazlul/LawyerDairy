import Link from 'next/link'
import { FEATURE_MATRIX, PACKAGE_DEFS } from '@/lib/plans'
import { Button } from '@/components/ui/button'
import { CheckoutButton } from '@/ui/checkout-button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PAID = PACKAGE_DEFS.filter((p) => p.code !== 'FREE' && p.active)

function featureLabel(feature: string) {
  const labels: Record<string, string> = {
    ads_off: 'বিজ্ঞাপন ছাড়া ব্যবহার', unlimited_diary: 'সীমাহীন মামলা ডায়েরি',
    career_full: 'উপলব্ধ ক্যারিয়ার কনটেন্টে পূর্ণ অ্যাক্সেস', no_auto_sms: 'স্বয়ংক্রিয় SMS অন্তর্ভুক্ত নয়',
    notifications: 'নোটিফিকেশন', law_books: 'আইনের বই', calculators: 'আইনি ক্যালকুলেটর',
    templates: 'খসড়া ও টেমপ্লেট', career_20: 'ক্যারিয়ারের সীমিত কনটেন্ট', ads_on: 'বিজ্ঞাপনসহ ব্যবহার',
  }
  if (labels[feature]) return labels[feature]
  if (/^team_\d+$/.test(feature)) return `${Number(feature.slice(5)).toLocaleString('bn-BD')}টি টিম সিট (মালিক ছাড়া)`
  if (/^sms_\d+$/.test(feature)) return `মাসিক ${Number(feature.slice(4)).toLocaleString('bn-BD')}টি স্বয়ংক্রিয় শুনানির SMS`
  return 'প্যাকেজের অতিরিক্ত সুবিধা'
}

export function PackageCards(props: { detailsHref?: string; showBuy?: boolean }) {
  const details = props.detailsHref ?? '/package'
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {PAID.map((p, i) => (
        <Card
          key={p.code}
          className={cn(
            'flex flex-col border-border/80 bg-white transition hover:shadow-card',
            i === 1 && 'ring-2 ring-brass/40',
          )}
        >
          <CardHeader className="space-y-2 pb-3">
            {i === 1 ? <Badge variant="brass" className="w-fit font-bengali">টিমের জন্য</Badge> : null}
            <CardTitle className="text-xl">{p.nameEn}</CardTitle>
            <CardDescription className="font-bengali text-sm">{p.nameBn}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div>
              <div className="font-bengali text-3xl font-extrabold text-navy">
                ৳{p.priceBdt}
                <span className="text-base font-semibold text-muted-foreground">/মাস</span>
              </div>
              <p className="mt-1 font-bengali text-sm text-muted-foreground">বাৎসরিক ৳{p.yearlyBdt} (~১০% ছাড়)</p>
            </div>
            <ul className="space-y-2 font-bengali text-sm text-muted-foreground">
              {p.featuresJson.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
                  {featureLabel(f)}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="gap-2 pt-0">
            <Button asChild variant="outline" className="flex-1 font-bengali">
              <Link href={details}>বিস্তারিত</Link>
            </Button>
            {props.showBuy ? <CheckoutButton packageCode={p.code} /> : null}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export function FeatureMatrix() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-soft">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-navy text-white">
            <th className="px-3 py-3 text-left font-bengali font-semibold">ফিচার</th>
            <th className="px-3 py-3 text-left font-semibold">ফ্রি</th>
            <th className="px-3 py-3 text-left font-semibold">Starter</th>
            <th className="px-3 py-3 text-left font-semibold">Pro</th>
            {/* Paused paid tiers. Uncomment with the catalog when they are sold again.
            <th className="px-3 py-3 text-left font-semibold">Pro Advance</th>
            <th className="px-3 py-3 text-left font-semibold">Advance</th>
            */}
          </tr>
        </thead>
        <tbody>
          {FEATURE_MATRIX.map((r, idx) => (
            <tr key={r.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-secondary/40'}>
              <td className="border-t border-border px-3 py-2.5 font-bengali">{r.labelBn}</td>
              <td className="border-t border-border px-3 py-2.5">{r.free}</td>
              <td className="border-t border-border px-3 py-2.5">{r.starter}</td>
              <td className="border-t border-border px-3 py-2.5">{r.pro}</td>
              {/* Paused paid tiers.
              <td className="border-t border-border px-3 py-2.5">{r.proAdvance}</td>
              <td className="border-t border-border px-3 py-2.5">{r.advance}</td>
              */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
