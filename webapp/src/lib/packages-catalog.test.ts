import assert from 'node:assert/strict'
import test from 'node:test'
import { fallbackMobileCatalog, mobileCatalogFromRows, packagePeriod } from './packages-catalog'
import { isSellablePackage } from './plans'
import { extraTeamSeats, extraTeamSeatsAllowed, monthlySmsCredits } from './permissions'
import { freeCapsForMonth, freeMonthNumber } from './free-caps'
import { monthsForQualifiedCount } from './referral'
import { extractInvoiceId, zinipayConfigured } from './zinipay'
import { FEATURE_MATRIX } from './plans'

test('v2 catalog is FREE + 4 paid SKUs at new prices', () => {
  const rows = fallbackMobileCatalog()
  const byCode = Object.fromEntries(rows.map((r) => [r.code, r]))
  assert.equal(byCode.FREE.priceBdt, 0)
  assert.equal(byCode.STARTER.priceBdt, 49)
  assert.equal(byCode.STARTER.yearlyBdt, 530)
  assert.equal(byCode.PRO.priceBdt, 99)
  assert.equal(byCode.PRO.yearlyBdt, 1069)
  assert.equal(byCode.PRO_ADVANCE, undefined)
  assert.equal(byCode.ADVANCE, undefined)
  assert.equal(rows.some((r) => r.code === 'CHAMBER'), false)
  assert.equal(rows.some((r) => r.code === 'SMS_500'), false)
  assert.equal(JSON.stringify(rows).includes('checkoutUrl'), false)
})

test('legacy CHAMBER is not sellable; STARTER is', () => {
  assert.equal(isSellablePackage('STARTER'), true)
  assert.equal(isSellablePackage('PRO'), true)
  assert.equal(isSellablePackage('ADVANCE'), false)
  assert.equal(isSellablePackage('PRO_ADVANCE'), false)
  assert.equal(isSellablePackage('CHAMBER'), false)
  assert.equal(isSellablePackage('SMS_500'), false)
  assert.equal(isSellablePackage('FREE'), false)
  const mapped = mobileCatalogFromRows([
    {
      id: '1',
      code: 'CHAMBER',
      nameBn: 'চ',
      nameEn: 'C',
      priceBdt: 799,
      yearlyBdt: null,
      featuresJson: [],
      smsMonthly: 280,
      smsYearly: 3360,
      teamSeats: 7,
      autoHearingSms: true,
      careerFull: true,
      adsOff: true,
      active: false,
      sortOrder: 90,
      createdAt: new Date(),
    },
    {
      id: '2',
      code: 'STARTER',
      nameBn: 'স',
      nameEn: 'S',
      priceBdt: 49,
      yearlyBdt: 530,
      featuresJson: [],
      smsMonthly: 0,
      smsYearly: 0,
      teamSeats: 2,
      autoHearingSms: false,
      careerFull: true,
      adsOff: true,
      active: true,
      sortOrder: 1,
      createdAt: new Date(),
    },
  ] as never)
  assert.equal(mapped.some((r) => r.code === 'CHAMBER'), false)
  assert.equal(mapped.some((r) => r.code === 'STARTER'), true)
  assert.equal(packagePeriod('STARTER', 49), 'month')
})

test('team seats and SMS quotas match v2 packages', () => {
  assert.equal(extraTeamSeats('FREE'), 1)
  assert.equal(extraTeamSeats('STARTER'), 2)
  assert.equal(extraTeamSeats('PRO'), 5)
  assert.equal(extraTeamSeats('PRO_ADVANCE'), 7)
  assert.equal(extraTeamSeats('ADVANCE'), 7)
  assert.equal(monthlySmsCredits('FREE'), 0)
  assert.equal(monthlySmsCredits('STARTER'), 0)
  assert.equal(monthlySmsCredits('PRO'), 150)
  assert.equal(monthlySmsCredits('PRO_ADVANCE'), 280)
  assert.equal(monthlySmsCredits('ADVANCE'), 400)
  assert.equal(extraTeamSeatsAllowed('FREE', { paid: false, trialActive: true }), 1)
  assert.equal(extraTeamSeatsAllowed('FREE', { paid: false, trialActive: false }), 0)
})

test('free caps month 1 vs later', () => {
  assert.deepEqual(freeCapsForMonth(1), { clients: 20, cases: 20, hearings: 20, findLawyerReceive: 5 })
  assert.deepEqual(freeCapsForMonth(2), { clients: 10, cases: 10, hearings: 10, findLawyerReceive: 3 })
  const created = new Date('2026-09-01T00:00:00Z')
  assert.equal(freeMonthNumber(created, new Date('2026-09-13T00:00:00Z')), 1)
  assert.equal(freeMonthNumber(created, new Date('2026-10-01T00:00:00Z')), 2)
})

test('referral months: ladder with gaps on the previous tier', () => {
  assert.equal(monthsForQualifiedCount(0), 0)
  assert.equal(monthsForQualifiedCount(1), 1)
  assert.equal(monthsForQualifiedCount(2), 2)
  assert.equal(monthsForQualifiedCount(3), 2)
  assert.equal(monthsForQualifiedCount(4), 2)
  assert.equal(monthsForQualifiedCount(5), 3)
  assert.equal(monthsForQualifiedCount(7), 3)
  assert.equal(monthsForQualifiedCount(8), 4)
  assert.equal(monthsForQualifiedCount(11), 4)
  assert.equal(monthsForQualifiedCount(12), 5)
  assert.equal(monthsForQualifiedCount(13), 5)
  assert.equal(monthsForQualifiedCount(14), 6)
  assert.equal(monthsForQualifiedCount(15), 6)
  assert.equal(monthsForQualifiedCount(16), 7)
})

test('ZiniPay is unconfigured without key; invoice id parsed from URL', () => {
  const prev = process.env.ZINIPAY_API_KEY
  delete process.env.ZINIPAY_API_KEY
  assert.equal(zinipayConfigured(), false)
  assert.equal(extractInvoiceId({}, 'https://secure.zinipay.com/payment/INV99'), 'INV99')
  if (prev !== undefined) process.env.ZINIPAY_API_KEY = prev
})

test('feature matrix has 4 paid columns', () => {
  assert.ok(FEATURE_MATRIX.length >= 6)
  assert.ok(FEATURE_MATRIX.every((r) => r.starter && r.advance))
})
