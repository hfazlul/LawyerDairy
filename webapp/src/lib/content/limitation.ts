import type { JurisdictionCode } from '../jurisdiction'

/**
 * Limitation Act 1908 — Bangladesh First Schedule.
 * Kept in sync with mobile LimitationEngine / webapp src/lib/tools/limitation.ts.
 */

export interface LimitationRuleRow {
  kind: string
  label: string
  days: number
  ruleRef: string
}

export interface LimitationPack {
  code: JurisdictionCode
  actLabel: string
  note: string
  rules: LimitationRuleRow[]
}

const BD_RULES: LimitationRuleRow[] = [
  { kind: 'appealDistrictJudge', label: 'আপিল — জেলা জজ', days: 30, ruleRef: 'Art. 152' },
  { kind: 'appealHighCourtCivil', label: 'আপিল — হাইকোর্ট দেওয়ানি', days: 90, ruleRef: 'Art. 156' },
  { kind: 'appealHighCourtCriminal', label: 'আপিল — হাইকোর্ট ফৌজদারি', days: 60, ruleRef: 'Art. 155' },
  { kind: 'leaveAppellateDivision', label: 'আপিল বিভাগে অনুমতি', days: 90, ruleRef: 'Art. 179' },
  { kind: 'reviewOther', label: 'রিভিউ — অন্য আদালত', days: 90, ruleRef: 'Art. 173' },
  { kind: 'executionDecree', label: 'ডিক্রি জারি', days: 3 * 365, ruleRef: 'Art. 182' },
  { kind: 'moneyLent', label: 'ধার দেওয়া টাকা', days: 3 * 365, ruleRef: 'Art. 57' },
  { kind: 'niActCheque', label: 'চেক — নোটিশের পর', days: 30, ruleRef: 'NI Act s.138' },
]

export const LIMITATION_PACKS: Record<JurisdictionCode, LimitationPack> = {
  BD: {
    code: 'BD',
    actLabel: 'Limitation Act 1908',
    note: 'Full calculator. শুক্র-শনি ধারা ৪। প্রথম তফসিল — ভারতীয় ১৯৬৩ নয়।',
    rules: BD_RULES,
  },
}

export function limitationPackFor(_code: JurisdictionCode): LimitationPack {
  return LIMITATION_PACKS['BD']
}
