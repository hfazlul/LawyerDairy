'use client'

import { useEffect } from 'react'
import { trackGa4Event } from '@/lib/ga4'

/** First-party page view for admin analytics + GA4 gtag when Measurement ID is set. */
export function TrackBeacon({ name = 'page_view' }: { name?: string }) {
  useEffect(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    fetch('/api/mobile/v1/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'web', events: [{ name, path }] }),
      keepalive: true,
    }).catch(() => {})
    trackGa4Event(name, { page_path: path })
  }, [name])
  return null
}
