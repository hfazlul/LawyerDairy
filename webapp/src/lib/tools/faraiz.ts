/** Hanafi faraiz — port of mobile faraiz_engine.dart (Quran 4:11/12/176). */

export type FaraizInput = {
  estate: number
  deceasedMale: boolean
  wives?: number
  husband?: boolean
  sons?: number
  daughters?: number
  father?: boolean
  mother?: boolean
  paternalGrandfather?: boolean
  paternalGrandmother?: boolean
  maternalGrandmother?: boolean
  sonsSons?: number
  sonsDaughters?: number
  fullBrothers?: number
  fullSisters?: number
  consanguineBrothers?: number
  consanguineSisters?: number
  uterineBrothers?: number
  uterineSisters?: number
}

export type FaraizShare = {
  id: string
  nameBn: string
  nameEn: string
  fractionBn: string
  amount: number
  count: number
  each?: number
  roleBn: string
}

export type FaraizResult = {
  shares: FaraizShare[]
  awl: boolean
  radd: boolean
  errorBn?: string
  errorEn?: string
  distributed: number
}

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a || 1
}

class Q {
  n: number
  d: number
  constructor(n: number, d: number) {
    if (d === 0 || n === 0) {
      this.n = 0
      this.d = 1
      return
    }
    const g = gcd(n, d)
    let nn = n / g
    let dd = d / g
    if (dd < 0) {
      nn = -nn
      dd = -dd
    }
    this.n = nn
    this.d = dd
  }
  static frac(n: number, d: number) { return new Q(n, d) }
  static get zero() { return new Q(0, 1) }
  static get one() { return new Q(1, 1) }
  add(o: Q) { return Q.frac(this.n * o.d + o.n * this.d, this.d * o.d) }
  sub(o: Q) { return Q.frac(this.n * o.d - o.n * this.d, this.d * o.d) }
  mul(o: Q) { return Q.frac(this.n * o.n, this.d * o.d) }
  gt(o: Q) { return this.n * o.d > o.n * this.d }
  get isZero() { return this.n === 0 }
  get asDouble() { return this.n / this.d }
  get labelBn() {
    if (this.n === 0) return '০'
    if (this.n === this.d) return '১'
    const bn = '০১২৩৪৫৬৭৮৯'
    return `${this.n}/${this.d}`.replace(/\d/g, (m) => bn[Number(m)])
  }
}

type Bucket = { id: string; nameBn: string; nameEn: string; fard: Q; asaba: Q; count: number; roleBn: string }
const total = (b: Bucket) => b.fard.add(b.asaba)

