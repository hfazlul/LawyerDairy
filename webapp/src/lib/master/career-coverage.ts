export type TopicCoverageRow = { moduleId?: string | null; status?: string | null }

export function ethicsSraLabel(topics: TopicCoverageRow[]): string {
  const sra = topics.filter((t) => t.moduleId === 'BC-MOD-SRA')
  const eth = topics.filter((t) => t.moduleId === 'BC-MOD-ETHICS')
  const drafted = (rows: TopicCoverageRow[]) =>
    rows.filter((t) => /LESSON_DRAFTED|drafted/i.test(String(t.status || ''))).length
  const sraD = drafted(sra)
  const ethD = drafted(eth)
  if (sra.length + eth.length === 0) return 'empty_in_source'
  if (sraD === 0 && ethD === 0) return 'empty_in_source'
  if (sraD < sra.length || ethD < eth.length) {
    return `partial_in_source (SRA ${sraD}/${sra.length}, Ethics ${ethD}/${eth.length})`
  }
  return 'full_in_source'
}

export const LOCKED_BAR_SECTIONS = [
  'SEC-START-HERE',
  'SEC-MCQ-PREP',
  'SEC-PREVIOUS-QUESTIONS',
  'SEC-MODEL-TESTS',
  'SEC-WRITTEN-PREP',
  'SEC-VIVA-PREP',
  'SEC-ADVOCATE-PRACTICE',
  'SEC-MY-PROGRESS',
] as const

export const LOCKED_HC_SECTIONS = [
  'SEC-START',
  'SEC-ELIG',
  'SEC-SYLL',
  'SEC-PREVQ',
  'SEC-MTEST',
  'SEC-WRITPREP',
  'SEC-VIVA',
  'SEC-HCPRAC',
  'SEC-AD',
  'SEC-CASE',
  'SEC-DRAFT',
  'SEC-PROGRESS',
] as const

export const LOCKED_BJS_SECTIONS = [
  'BJS-MOD-START',
  'BJS-MOD-CIVIL',
  'BJS-MOD-CRIMINAL',
  'BJS-MOD-CONST',
  'BJS-MOD-MINOR',
  'BJS-MOD-PRELIM-BN',
  'BJS-MOD-PRELIM-EN',
  'BJS-MOD-PRELIM-MATH',
  'BJS-MOD-PRELIM-GK',
  'BJS-MOD-WRITTEN',
  'BJS-MOD-VIVA',
  'BJS-MOD-PREV',
] as const

