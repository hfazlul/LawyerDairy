'use client'

import { GA4_EVENT_NAMES, trackGa4Event } from '@/lib/ga4'

/** Create a ZiniPay invoice and leave this site for the hosted payment page. */
export async function startCheckout(packageCode: string, period: 'MONTH' | 'YEAR') {
  const res = await fetch('/api/web/v1/checkout/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageCode, period }),
  })
  let data: { checkoutUrl?: string | null; message?: string } = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }
  if (res.status === 401) {
    window.location.href = `/user/login?next=${encodeURIComponent(`/package?buy=${packageCode}`)}`
    return
  }
  if (!res.ok || !data.checkoutUrl) {
    throw new Error(
      data.message ||
        (res.ok
          ? 'পেমেন্ট এখন উপলব্ধ নয়। সাপোর্ট বা অ্যাডমিন অ্যাক্টিভেট ব্যবহার করুন।'
          : 'চেকআউট ব্যর্থ হয়েছে'),
    )
  }
  trackGa4Event(GA4_EVENT_NAMES.beginCheckout, { package_code: packageCode, period })
  window.location.href = data.checkoutUrl
}