export function computeFaraiz(i: FaraizInput): FaraizResult {
  const empty = (errorBn: string, errorEn: string): FaraizResult => ({
    shares: [], awl: false, radd: false, errorBn, errorEn, distributed: 0,
  })
  if (i.estate < 0) return empty('সম্পত্তির পরিমাণ ঋণাত্মক হতে পারে না।', 'Estate cannot be negative.')
  if (i.deceasedMale && i.husband) return empty('পুরুষ মৃতের স্বামী হয় না।', 'A male deceased has no husband.')
  if (!i.deceasedMale && (i.wives ?? 0) > 0) return empty('নারী মৃতের স্ত্রী হয় না — স্বামী চালু করুন।', 'A female deceased has no wife.')
  if ((i.wives ?? 0) > 4) return empty('হানাফিতে স্ত্রী সর্বোচ্চ চার।', 'At most four wives.')

  const sons = i.sons ?? 0
  const daughters = i.daughters ?? 0
  const hasSon = sons > 0
  const hasDaughter = daughters > 0
  const hasChild = hasSon || hasDaughter
  const sonsSons = hasSon ? 0 : (i.sonsSons ?? 0)
  const sonsDaughters = hasSon ? 0 : (i.sonsDaughters ?? 0)
  const hasSonsSon = sonsSons > 0
  const hasSonsDaughter = sonsDaughters > 0
  const hasFar = hasChild || hasSonsSon || hasSonsDaughter
  const father = !!i.father
  const grandfather = !!i.paternalGrandfather && !father
  const fatherOrGf = father || grandfather
  const mother = !!i.mother
  const pGm = !!i.paternalGrandmother && !mother && !father
  const mGm = !!i.maternalGrandmother && !mother
  const siblingCount = (i.fullBrothers ?? 0) + (i.fullSisters ?? 0) + (i.consanguineBrothers ?? 0) +
    (i.consanguineSisters ?? 0) + (i.uterineBrothers ?? 0) + (i.uterineSisters ?? 0)
  const siblingsHajb = hasSon || hasSonsSon || fatherOrGf
  const fullBro = siblingsHajb ? 0 : (i.fullBrothers ?? 0)
  const fullSis = siblingsHajb ? 0 : (i.fullSisters ?? 0)
  const consBro = siblingsHajb || fullBro > 0 ? 0 : (i.consanguineBrothers ?? 0)
  let consSis = siblingsHajb || fullBro > 0 ? 0 : (i.consanguineSisters ?? 0)
  const uterineHajb = hasFar || fatherOrGf
  const uterBro = uterineHajb ? 0 : (i.uterineBrothers ?? 0)
  const uterSis = uterineHajb ? 0 : (i.uterineSisters ?? 0)
  const uterN = uterBro + uterSis
  const hasSpouse = (i.deceasedMale && (i.wives ?? 0) > 0) || (!i.deceasedMale && !!i.husband)
  const umariyyatayn = !hasFar && siblingCount < 2 && father && mother && hasSpouse

  const buckets = new Map<string, Bucket>()
  const addFard = (id: string, bn: string, en: string, q: Q, count = 1, role = 'ফরজ') => {
    if (q.isZero || count <= 0) return
    buckets.set(id, { id, nameBn: bn, nameEn: en, fard: q, asaba: Q.zero, count, roleBn: role })
  }

  if (!i.deceasedMale && i.husband) addFard('husband', 'স্বামী', 'Husband', hasFar ? Q.frac(1, 4) : Q.frac(1, 2))
  const wives = i.wives ?? 0
  if (i.deceasedMale && wives > 0) {
    addFard('wives', wives === 1 ? 'স্ত্রী' : 'স্ত্রীগণ', wives === 1 ? 'Wife' : 'Wives', hasFar ? Q.frac(1, 8) : Q.frac(1, 4), wives)
  }
  if (mother) {
    if (umariyyatayn) {
      const spouseF = buckets.get('husband')?.fard ?? buckets.get('wives')?.fard ?? Q.zero
      addFard('mother', 'মাতা', 'Mother', Q.one.sub(spouseF).mul(Q.frac(1, 3)))
    } else if (hasFar || siblingCount >= 2) addFard('mother', 'মাতা', 'Mother', Q.frac(1, 6))
    else addFard('mother', 'মাতা', 'Mother', Q.frac(1, 3))
  }
  const gmN = (pGm ? 1 : 0) + (mGm ? 1 : 0)
  if (gmN > 0) {
    addFard('grandmother', gmN === 2 ? 'দাদি ও নানি' : pGm ? 'দাদি' : 'নানি', 'Grandmother', Q.frac(1, 6), gmN)
  }

  let daughtersAsaba = false
  let sonsDaughtersAsaba = false
  let fullSistersAsaba = false
  let consSistersAsaba = false
  let fatherAsaba = false
  let gfAsaba = false

  if (hasDaughter && hasSon) daughtersAsaba = true
  else if (daughters === 1) addFard('daughters', 'কন্যা', 'Daughter', Q.frac(1, 2))
  else if (daughters >= 2) addFard('daughters', 'কন্যারা', 'Daughters', Q.frac(2, 3), daughters)

  if (hasSonsDaughter && !hasSon) {
    if (hasSonsSon) sonsDaughtersAsaba = true
    else if (!hasDaughter) {
      if (sonsDaughters === 1) addFard('sonsDaughters', 'পুত্রের কন্যা', "Son's daughter", Q.frac(1, 2))
      else addFard('sonsDaughters', 'পুত্রের কন্যারা', "Son's daughters", Q.frac(2, 3), sonsDaughters)
    } else if (daughters === 1) addFard('sonsDaughters', 'পুত্রের কন্যা', "Son's daughter", Q.frac(1, 6), sonsDaughters)
  }

  const femaleFarWithoutSon = (hasDaughter || hasSonsDaughter) && !hasSon && !hasSonsSon
  if (fullSis > 0 && fullBro === 0 && femaleFarWithoutSon) fullSistersAsaba = true
  else if (fullSis > 0 && fullBro === 0) {
    if (fullSis === 1) addFard('fullSisters', 'সহোদরা বোন', 'Full sister', Q.frac(1, 2))
    else addFard('fullSisters', 'সহোদরা বোনেরা', 'Full sisters', Q.frac(2, 3), fullSis)
  }

  if (consSis > 0 && consBro === 0 && !fullSistersAsaba) {
    const fullSisFard = buckets.get('fullSisters')?.fard ?? Q.zero
    if (femaleFarWithoutSon && fullSis === 0) consSistersAsaba = true
    else if (fullSisFard.n === 1 && fullSisFard.d === 2) addFard('consSisters', 'বৈমাত্রেয় বোন', 'Consanguine sister', Q.frac(1, 6), consSis)
    else if (fullSis === 0) {
      if (consSis === 1) addFard('consSisters', 'বৈমাত্রেয় বোন', 'Consanguine sister', Q.frac(1, 2))
      else addFard('consSisters', 'বৈমাত্রেয় বোনেরা', 'Consanguine sisters', Q.frac(2, 3), consSis)
    } else consSis = 0
  }

  if (uterN === 1) addFard('uterine', uterBro === 1 ? 'বৈপিত্রেয় ভাই' : 'বৈপিত্রেয় বোন', 'Uterine sibling', Q.frac(1, 6))
  else if (uterN >= 2) addFard('uterine', 'বৈপিত্রেয় ভাই-বোন', 'Uterine siblings', Q.frac(1, 3), uterN)

  if (father) {
    if (hasSon || hasSonsSon) addFard('father', 'পিতা', 'Father', Q.frac(1, 6))
    else if (hasDaughter || hasSonsDaughter) { addFard('father', 'পিতা', 'Father', Q.frac(1, 6)); fatherAsaba = true }
    else fatherAsaba = true
  } else if (grandfather) {
    if (hasSon || hasSonsSon) addFard('grandfather', 'দাদা', 'True grandfather', Q.frac(1, 6))
    else if (hasDaughter || hasSonsDaughter) { addFard('grandfather', 'দাদা', 'True grandfather', Q.frac(1, 6)); gfAsaba = true }
    else gfAsaba = true
  }

  let fardSum = Q.zero
  for (const b of buckets.values()) fardSum = fardSum.add(b.fard)
  let awl = false
  let residue = Q.one.sub(fardSum)
  if (fardSum.gt(Q.one)) {
    awl = true
    for (const b of buckets.values()) b.fard = b.fard.mul(Q.frac(fardSum.d, fardSum.n))
    residue = Q.zero
  }

  const giveAsaba = (id: string, bn: string, en: string, q: Q, count = 1) => {
    if (q.isZero) return
    const existing = buckets.get(id)
    if (existing) {
      existing.asaba = existing.asaba.add(q)
      existing.roleBn = existing.fard.isZero ? 'আসাবা' : 'ফরজ + আসাবা'
    } else {
      buckets.set(id, { id, nameBn: bn, nameEn: en, fard: Q.zero, asaba: q, count, roleBn: 'আসাবা' })
    }
  }

  if (!residue.isZero && !awl) {
    if (hasSon) {
      const units = sons * 2 + (daughtersAsaba ? daughters : 0)
      const unit = residue.mul(Q.frac(1, units))
      giveAsaba('sons', sons === 1 ? 'পুত্র' : 'পুত্রগণ', 'Sons', unit.mul(Q.frac(sons * 2, 1)), sons)
      if (daughtersAsaba) giveAsaba('daughters', daughters === 1 ? 'কন্যা' : 'কন্যারা', 'Daughters', unit.mul(Q.frac(daughters, 1)), daughters)
      residue = Q.zero
    } else if (hasSonsSon) {
      const units = sonsSons * 2 + (sonsDaughtersAsaba ? sonsDaughters : 0)
      const unit = residue.mul(Q.frac(1, units))
      giveAsaba('sonsSons', 'পুত্রের পুত্র', "Son's sons", unit.mul(Q.frac(sonsSons * 2, 1)), sonsSons)
      if (sonsDaughtersAsaba) giveAsaba('sonsDaughters', 'পুত্রের কন্যা', "Son's daughters", unit.mul(Q.frac(sonsDaughters, 1)), sonsDaughters)
      residue = Q.zero
    } else if (fatherAsaba) { giveAsaba('father', 'পিতা', 'Father', residue); residue = Q.zero }
    else if (gfAsaba) { giveAsaba('grandfather', 'দাদা', 'True grandfather', residue); residue = Q.zero }
    else if (fullBro > 0) {
      const units = fullBro * 2 + fullSis
      const unit = residue.mul(Q.frac(1, units))
      giveAsaba('fullBrothers', 'সহোদর ভাই', 'Full brothers', unit.mul(Q.frac(fullBro * 2, 1)), fullBro)
      if (fullSis > 0) giveAsaba('fullSisters', 'সহোদরা বোন', 'Full sisters', unit.mul(Q.frac(fullSis, 1)), fullSis)
      residue = Q.zero
    } else if (fullSistersAsaba) { giveAsaba('fullSisters', 'সহোদরা বোন', 'Full sisters', residue, fullSis); residue = Q.zero }
    else if (consBro > 0) {
      const units = consBro * 2 + consSis
      const unit = residue.mul(Q.frac(1, units))
      giveAsaba('consBrothers', 'বৈমাত্রেয় ভাই', 'Consanguine brothers', unit.mul(Q.frac(consBro * 2, 1)), consBro)
      if (consSis > 0) giveAsaba('consSisters', 'বৈমাত্রেয় বোন', 'Consanguine sisters', unit.mul(Q.frac(consSis, 1)), consSis)
      residue = Q.zero
    } else if (consSistersAsaba) { giveAsaba('consSisters', 'বৈমাত্রেয় বোন', 'Consanguine sisters', residue, consSis); residue = Q.zero }
  }

  let radd = false
  if (!residue.isZero && !awl) {
    radd = true
    const spouseIds = new Set(['husband', 'wives'])
    let blood = Q.zero
    for (const b of buckets.values()) if (!spouseIds.has(b.id)) blood = blood.add(total(b))
    if (!blood.isZero) {
      const extra = residue
      for (const b of buckets.values()) {
        if (spouseIds.has(b.id) || total(b).isZero) continue
        const t = total(b)
        b.asaba = b.asaba.add(extra.mul(Q.frac(t.n * blood.d, t.d * blood.n)))
        b.roleBn = `${b.roleBn} + রদ্দ`
      }
    } else {
      for (const b of buckets.values()) {
        if (spouseIds.has(b.id)) {
          b.asaba = b.asaba.add(residue)
          b.roleBn = `${b.roleBn} + রদ্দ (শুধু স্বামী/স্ত্রী)`
        }
      }
    }
  }

  const shares: FaraizShare[] = []
  let distributed = 0
  for (const b of buckets.values()) {
    const t = total(b)
    if (t.isZero) continue
    const amt = i.estate * t.asDouble
    distributed += amt
    shares.push({
      id: b.id, nameBn: b.nameBn, nameEn: b.nameEn, fractionBn: t.labelBn, amount: amt, count: b.count,
      each: b.count > 1 ? amt / b.count : undefined, roleBn: b.roleBn,
    })
  }
  if (!shares.length) return empty('কোনো ওয়ারিশ বাছুন।', 'Select at least one heir.')
  return { shares, awl, radd, distributed }
}
