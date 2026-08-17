'use client'

import { useState } from 'react'

/** Checkout scaffold — SSLCommerz/bKash wired later; creates PENDING subscription. */
export function BuyPackageButtons({ packageCode }: { packageCode: string }) {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function startCheckout() {
    setLoading(true)
    setMsg('')
    const res = await fetch('/api/web/v1/checkout/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageCode }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setMsg(data.message || 'Checkout failed')
      return
    }
    setMsg(
      data.checkoutUrl
        ? 'Redirecting…'
        : `Pending subscription created (${data.subscriptionId}). Gateway TODO.`,
    )
    if (data.checkoutUrl) window.location.href = data.checkoutUrl
  }

  if (packageCode === 'FREE') return null

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button className="btn" type="button" disabled={loading} onClick={startCheckout}>
        {loading ? '...' : 'Buy on web'}
      </button>
      {msg && <p className="muted" style={{ marginTop: '0.5rem' }}>{msg}</p>}
    </div>
  )
}
