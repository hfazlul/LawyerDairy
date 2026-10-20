import assert from 'node:assert/strict'
import test from 'node:test'
import { extraTeamSeats, extraTeamSeatsAllowed, monthlySmsCredits } from './permissions'
import { isV1SellablePackage } from './billing'

test('free extra seats are 1 besides owner (trial)', () => {
  assert.equal(extraTeamSeats('FREE'), 1)
  assert.equal(extraTeamSeats('STARTER'), 2)
  assert.equal(extraTeamSeats('PRO'), 5)
  assert.equal(extraTeamSeats('CHAMBER'), 7)
  assert.equal(extraTeamSeats('PRO_ADVANCE'), 7)
  assert.equal(extraTeamSeats('ADVANCE'), 7)
  assert.equal(extraTeamSeatsAllowed('FREE', { paid: false, trialActive: true }), 1)
  assert.equal(extraTeamSeatsAllowed('FREE', { paid: false, trialActive: false }), 0)
  assert.equal(extraTeamSeatsAllowed('STARTER', { paid: true, trialActive: false }), 2)
})

test('monthly SMS credits 0 / 150 / 280 / 400', () => {
  assert.equal(monthlySmsCredits('FREE'), 0)
  assert.equal(monthlySmsCredits('STARTER'), 0)
  assert.equal(monthlySmsCredits('PRO'), 150)
  assert.equal(monthlySmsCredits('CHAMBER'), 280)
})

test('v2 sellable packages are the four paid SKUs', () => {
  assert.equal(isV1SellablePackage('STARTER'), true)
  assert.equal(isV1SellablePackage('PRO'), true)
  assert.equal(isV1SellablePackage('PRO_ADVANCE'), true)
  assert.equal(isV1SellablePackage('ADVANCE'), true)
  assert.equal(isV1SellablePackage('CHAMBER'), false)
  assert.equal(isV1SellablePackage('SMS_500'), false)
  assert.equal(isV1SellablePackage('FREE'), false)
})
