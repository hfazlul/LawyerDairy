import type { JurisdictionCode } from '../jurisdiction'

/**
 * Limitation tables by jurisdiction.
 * BD = real schedule refs (mirror mobile LimitationEngine).
 * IN / PK = scaffold placeholders only — do not treat as production legal advice.
 */

export interface LimitationRuleRow {
  kind: string
  label: string
  days: number | null
  ruleRef: string
  scaffoldOnly: boolean
}

export interface LimitationPack {
  code: JurisdictionCode
  actLabel: string
  note: string
  rules: LimitationRuleRow[]
}

const BD_RULES: LimitationRuleRow[] = [
  { kind: 'appealDistrictJudge', label: 'Appeal — District Judge', days: 30, ruleRef: 'Art. 152', scaffoldOnly: false },
  { kind: 'appealHighCourtCivil', label: 'Appeal — High Court (civil)', days: 90, ruleRef: 'Art. 150', scaffoldOnly: false },
  { kind: 'appealHighCourtCriminal', label: 'Appeal — High Court (criminal)', days: 60, ruleRef: 'Art. 154', scaffoldOnly: false },
  { kind: 'appealSupremeCourt', label: 'Appeal — Appellate Division', days: 90, ruleRef: 'Art. 156', scaffoldOnly: false },
  { kind: 'revisionCivil', label: 'Revision — civil', days: 90, ruleRef: 'Art. 131', scaffoldOnly: false },
  { kind: 'revisionCriminal', label: 'Revision — criminal', days: 90, ruleRef: 'Art. 155', scaffoldOnly: false },
  { kind: 'reviewCivil', label: 'Review — civil', days: 30, ruleRef: 'Art. 122', scaffoldOnly: false },
  { kind: 'executionDecree', label: 'Execution of decree', days: 3 * 365, ruleRef: 'Art. 136', scaffoldOnly: false },
  { kind: 'moneySuit', label: 'Money suit', days: 3 * 365, ruleRef: 'Art. 27', scaffoldOnly: false },
  { kind: 'niActCheque', label: 'Cheque dishonour', days: 30, ruleRef: 'NI Act §138', scaffoldOnly: false },
]

/** Limitation Act 1963 — West Bengal / Tripura belt (structure only). */
const IN_RULES: LimitationRuleRow[] = [
  {
    kind: 'in_suit_contract',
    label: 'Suit on contract (placeholder)',
    days: 3 * 365,
    ruleRef: 'Limitation Act 1963 — Art. TBD (scaffold)',
    scaffoldOnly: true,
  },
  {
    kind: 'in_appeal_hc',
    label: 'Appeal to High Court (placeholder)',
    days: 90,
    ruleRef: 'Limitation Act 1963 — Art. TBD (scaffold)',
    scaffoldOnly: true,
  },
  {
    kind: 'in_revision',
    label: 'Revision (placeholder)',
    days: 90,
    ruleRef: 'Limitation Act 1963 — Art. TBD (scaffold)',
    scaffoldOnly: true,
  },
  {
    kind: 'in_execution',
    label: 'Execution of decree (placeholder)',
    days: 12 * 365,
    ruleRef: 'Limitation Act 1963 — Art. TBD (scaffold)',
    scaffoldOnly: true,
  },
]

/** Pakistan limitation pack — structure only. */
const PK_RULES: LimitationRuleRow[] = [
  {
    kind: 'pk_suit_contract',
    label: 'Suit on contract (placeholder)',
    days: 3 * 365,
    ruleRef: 'PK Limitation — Art. TBD (scaffold)',
    scaffoldOnly: true,
  },
  {
    kind: 'pk_appeal_hc',
    label: 'Appeal to High Court (placeholder)',
    days: 90,
    ruleRef: 'PK Limitation — Art. TBD (scaffold)',
    scaffoldOnly: true,
  },
  {
    kind: 'pk_revision',
    label: 'Revision (placeholder)',
    days: 90,
    ruleRef: 'PK Limitation — Art. TBD (scaffold)',
    scaffoldOnly: true,
  },
  {
    kind: 'pk_execution',
    label: 'Execution of decree (placeholder)',
    days: 6 * 365,
    ruleRef: 'PK Limitation — Art. TBD (scaffold)',
    scaffoldOnly: true,
  },
]

export const LIMITATION_PACKS: Record<JurisdictionCode, LimitationPack> = {
  BD: {
    code: 'BD',
    actLabel: 'Limitation Act 1908',
    note: 'Full calculator shipped on mobile.',
    rules: BD_RULES,
  },
  IN: {
    code: 'IN',
    actLabel: 'Limitation Act 1963',
    note: 'Scaffold only — fill Schedule articles before production.',
    rules: IN_RULES,
  },
  PK: {
    code: 'PK',
    actLabel: 'Limitation Act (PK)',
    note: 'Scaffold only — PK tables TODO.',
    rules: PK_RULES,
  },
}

export function limitationPackFor(code: JurisdictionCode): LimitationPack {
  return LIMITATION_PACKS[code]
}
