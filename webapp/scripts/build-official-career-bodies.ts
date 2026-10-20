/**
 * Build unique interactive LESSON bodies from official bdlaws HTML (and
 * already-fetched cache). No invented statute, no MCQ keys, no past papers.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const webappRoot = join(here, '..')
const repoRoot = join(webappRoot, '..')
const cacheDir = join(here, 'official-cache')
const shellsPath = join(repoRoot, 'mobile', 'assets', 'career', 'bar_topic_shells.json')
const syllabusPath = join(repoRoot, 'Barcouncil assets', 'data', 'syllabus.json')
const batchesDir = join(repoRoot, 'Barcouncil assets', 'batches')
const mobileCareer = join(repoRoot, 'mobile', 'assets', 'career')
const coveragePath = join(repoRoot, 'docs', 'plan', 'mobile-v3', '_career_coverage_2026-09-14.json')

type Json = Record<string, unknown>
const FETCHED = '2026-09-14'

const ACTS: { id: number; key: string; url: string; extra?: string[] }[] = [
  { id: 88, key: 'LIM', url: 'https://bdlaws.minlaw.gov.bd/act-details-88.html?lang=en' },
  { id: 86, key: 'CPC', url: 'https://bdlaws.minlaw.gov.bd/act-details-86.html?lang=en', extra: [
    'https://bdlaws.minlaw.gov.bd/act-86/part-details-79.html',
  ] },
  { id: 75, key: 'CRPC', url: 'https://bdlaws.minlaw.gov.bd/act-details-75.html?lang=en', extra: [
    'http://bdlaws.minlaw.gov.bd/act-details-75.html?lang=en',
    'https://bdlaws.minlaw.gov.bd/act-75.html',
  ] },
  { id: 11, key: 'PENAL', url: 'https://bdlaws.minlaw.gov.bd/act-details-11.html?lang=en', extra: [
    'http://bdlaws.minlaw.gov.bd/act-details-11.html?lang=en',
    'https://bdlaws.minlaw.gov.bd/act-11.html',
  ] },
  { id: 24, key: 'EVID', url: 'https://bdlaws.minlaw.gov.bd/act-details-24.html?lang=en' },
  { id: 36, key: 'SRA', url: 'https://bdlaws.minlaw.gov.bd/act-details-36.html?lang=en' },
  { id: 387, key: 'ETH', url: 'https://bdlaws.minlaw.gov.bd/act-details-387.html?lang=en' },
]

function load(p: string): Json {
  return JSON.parse(readFileSync(p, 'utf8')) as Json
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]{0,800}>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function looksLikeHtml(s: string): boolean {
  return /<!DOCTYPE html/i.test(s) || /<html[\s>]/i.test(s) || /<\/body>/i.test(s)
}

function decodeBuffer(buf: Buffer): string {
  let start = 0
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbf && buf[2] === 0xbd) start = 3
  if (buf.length >= 2 && buf[start] === 0xff && buf[start + 1] === 0xfe) start += 2
  const utf8 = buf.toString('utf8')
  if (looksLikeHtml(utf8) && !utf8.includes('\u0000') && !/[\u3400-\u9fff]{8}/.test(utf8.slice(0, 200))) {
    return utf8
  }
  if (buf.length < 8_000_000) {
    const u16 = buf.subarray(start).toString('utf16le')
    if (looksLikeHtml(u16)) return u16
  }
  if (utf8.includes('\u0000')) {
    return utf8.replace(/\u0000/g, '')
  }
  return utf8
}

async function fetchText(url: string): Promise<string> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), 90000)
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { 'User-Agent': 'MamlaqCareerOfficialFetch/1.0 (local corpus; bdlaws.minlaw.gov.bd)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    return decodeBuffer(buf)
  } finally {
    clearTimeout(t)
  }
}

function parseSections(raw: string): Record<string, string> {
  const text = stripHtml(raw)
  const out: Record<string, string> = {}
  const lines = text.split('\n')
  let current: string | null = null
  let buf: string[] = []
  const flush = () => {
    if (!current) return
    const body = buf.join('\n').trim()
    if (body.length < 40) return
    if (!out[current] || body.length > out[current].length) out[current] = body
  }
  for (const line of lines) {
    const m = line.match(/^\s*(\d+[A-Z]?)\.\s+(\S.*)$/)
    if (m) {
      flush()
      current = m[1]
      buf = [m[2]]
    } else if (current) {
      buf.push(line)
    }
  }
  flush()
  return out
}

function expandRange(a: string, b: string): string[] {
  const am = a.match(/^(\d+)([A-Z]?)$/i)
  const bm = b.match(/^(\d+)([A-Z]?)$/i)
  if (!am || !bm) return [a, b]
  const n1 = Number(am[1])
  const n2 = Number(bm[1])
  const out: string[] = []
  if (n1 === n2 && am[2] && bm[2]) {
    const c1 = am[2].toUpperCase().charCodeAt(0)
    const c2 = bm[2].toUpperCase().charCodeAt(0)
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      out.push(`${n1}${String.fromCharCode(c)}`)
    }
    return out
  }
  for (let n = Math.min(n1, n2); n <= Math.max(n1, n2); n++) out.push(String(n))
  if (bm[2]) out.push(`${n2}${bm[2].toUpperCase()}`)
  if (am[2] && n1 !== n2) out.push(`${n1}${am[2].toUpperCase()}`)
  return [...new Set(out)]
}

function sectionNumsFromSyllabus(raw: string): string[] {
  if (!raw) return []
  if (/first schedule/i.test(raw) && !/\bS\./i.test(raw)) return []
  if (/^n\/a$/i.test(raw.trim()) || /not tied to one section/i.test(raw) || /^general$/i.test(raw)) {
    return []
  }
  const out = new Set<string>()
  const cleaned = raw.replace(/\(approx\.\)/gi, '')
  const bits = cleaned.split(/[;,]|\band\b/i)
  for (const bit of bits) {
    if (/order\s+[ivx]+/i.test(bit) && !/\d/.test(bit)) continue
    const m = bit.match(/S\.?\s*(\d+[A-Z]?)(?:\s*[-–]\s*(\d+[A-Z]?))?/i)
    if (!m) continue
    if (m[2]) expandRange(m[1], m[2]).forEach((n) => out.add(n))
    else out.add(m[1].toUpperCase())
  }
  return [...out]
}

function moduleKey(moduleId: string): string | null {
  if (moduleId.includes('LIMIT')) return 'LIM'
  if (moduleId.includes('CPC')) return 'CPC'
  if (moduleId.includes('CRPC')) return 'CRPC'
  if (moduleId.includes('PENAL')) return 'PENAL'
  if (moduleId.includes('EVID')) return 'EVID'
  if (moduleId.includes('SRA')) return 'SRA'
  if (moduleId.includes('ETHIC')) return 'ETH'
  return null
}

function officialUrl(moduleId: string): string {
  const k = moduleKey(moduleId)
  const hit = ACTS.find((a) => a.key === k)
  return hit?.url.replace('?lang=en', '') || 'https://bdlaws.minlaw.gov.bd/'
}

function firstSentences(text: string, n = 2): string[] {
  const bits = text.split(/(?<=\.)\s+/).map((s) => s.trim()).filter((s) => s.length > 20)
  return bits.slice(0, n)
}

function illustrations(text: string): string[] {
  const block = text.match(/Illustrations\s+([\s\S]+?)(?=\n[A-Z][a-z].{12,}|\n\d+[A-Z]?\.\s|$)/)
  if (!block) return []
  return block[1]
    .split(/\n(?=\([a-z]\))/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
    .slice(0, 4)
}

type Topic = {
  topicId: string
  moduleId: string
  section: string
  titleBn: string
  titleEn: string
}

function uniqueTopicIds(): Set<string> {
  const ids = new Set<string>()
  for (const name of readdirSync(batchesDir).filter((n) => n.endsWith('.json'))) {
    const data = load(join(batchesDir, name))
    for (const asset of (data.assets as Json[]) ?? []) {
      if (asset.asset_type === 'LESSON' && asset.is_shell !== true && asset.topic_id) {
        ids.add(String(asset.topic_id))
      }
    }
  }
  for (const name of readdirSync(mobileCareer).filter((n) => /^bar_batch_\d+\.json$/.test(n))) {
    const data = load(join(mobileCareer, name))
    for (const asset of (data.assets as Json[]) ?? []) {
      if (asset.asset_type === 'LESSON' && asset.is_shell !== true && asset.topic_id) {
        ids.add(String(asset.topic_id))
      }
    }
  }
  return ids
}

function loadTopics(): Topic[] {
  const syllabus = load(syllabusPath)
  const out: Topic[] = []
  for (const mod of (syllabus.subjects as Json[]) ?? []) {
    const moduleId = String(mod.module_id || '')
    for (const t of (mod.topics as Json[]) ?? []) {
      const title = (t.title as Json) || {}
      out.push({
        topicId: String(t.topic_id || ''),
        moduleId,
        section: String(t.section_or_order || ''),
        titleBn: String(title.bn || ''),
        titleEn: String(title.en || ''),
      })
    }
  }
  return out
}

function mergeSections(into: Record<string, string>, add: Record<string, string>) {
  for (const [k, v] of Object.entries(add)) {
    if (!into[k] || v.length > into[k].length) into[k] = v
  }
}

async function loadActCorpus(): Promise<Record<string, Record<string, string>>> {
  mkdirSync(cacheDir, { recursive: true })
  const corpus: Record<string, Record<string, string>> = {}
  for (const act of ACTS) {
    corpus[act.key] = corpus[act.key] || {}
    const urls = [act.url, ...(act.extra || [])]
    for (const url of urls) {
      const cacheName = url.replace(/https?:\/\//, '').replace(/[^\w.-]+/g, '_') + '.txt'
      const cachePath = join(cacheDir, cacheName)
      let raw = ''
      if (existsSync(cachePath) && readFileSync(cachePath).length > 400) {
        raw = decodeBuffer(readFileSync(cachePath))
      } else {
        try {
          raw = await fetchText(url)
          writeFileSync(cachePath, raw, 'utf8')
          console.error(`fetched ${url} (${raw.length} chars)`)
        } catch (e) {
          console.error(`skip ${url}: ${e instanceof Error ? e.message : e}`)
          if (existsSync(cachePath)) raw = decodeBuffer(readFileSync(cachePath))
        }
      }
      if (raw) {
        const parsed = parseSections(raw.slice(0, 1_500_000))
        mergeSections(corpus[act.key], parsed)
        console.error(`parsed ${url} sections=${Object.keys(parsed).length}`)
      }
    }
  }
  return corpus
}

function makeLesson(topic: Topic, sections: { num: string; text: string }[], url: string): Json {
  const quoted = sections
    .map((s) => `Section ${s.num}.\n${s.text.slice(0, 4500)}`)
    .join('\n\n')
  const rules = sections.flatMap((s) => firstSentences(s.text, 1).map((line) => `S.${s.num}: ${line}`)).slice(0, 6)
  const ex = sections.flatMap((s) => illustrations(s.text)).slice(0, 4)
  const nums = sections.map((s) => `S.${s.num}`).join(', ')
  const en = {
    title: topic.titleEn,
    short_description: `Official bdlaws extract for ${topic.section} (${topic.titleEn}). Retrieved ${FETCHED}. Not lawyer-verified.`,
    learning_objective: `Read the official wording of ${nums} on bdlaws and map it to the syllabus topic "${topic.titleEn}". This card quotes the Act; it is not commentary and is not verified.`,
    explanation: `Official English from ${url} (retrieved ${FETCHED}). Not lawyer-verified. Not a substitute for the full Act (orders, schedules, and omitted subsections may be missing from this HTML).\n\nSyllabus: ${topic.titleEn} (${topic.section}).\n\n${quoted}`,
    key_concepts: [topic.section, topic.titleEn, nums, 'bdlaws.minlaw.gov.bd'],
    important_rules: rules.length ? rules : ['Read the operative section on the official bdlaws page. This card does not invent section text.'],
    examples: ex,
    exam_focus: `Before practice, open ${url} and note the ingredients of ${nums}. No invented MCQ keys here.`,
    common_traps: [
      'Treating this official extract as a verified commentary lesson.',
      'Assuming Orders / First Schedule / omitted clauses are in this HTML extract.',
    ],
    key_takeaways: [`Official page: ${url}`, `Quoted: ${nums}`],
  }
  const bn = {
    title: topic.titleBn,
    short_description: `অফিসিয়াল bdlaws উদ্ধৃতি — ${topic.section} (${topic.titleBn})। সংগ্রহ ${FETCHED}। আইনজীবী যাচাই হয়নি।`,
    learning_objective: `bdlaws-এ ${nums} পড়ে সিলেবাস টপিক "${topic.titleBn}"-এর সাথে মিলান। এই কার্ড আইনের উদ্ধৃতি; ভাষ্য নয়; যাচাইকৃত নয়।`,
    explanation: `অফিসিয়াল ইংরেজি পাঠ ${url} (সংগ্রহ ${FETCHED})। বাংলা পূর্ণ পাঠ একই অফিসিয়াল সাইটে। এখানে বাংলা ধারা অনুবাদ উদ্ভাবন করা হয়নি। আইনজীবী যাচাই হয়নি। আদেশ/তফসিল এই HTML-এ নাও থাকতে পারে।\n\nসিলেবাস: ${topic.titleBn} (${topic.section})।\n\n${quoted}`,
    key_concepts: [topic.section, topic.titleBn, nums, 'bdlaws.minlaw.gov.bd'],
    important_rules: rules.length ? rules : ['পূর্ণ ধারার পাঠ অফিসিয়াল bdlaws পাতায়। এখানে ধারা উদ্ভাবন করা হয়নি।'],
    examples: ex,
    exam_focus: `পরীক্ষার আগে ${url} খুলে ${nums}-এর উপাদান নোট করুন। নকল MCQ/উত্তর এখানে নেই।`,
    common_traps: [
      'এই অফিসিয়াল উদ্ধৃতিকে verified ভাষ্য ভাবা।',
      'আদেশ/প্রথম তফসিল এই HTML উদ্ধৃতিতে আছে বলে ধরে নেওয়া।',
    ],
    key_takeaways: [`অফিসিয়াল পাতা: ${url}`, `উদ্ধৃত: ${nums}`],
  }
  return {
    content_id: `BC-OFFICIAL-${topic.topicId}`,
    asset_type: 'LESSON',
    lesson_id: `BC-OFFICIAL-${topic.topicId}`,
    topic_id: topic.topicId,
    module_id: topic.moduleId,
    status: 'PENDING_REVIEW',
    verification_status: 'OFFICIAL_FETCHED_PENDING_LAWYER',
    verification_note: `Verbatim/near-verbatim English from bdlaws.minlaw.gov.bd HTML retrieved ${FETCHED}. Bangla statute text was not invented. No MCQ. Lawyer review still required.`,
    is_shell: false,
    official_url: url,
    section_or_order: topic.section,
    official_fetched_at: FETCHED,
    cited_interactive: true,
    language_versions: { en, bn },
  }
}

async function main() {
  const corpus = await loadActCorpus()
  const already = uniqueTopicIds()
  const topics = loadTopics()
  const byModule: Record<string, Json[]> = { LIM: [], CPC: [], CRPC: [], PENAL: [], EVID: [], SRA: [], ETH: [] }
  const converted: string[] = []
  const skipped: { id: string; reason: string }[] = []

  for (const topic of topics) {
    if (already.has(topic.topicId)) continue
    const key = moduleKey(topic.moduleId)
    if (!key) {
      skipped.push({ id: topic.topicId, reason: 'no_act_map' })
      continue
    }
    const nums = sectionNumsFromSyllabus(topic.section)
    if (!nums.length) {
      skipped.push({ id: topic.topicId, reason: 'no_numbered_section' })
      continue
    }
    const pool = corpus[key] || {}
    const found = nums
      .map((num) => ({ num, text: pool[num] || pool[num.replace(/A$/i, '')] || '' }))
      .filter((s) => s.text.length >= 80)
      .slice(0, 10)
    if (!found.length) {
      skipped.push({ id: topic.topicId, reason: `no_official_text:${nums.slice(0, 6).join(',')}` })
      continue
    }
    byModule[key].push(makeLesson(topic, found, officialUrl(topic.moduleId)))
    converted.push(topic.topicId)
    already.add(topic.topicId)
  }

  const batchMeta: { n: string; module: string; count: number }[] = []
  const existingNums = readdirSync(mobileCareer)
    .map((n) => n.match(/^bar_batch_(\d+)\.json$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => Number(m[1]))
  let next = Math.max(25, ...existingNums, 25) + 1
  for (const [mod, assets] of Object.entries(byModule)) {
    if (!assets.length) continue
    const n = String(next).padStart(3, '0')
    next++
    const batch = {
      batch_id: `BATCH-2026-09-${n}-OFFICIAL-${mod}`,
      schema_version: '1.0',
      content_version: '2026.09.14',
      created_at: `${FETCHED}T00:00:00Z`,
      source: 'bdlaws.minlaw.gov.bd-official-html',
      operation: 'CREATE',
      status: 'PENDING_REVIEW',
      batch_purpose: `Official bdlaws English extracts for remaining ${mod} syllabus topics. Interactive lesson player. No invented MCQ. Not lawyer-verified.`,
      asset_count: assets.length,
      assets,
    }
    const file = `bar_batch_${n}.json`
    const json = `${JSON.stringify(batch, null, 2)}\n`
    writeFileSync(join(mobileCareer, file), json)
    writeFileSync(join(batchesDir, `batch-2026-09-${n}-official-${mod.toLowerCase()}.json`), json)
    batchMeta.push({ n, module: mod, count: assets.length })
  }

  const shells = load(shellsPath)
  const remainingShells = ((shells.assets as Json[]) ?? []).filter(
    (a) => !converted.includes(String(a.topic_id || '')),
  )
  shells.assets = remainingShells
  shells.asset_count = remainingShells.length
  shells.batch_purpose = 'Syllabus topic shells pointing at official bdlaws URLs. No invented MCQ. Topics with official extracts were moved to unique lesson batches.'
  writeFileSync(shellsPath, `${JSON.stringify(shells, null, 2)}\n`)

  const coverage = {
    date: FETCHED,
    syllabusTopics: topics.length,
    uniqueDoctrinalLessons: already.size,
    uniqueLessonIds: [...already],
    citedInteractiveShellsEnriched: remainingShells.length,
    remainingCitedShells: remainingShells.length,
    remainingTopicIds: topics.filter((t) => !already.has(t.topicId)).map((t) => t.topicId),
    officialPastPapers: 0,
    officialExtractBatches: batchMeta,
    skippedUnconverted: skipped,
    note: 'Unique bodies = prior 24 flagship batches plus official bdlaws English extracts (OFFICIAL_FETCHED_PENDING_LAWYER). Remaining shells lack numbered HTML text (Orders, First Schedule, N/A ethics, fetch miss). No scraped banks, no invented law.',
  }
  writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`)

  const sectionCounts = Object.fromEntries(
    Object.entries(corpus).map(([k, v]) => [k, Object.keys(v).length]),
  )
  console.log(JSON.stringify({
    converted: converted.length,
    uniqueTopics: already.size,
    remainingShells: remainingShells.length,
    batches: batchMeta,
    sectionCounts,
    skipped: skipped.length,
  }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
