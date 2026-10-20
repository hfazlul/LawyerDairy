import { NextResponse } from 'next/server'

/** Bundled limitation kinds (engine still in Dart). Gazette holidays empty until official list is ingested. */
const RULES = [
  { kind: 'appealDistrictJudge', days: 30, ruleRef: 'Art. 152' },
  { kind: 'appealHighCourtCivil', days: 90, ruleRef: 'Art. 150' },
  { kind: 'appealHighCourtCriminal', days: 60, ruleRef: 'Art. 154' },
  { kind: 'appealSupremeCourt', days: 90, ruleRef: 'Art. 156' },
]

export async function GET() {
  return NextResponse.json({
    rules: RULES,
    noteBn: 'পূর্ণ তফসিল মাস্টার প্যাক থেকে আসবে। অ্যাপের LimitationEngine অফলাইনে চলে।',
  })
}
