import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  UNKNOWN_PACKAGE_BN,
  buyerFacingCheckoutMessage,
  resolveCheckoutPackage,
} from './checkout-package'
import { PACKAGE_DEFS, PAID_SKU_CODES, amountFor, defFor } from './plans'

test('Pro monthly id posted by the buy form is the catalog id the server accepts', () => {
  const pro = defFor('PRO')
  assert.ok(pro)
  const monthly = resolveCheckoutPackage('PRO', 'MONTH')
  const yearly = resolveCheckoutPackage('PRO', 'YEAR')
  assert.ok(monthly)
  assert.ok(yearly)
  assert.equal(monthly.code, 'PRO')
  assert.equal(yearly.code, 'PRO')
  assert.equal(monthly.amountBdt, pro.priceBdt)
  assert.equal(yearly.amountBdt, pro.yearlyBdt)
  assert.equal(monthly.amountBdt, 99)
  assert.equal(yearly.amountBdt, 1069)
  assert.ok(monthly.amountBdt > 0)
  assert.ok(yearly.amountBdt > 0)
})

test('display labels and cycle suffixes resolve to the same catalog ids', () => {
  assert.equal(resolveCheckoutPackage('Pro', 'MONTH')?.code, 'PRO')
  assert.equal(resolveCheckoutPackage('Pro — ৳99/মাস · ৳1069/বছর', 'MONTH')?.amountBdt, 99)
  assert.equal(resolveCheckoutPackage('PRO_MONTH')?.code, 'PRO')
  assert.equal(resolveCheckoutPackage('PRO_MONTH')?.period, 'MONTH')
  assert.equal(resolveCheckoutPackage('PRO-YEAR')?.code, 'PRO')
  assert.equal(resolveCheckoutPackage('PRO-YEAR')?.amountBdt, 1069)
  assert.equal(resolveCheckoutPackage('প্রো', 'YEAR')?.amountBdt, 1069)
  assert.equal(resolveCheckoutPackage('Pro Advance', 'MONTH')?.code, 'PRO_ADVANCE')
  assert.equal(resolveCheckoutPackage('PRO_ADVANCE_YEAR')?.code, 'PRO_ADVANCE')
  assert.equal(resolveCheckoutPackage('PRO_ADVANCE_YEAR')?.amountBdt, 1600)
})

test('every real paid catalog plan resolves and free or legacy packs do not', () => {
  for (const code of PAID_SKU_CODES) {
    const def = defFor(code)
    assert.ok(def)
    for (const period of ['MONTH', 'YEAR'] as const) {
      const selection = resolveCheckoutPackage(code, period)
      assert.ok(selection, code)
      assert.equal(selection.code, code)
      assert.equal(selection.amountBdt, amountFor(def, period))
      assert.ok(selection.amountBdt > 0)
    }
  }
  assert.equal(resolveCheckoutPackage('FREE', 'MONTH'), null)
  assert.equal(resolveCheckoutPackage('CHAMBER', 'MONTH'), null)
  assert.equal(resolveCheckoutPackage('SMS_500', 'YEAR'), null)
  assert.equal(resolveCheckoutPackage('no-such-plan', 'MONTH'), null)
  assert.equal(PACKAGE_DEFS.find((plan) => plan.code === 'STARTER')?.smsMonthly, 0)
})

test('an invalid package id is a short Bangla sentence, never the English error', () => {
  assert.equal(UNKNOWN_PACKAGE_BN, 'এই প্যাকেজ এখন নেই। আবার বাছাই করুন।')
  const shown = buyerFacingCheckoutMessage('Unknown package', false)
  assert.equal(shown, UNKNOWN_PACKAGE_BN)
  assert.equal(shown.includes('Unknown package'), false)
  assert.equal(buyerFacingCheckoutMessage('This package is not sold', false), UNKNOWN_PACKAGE_BN)
  const hidden = buyerFacingCheckoutMessage('ZINIPAY_API_KEY সেট নেই', true)
  assert.equal(hidden.includes('ZINIPAY'), false)
  assert.equal(hidden.includes('Unknown package'), false)

  const route = readFileSync(
    new URL('../../app/api/web/v1/checkout/start/route.ts', import.meta.url),
    'utf8',
  )
  assert.equal(route.includes('Unknown package'), false)
  assert.equal(route.includes('This package is not sold'), false)
  assert.equal(route.includes('UNKNOWN_PACKAGE_BN'), true)
  assert.equal(route.includes('resolveCheckoutPackage'), true)
  assert.equal(route.includes("status: 'PENDING'"), true)
  assert.equal(route.includes("status: 'ACTIVE'"), false)
})
