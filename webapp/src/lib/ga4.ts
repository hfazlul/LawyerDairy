/**
 * GA4 Measurement ID helper. Never invent a property.
 * Public gtag loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID matches G-XXXX.
 * Next.js replaces direct NEXT_PUBLIC_* access in client bundles at build time.
 */

export const GA_MEASUREMENT_ID_ENV = 'NEXT_PUBLIC_GA_MEASUREMENT_ID'

/** Same names as mobile `AnalyticsEvents` plus web page beacons. */
export const GA4_EVENT_NAMES = {
  pageView: 'page_view',
  appOpen: 'app_open',
  addClient: 'add_client',
  addCase: 'add_case',
  subscriptionView: 'subscription_view',
  beginCheckout: 'begin_checkout',
  referralOpen: 'referral_open',
  referralApply: 'referral_apply',
  paywallShown: 'paywall_shown',
  findLawyerOpen: 'find_lawyer_open',
  careerOpen: 'career_open',
  careerLessonOpen: 'career_lesson_open',
  userDashboard: 'user_dashboard',
  adminView: 'admin_view',
} as const

const GA_ID = /^G-[A-Z0-9]+$/i
const PLACEHOLDER_ID = /^G-X+$/i

function readGaEnv(raw?: string): string {
  if (raw !== undefined) return raw.trim()
  return String(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '').trim()
}

export function gaMeasurementIdFromEnv(raw?: string): string {
  const id = readGaEnv(raw)
  if (!GA_ID.test(id) || PLACEHOLDER_ID.test(id)) return ''
  return id.toUpperCase()
}

export function ga4Configured(raw?: string): boolean {
  return gaMeasurementIdFromEnv(raw) !== ''
}

type GtagFn = (...args: unknown[]) => void

function windowGtag(): GtagFn | null {
  if (typeof window === 'undefined') return null
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag
  return typeof gtag === 'function' ? gtag : null
}

/** Returns true only when a real Measurement ID is set and gtag is present. */
export function trackGa4Event(name: string, params?: Record<string, unknown>): boolean {
  if (!ga4Configured()) return false
  const gtag = windowGtag()
  if (!gtag) return false
  const event = name.replace(/[^a-z0-9_]/gi, '_').slice(0, 40)
  if (!event) return false
  gtag('event', event, params ?? {})
  return true
}
