import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GA4_EVENT_NAMES,
  GA_MEASUREMENT_ID_ENV,
  ga4Configured,
  gaMeasurementIdFromEnv,
  trackGa4Event,
} from './ga4'

test('GA4 env name is NEXT_PUBLIC_GA_MEASUREMENT_ID', () => {
  assert.equal(GA_MEASUREMENT_ID_ENV, 'NEXT_PUBLIC_GA_MEASUREMENT_ID')
})

test('empty or placeholder Measurement ID is not configured', () => {
  assert.equal(gaMeasurementIdFromEnv(''), '')
  assert.equal(gaMeasurementIdFromEnv('   '), '')
  assert.equal(gaMeasurementIdFromEnv('G-XXXXXXXX'), '')
  assert.equal(gaMeasurementIdFromEnv('UA-123456-1'), '')
  assert.equal(gaMeasurementIdFromEnv("G-ABC';alert(1)"), '')
  assert.equal(ga4Configured(''), false)
})

test('valid G- Measurement ID is accepted without inventing one', () => {
  assert.equal(gaMeasurementIdFromEnv('g-abc12xyz'), 'G-ABC12XYZ')
  assert.equal(ga4Configured('G-ABC12XYZ'), true)
})

test('event name catalog matches mobile analytics helpers', () => {
  assert.equal(GA4_EVENT_NAMES.pageView, 'page_view')
  assert.equal(GA4_EVENT_NAMES.subscriptionView, 'subscription_view')
  assert.equal(GA4_EVENT_NAMES.beginCheckout, 'begin_checkout')
  assert.equal(GA4_EVENT_NAMES.careerLessonOpen, 'career_lesson_open')
})

test('trackGa4Event no-ops in Node without gtag (does not fake a property)', () => {
  const prev = process.env[GA_MEASUREMENT_ID_ENV]
  delete process.env[GA_MEASUREMENT_ID_ENV]
  assert.equal(trackGa4Event('page_view'), false)
  process.env[GA_MEASUREMENT_ID_ENV] = 'G-ABC12XYZ'
  assert.equal(trackGa4Event('page_view'), false)
  if (prev === undefined) delete process.env[GA_MEASUREMENT_ID_ENV]
  else process.env[GA_MEASUREMENT_ID_ENV] = prev
})

test('process env Measurement ID is accepted without printing the value', () => {
  const id = gaMeasurementIdFromEnv()
  if (!id) {
    assert.equal(ga4Configured(), false)
    return
  }
  assert.equal(ga4Configured(), true)
  assert.match(id, /^G-[A-Z0-9]+$/)
  assert.equal(/^G-X+$/i.test(id), false)
})
