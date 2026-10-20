/**
 * Enrich syllabus shells into interactive cited lesson cards.
 * Does not invent statute text, MCQ keys, or past papers.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const webappRoot = join(here, '..')
const repoRoot = join(webappRoot, '..')
const shellsPath = join(repoRoot, 'mobile', 'assets', 'career', 'bar_topic_shells.json')
const syllabusPath = join(repoRoot, 'Barcouncil assets', 'data', 'syllabus.json')
const batchesDir = join(repoRoot, 'Barcouncil assets', 'batches')
const outCoverage = join(repoRoot, 'docs', 'plan', 'mobile-v3', '_career_coverage_2026-09-14.json')

type Json = Record<string, unknown>

function load(p: string): Json {
  return JSON.parse(readFileSync(p, 'utf8')) as Json
}

function officialUrlFor(moduleId: string, existing?: string): string {
  if (existing) return existing
  if (moduleId.includes('CPC')) return 'https://bdlaws.minlaw.gov.bd/act-86.html'
  if (moduleId.includes('CRPC')) return 'https://bdlaws.minlaw.gov.bd/act-75.html'
  if (moduleId.includes('PENAL') || moduleId.includes('PC')) return 'https://bdlaws.minlaw.gov.bd/act-11.html'
  if (moduleId.includes('EVIDENCE')) return 'https://bdlaws.minlaw.gov.bd/act-24.html'
  if (moduleId.includes('LIMIT')) return 'https://bdlaws.minlaw.gov.bd/act-88.html'
  if (moduleId.includes('SRA') || moduleId.includes('SPECIFIC')) return 'https://bdlaws.minlaw.gov.bd/act-36.html'
  if (moduleId.includes('ETHIC')) return 'https://bdlaws.minlaw.gov.bd/act-details-387.html'
  return 'https://bdlaws.minlaw.gov.bd/'
}

const uniqueTopicIds = new Set<string>()
const uniqueLessons: { id: string; topicId: string; batch: string }[] = []

if (existsSync(batchesDir)) {
  for (const name of readdirSync(batchesDir).filter((n) => n.endsWith('.json'))) {
    const data = load(join(batchesDir, name))
    for (const asset of (data.assets as Json[]) ?? []) {
      const type = String(asset.asset_type || '')
      const shell = asset.is_shell === true
      const topicId = String(asset.topic_id || '')
      if (type === 'LESSON' && !shell && topicId) {
        uniqueTopicIds.add(topicId)
        uniqueLessons.push({
          id: String(asset.content_id || asset.lesson_id || ''),
          topicId,
          batch: name,
        })
      }
    }
  }
}

const syllabus = load(syllabusPath)
const subjects = (syllabus.subjects as Json[]) ?? []
const topics: { topicId: string; moduleId: string; section: string; titleBn: string; titleEn: string; status: string }[] = []
for (const mod of subjects) {
  const moduleId = String(mod.module_id || mod.id || '')
  for (const t of (mod.topics as Json[]) ?? []) {
    const title = (t.title as Json) || {}
    topics.push({
      topicId: String(t.topic_id || t.id || ''),
      moduleId,
      section: String(t.section_or_order || ''),
      titleBn: String(title.bn || ''),
      titleEn: String(title.en || ''),
      status: String(t.content_status || t.status || ''),
    })
  }
}

const shells = load(shellsPath)
const assets = (shells.assets as Json[]) ?? []
let enriched = 0
for (const asset of assets) {
  const topicId = String(asset.topic_id || '')
  if (uniqueTopicIds.has(topicId)) continue
  const moduleId = String(asset.module_id || '')
  const url = officialUrlFor(moduleId, String(asset.official_url || ''))
  const section = String(asset.section_or_order || '')
  const loc = (asset.language_versions as Json) || {}
  const bn = (loc.bn as Json) || {}
  const en = (loc.en as Json) || {}
  const titleBn = String(bn.title || '')
  const titleEn = String(en.title || '')
  bn.learning_objective = `অফিসিয়াল আইন পাতায় ${section || 'প্রাসঙ্গিক ধারা'} পড়ে এই সিলেবাস টপিক (${titleBn}) চিনুন। এই কার্ড আইনের বিকল্প নয়; যাচাইকৃত নয়।`
  en.learning_objective = `Open the official statute page for ${section || 'the listed section'} and identify this syllabus topic (${titleEn}). This card is not a substitute for the Act. Not verified.`
  bn.key_concepts = [section, titleBn, 'bdlaws.minlaw.gov.bd'].filter(Boolean)
  en.key_concepts = [section, titleEn, 'bdlaws.minlaw.gov.bd'].filter(Boolean)
  bn.important_rules = [
    'পূর্ণ ধারার পাঠ অফিসিয়াল bdlaws পাতায়। এখানে ধারা উদ্ভাবন করা হয়নি।',
  ]
  en.important_rules = [
    'Read the operative section on the official bdlaws page. This card does not invent section text.',
  ]
  bn.exam_focus = 'পরীক্ষার আগে অফিসিয়াল ধারা খুলে উপাদানগুলো নোট করুন। নকল MCQ/উত্তর এখানে নেই।'
  en.exam_focus = 'Before practice, open the official section and note the ingredients. No invented MCQ keys here.'
  bn.common_traps = ['এই শেলকে verified lesson ভাবা।']
  en.common_traps = ['Treating this cited shell as a verified doctrinal lesson.']
  bn.key_takeaways = [`অফিসিয়াল পাতা: ${url}`]
  en.key_takeaways = [`Official page: ${url}`]
  loc.bn = bn
  loc.en = en
  asset.language_versions = loc
  asset.cited_interactive = true
  enriched++
}

writeFileSync(shellsPath, `${JSON.stringify(shells, null, 2)}\n`)

const remaining = topics.filter((t) => !uniqueTopicIds.has(t.topicId)).map((t) => t.topicId)
const coverage = {
  date: '2026-09-14',
  syllabusTopics: topics.length,
  uniqueDoctrinalLessons: uniqueTopicIds.size,
  uniqueLessonIds: uniqueLessons.map((l) => l.id),
  uniqueTopicIds: [...uniqueTopicIds].sort(),
  citedInteractiveShellsEnriched: enriched,
  remainingCitedShells: remaining.length,
  remainingTopicIds: remaining,
  officialPastPapers: 0,
  note: 'Unique bodies from batches 002–025 only. Remaining topics stay cited shells (official URL + section). No scraped banks, no invented law.',
}

writeFileSync(outCoverage, `${JSON.stringify(coverage, null, 2)}\n`)
console.log(
  JSON.stringify({
    topics: topics.length,
    uniqueLessons: uniqueTopicIds.size,
    shellsEnriched: enriched,
    remainingShells: remaining.length,
  }),
)
