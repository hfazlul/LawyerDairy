import assert from 'node:assert/strict'
import test from 'node:test'
import { computeKabinDivorceFee, computeKabinMarriageFee, KABIN_SRO } from './kabin-fee'
import { computeDeedFees } from './stamp-duty'
import { MOUZA_DISTRICTS, mouzaDistrictsFor, mouzaRateJudiciaryUrl } from './mouza-districts'
import { computeCourtFee, COURT_FEE_ITEMS } from './court-fee'
import { computeLimitation } from './limitation'
import { anaGondaFraction, khatianShare, shareFromAnaGonda } from './ana-gonda'
import { computeFaraiz } from './faraiz'
import { computeIndividualTax } from './tax'

test('kabin: floor 200, 14/1000, excess 100/lakh, divorce 1000', () => {
  assert.equal(computeKabinMarriageFee(1000).fee, 200)
  assert.equal(computeKabinMarriageFee(20000).fee, 280)
  assert.equal(computeKabinMarriageFee(500000).fee, 7000)
  assert.equal(computeKabinMarriageFee(600000).fee, 7100)
  assert.equal(computeKabinDivorceFee().fee, 1000)
  assert.match(KABIN_SRO.pdf, /47247_17806\.pdf/)
})

test('stamp conveyance 10 lakh and heba close', () => {
  const c = computeDeedFees('conveyance', 1_000_000)
  assert.equal(c.stamp, 15_000)
  assert.equal(c.registration, 20_000)
  const h = computeDeedFees('hebaClose', 9_999_999)
  assert.equal(h.stamp, 1000)
  assert.equal(h.registration, 100)
  assert.equal(computeDeedFees('conveyance', 2_000_000_000).stamp, 20_000_000)
})

test('mouza: 64 districts, metrodhaka slug', () => {
  assert.equal(MOUZA_DISTRICTS.length, 64)
  assert.equal(mouzaDistrictsFor('rangpur').length, 8)
  const url = mouzaRateJudiciaryUrl('metrodhaka')
  assert.match(url, /metrodhaka\.judiciary\.gov\.bd/)
  assert.match(url, /servicve-box-detail\/mouza-rate/)
})

test('court fee money 2.5% cap 50000 and family 200', () => {
  const money = COURT_FEE_ITEMS.find((x) => x.id === 'money')!
  const family = COURT_FEE_ITEMS.find((x) => x.id === 'family_plaint')!
  assert.equal(computeCourtFee(family)!.amount, 200)
  assert.equal(computeCourtFee(money, 100_000)!.amount, 2500)
  assert.equal(computeCourtFee(money, 5_000_000)!.amount, 50_000)
})

test('limitation Art. 152 skips Friday/Saturday', () => {
  const r = computeLimitation('appealDistrictJudge', new Date(2026, 7, 1))
  assert.ok(r)
  assert.equal(r.days, 30)
  assert.notEqual(r.dueDate.getDay(), 5)
  assert.notEqual(r.dueDate.getDay(), 6)
})

test('ana-gonda 8 ana of 100 shotok is 50', () => {
  assert.ok(Math.abs(anaGondaFraction({ ana: 16 }) - 1) < 1e-12)
  const r = shareFromAnaGonda({ ana: 8 }, 100)
  assert.ok(Math.abs(r.shotok - 50) < 1e-9)
  const k = khatianShare(100, 1, 2)
  assert.ok(k && Math.abs(k.shotok - 50) < 1e-9)
})

test('faraiz: son whole; wife 1/8 with son; awl husband+two sisters', () => {
  const son = computeFaraiz({ estate: 1000, deceasedMale: true, sons: 1 })
  assert.equal(son.shares.length, 1)
  assert.ok(Math.abs(son.shares[0].amount - 1000) < 0.01)
  const w = computeFaraiz({ estate: 8000, deceasedMale: true, wives: 1, sons: 1 })
  const wife = w.shares.find((s) => s.id === 'wives')!
  const s = w.shares.find((s) => s.id === 'sons')!
  assert.ok(Math.abs(wife.amount - 1000) < 0.01)
  assert.ok(Math.abs(s.amount - 7000) < 0.01)
  const awl = computeFaraiz({ estate: 700, deceasedMale: false, husband: true, fullSisters: 2 })
  assert.equal(awl.awl, true)
  assert.ok(Math.abs(awl.shares.find((x) => x.id === 'husband')!.amount - 300) < 0.5)
})

test('tax AY 2026-27 general nil 4 lakh', () => {
  const r = computeIndividualTax({ kind: 'general', otherIncome: 400_000 })
  assert.equal(r.payable, 0)
  const t = computeIndividualTax({ kind: 'general', otherIncome: 700_000 })
  assert.ok(t.payable > 0)
})
