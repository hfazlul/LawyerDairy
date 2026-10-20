'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { PACKAGE_DEFS } from '@/lib/plans'
import { GA4_EVENT_NAMES, trackGa4Event } from '@/lib/ga4'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function BuyButtons() {
  const params = useSearchParams()
  const preset = params.get('buy') || 'STARTER'
  const [code, setCode] = useState(preset)
  const [period, setPeriod] = useState<'MONTH' | 'YEAR'>('MONTH')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const paid = PACKAGE_DEFS.filter((p) => p.active && p.priceBdt > 0)

  async function buy() {
    setLoading(true)
    setMsg('')
    const res = await fetch('/api/web/v1/checkout/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageCode: code, period }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.status === 401) {
      window.location.href = `/user/login?next=${encodeURIComponent(`/package?buy=${code}`)}`
      return
    }
    if (!res.ok) {
      setMsg(data.message || 'চেকআউট ব্যর্থ হয়েছে')
      return
    }
    if (data.checkoutUrl) {
      trackGa4Event(GA4_EVENT_NAMES.beginCheckout, { package_code: code, period })
      window.location.href = data.checkoutUrl
      return
    }
    setMsg(data.message || 'পেমেন্ট এখন উপলব্ধ নয়। সাপোর্ট বা অ্যাডমিন অ্যাক্টিভেট ব্যবহার করুন।')
  }

  return (
    <Card className="mt-4 max-w-lg">
      <CardHeader>
        <CardTitle className="font-bengali">সাবস্ক্রিপশন কিনুন</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="pkg" className="font-bengali">প্যাকেজ</Label>
          <select
            id="pkg"
            className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          >
            {paid.map((p) => (
              <option key={p.code} value={p.code}>
                {p.nameEn} — ৳{p.priceBdt}/মাস · ৳{p.yearlyBdt}/বছর
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-4 font-bengali text-sm">
          <label className={cn('flex cursor-pointer items-center gap-2', period === 'MONTH' && 'font-semibold')}>
            <input type="radio" checked={period === 'MONTH'} onChange={() => setPeriod('MONTH')} />
            মাসিক
          </label>
          <label className={cn('flex cursor-pointer items-center gap-2', period === 'YEAR' && 'font-semibold')}>
            <input type="radio" checked={period === 'YEAR'} onChange={() => setPeriod('YEAR')} />
            বাৎসরিক (~১০% ছাড়)
          </label>
        </div>
        <Button type="button" disabled={loading} onClick={buy} className="font-bengali w-full sm:w-auto">
          {loading ? 'অপেক্ষা করুন…' : 'পেমেন্ট শুরু করুন'}
        </Button>
        {msg ? <p className="font-bengali text-sm text-muted-foreground">{msg}</p> : null}
      </CardContent>
    </Card>
  )
}
