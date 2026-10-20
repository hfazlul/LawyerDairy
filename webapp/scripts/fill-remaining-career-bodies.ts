/**
 * Convert remaining Bar syllabus shells into unique interactive LESSON bodies
 * from official bdlaws HTML / existing corpora only. No invented statute, no MCQ keys.
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
const FETCHED = '2026-09-14'

type Json = Record<string, unknown>

const ORDER_MAP: Record<string, string[]> = {
  'T-CPC-18': ['I'],
  'T-CPC-19': ['V'],
  'T-CPC-20': ['VI'],
  'T-CPC-21': ['VII'],
  'T-CPC-22': ['VIII'],
  'T-CPC-23': ['IX'],
  'T-CPC-24': ['X'],
  'T-CPC-25': ['XI'],
  'T-CPC-26': ['XII', 'XIII'],
  'T-CPC-27': ['XIV'],
  'T-CPC-28': ['XVII'],
  'T-CPC-29': ['XVIII'],
  'T-CPC-30': ['XIX'],
  'T-CPC-31': ['XXII'],
  'T-CPC-32': ['XXIII'],
  'T-CPC-33': ['XXV', 'XXVI'],
  'T-CPC-34': ['XXVIIA', 'XXVII-A'],
  'T-CPC-35': ['XXVII', 'XXIX', 'XXXI', 'XXXII'],
  'T-CPC-36': ['I', 'VII', 'XXXIII'],
  'T-CPC-37': ['XXXVIII', 'XXXIX'],
}

const RELATED_SECTIONS: Record<string, { nums: string[]; note: string; url: string }> = {
  'T-PENAL-01': {
    nums: ['32', '33', '39', '40', '43'],
    note: 'Syllabus topic is not one numbered heading. Quoted official Penal Code definitions used as the nearest official text (act, omission, voluntarily, injury). Not commentary.',
    url: 'https://bdlaws.minlaw.gov.bd/act-details-11.html',
  },
  'T-PENAL-04': {
    nums: ['53'],
    note: 'Syllabus topic is not one numbered heading. Quoted official S.53 (punishments). Not commentary on “objectives”.',
    url: 'https://bdlaws.minlaw.gov.bd/act-details-11.html',
  },
  'T-LIM-13': {
    nums: ['3'],
    note: '“Waiver of limitation” is not a numbered heading in the Limitation Act, 1908. Quoted official S.3 (bar of limitation). Not a waiver commentary.',
    url: 'https://bdlaws.minlaw.gov.bd/act-details-88.html',
  },
}

const EXTRA_URLS = [
  'https://bdlaws.minlaw.gov.bd/act-86.html',
  'https://bdlaws.minlaw.gov.bd/act-details-86.html?lang=en',
  'https://bdlaws.minlaw.gov.bd/act-88.html',
  'https://bdlaws.minlaw.gov.bd/act-details-88.html?lang=en',
  'https://bdlaws.minlaw.gov.bd/act-details-367.html?lang=en',
  'https://bdlaws.minlaw.gov.bd/act-75.html',
  'https://bdlaws.minlaw.gov.bd/act-details-75.html?lang=en',
  'https://bdlaws.minlaw.gov.bd/act-details-11.html?lang=en',
  'https://bdlaws.minlaw.gov.bd/act-details-387.html?lang=en',
]

function load(p: string): Json {
  return JSON.parse(readFileSync(p, 'utf8')) as Json
}

function stripHtml(html: string): string {
  const parts: string[] = []
  let inTag = false
  const max = Math.min(html.length, 800_000)
  for (let i = 0; i < max; i++) {
    const c = html[i]
    if (c === '<') inTag = true
    else if (c === '>') inTag = false
    else if (!inTag) parts.push(c)
  }
  return parts
    .join('')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeHtml(s: string): boolean {
  return /<!DOCTYPE html/i.test(s) || /<html[\s>]/i.test(s) || /<\/body>/i.test(s)
}

function decodeBuffer(buf: Buffer): string {
  return buf.toString('utf8').replace(/\u0000/g, '')
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
    return decodeBuffer(Buffer.from(await res.arrayBuffer()))
  } finally {
    clearTimeout(t)
  }
}

function cacheName(url: string): string {
  return url.replace(/https?:\/\//, '').replace(/[^\w.-]+/g, '_') + '.txt'
}

async function loadUrl(url: string): Promise<string> {
  mkdirSync(cacheDir, { recursive: true })
  const cachePath = join(cacheDir, cacheName(url))
  if (existsSync(cachePath) && readFileSync(cachePath).length > 400) {
    return decodeBuffer(readFileSync(cachePath))
  }
  try {
    const raw = await fetchText(url)
    writeFileSync(cachePath, raw, 'utf8')
    console.error(`fetched ${url} (${raw.length} chars)`)
    return raw
  } catch (e) {
    console.error(`skip ${url}: ${e instanceof Error ? e.message : e}`)
    if (existsSync(cachePath)) return decodeBuffer(readFileSync(cachePath))
    return ''
  }
}

function extractOneSection(text: string, num: string): string {
  const needle = `${num}.`
  let from = 0
  while (from < text.length) {
    const i = text.indexOf(needle, from)
    if (i < 0) return ''
    const prev = i === 0 ? ' ' : text[i - 1]
    if (i === 0 || !/[0-9A-Za-z]/.test(prev)) {
      return text.slice(i, i + 6000).trim()
    }
    from = i + needle.length
  }
  return ''
}

function pickSections(raw: string, nums: string[]): Record<string, string> {
  const text = stripHtml(raw.slice(0, 1_200_000))
  const out: Record<string, string> = {}
  for (const num of nums) {
    const body = extractOneSection(text, num)
    if (body.length >= 80 && (!out[num] || body.length > out[num].length)) out[num] = body
  }
  return out
}

function parseOrders(raw: string): Record<string, string> {
  const text = stripHtml(raw)
  const out: Record<string, string> = {}
  const re = /ORDER\s+([IVX]+A?)\b/gi
  const hits: { roman: string; index: number }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    hits.push({ roman: m[1].toUpperCase().replace(/-/g, ''), index: m.index })
  }
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index
    const end = i + 1 < hits.length ? hits[i + 1].index : Math.min(text.length, start + 14000)
    const body = text.slice(start, end).trim()
    if (body.length < 80) continue
    const key = hits[i].roman
    if (!out[key] || body.length > out[key].length) out[key] = body
  }
  return out
}

function parseScheduleBlock(raw: string, heading: RegExp): string {
  const text = stripHtml(raw)
  const m = text.match(heading)
  if (!m || m.index == null) return ''
  const rest = text.slice(m.index, m.index + 20000).trim()
  return rest.length >= 120 ? rest : ''
}

function extractScheduleHrefs(html: string, actId: string): string[] {
  const out = new Set<string>()
  const re = new RegExp(`(?:href)=["']([^"']*act-${actId}[^"']*(?:schedule|order)[^"']*)["']`, 'gi')
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    let href = m[1]
    if (href.startsWith('//')) href = `https:${href}`
    else if (href.startsWith('/')) href = `https://bdlaws.minlaw.gov.bd${href}`
    else if (!/^https?:/i.test(href)) href = `https://bdlaws.minlaw.gov.bd/${href}`
    out.add(href)
  }
  return [...out]
}

function firstSentences(text: string, n = 2): string[] {
  const bits = text.split(/(?<=\.)\s+/).map((s) => s.trim()).filter((s) => s.length > 20)
  return bits.slice(0, n)
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
  const scan = (dir: string, filter: (n: string) => boolean) => {
    if (!existsSync(dir)) return
    for (const name of readdirSync(dir).filter(filter)) {
      const data = load(join(dir, name))
      for (const asset of (data.assets as Json[]) ?? []) {
        if (asset.asset_type === 'LESSON' && asset.is_shell !== true && asset.topic_id) {
          ids.add(String(asset.topic_id))
        }
      }
    }
  }
  scan(batchesDir, (n) => n.endsWith('.json'))
  scan(mobileCareer, (n) => /^bar_batch_\d+\.json$/.test(n))
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

function constitutionArticles(): Record<string, string> {
  return {}
}

function makeLesson(
  topic: Topic,
  quoted: string,
  url: string,
  cited: string,
  extraNote?: string,
): Json {
  const note = extraNote ? `${extraNote}\n\n` : ''
  const en = {
    title: topic.titleEn,
    short_description: `Official extract for ${topic.section} (${topic.titleEn}). Retrieved ${FETCHED}. Not lawyer-verified.`,
    learning_objective: `Read the official wording cited as ${cited} and map it to "${topic.titleEn}". This card quotes official text; it is not commentary and is not verified.`,
    explanation: `${note}Official English from ${url} (retrieved ${FETCHED}). Not lawyer-verified. Not a substitute for the full instrument.\n\nSyllabus: ${topic.titleEn} (${topic.section}).\n\n${quoted.slice(0, 14000)}`,
    key_concepts: [topic.section, topic.titleEn, cited, 'bdlaws.minlaw.gov.bd'],
    important_rules: firstSentences(quoted, 4).slice(0, 6),
    examples: [] as string[],
    exam_focus: `Before practice, open ${url} and read ${cited}. No invented MCQ keys here.`,
    common_traps: [
      'Treating this official extract as a verified commentary lesson.',
      'Assuming omitted rules, schedules, or Bangla authentic text are fully in this HTML extract.',
    ],
    key_takeaways: [`Official page: ${url}`, `Quoted: ${cited}`],
  }
  const bn = {
    title: topic.titleBn,
    short_description: `অফিসিয়াল উদ্ধৃতি — ${topic.section} (${topic.titleBn})। সংগ্রহ ${FETCHED}। আইনজীবী যাচাই হয়নি।`,
    learning_objective: `অফিসিয়াল পাঠ ${cited} পড়ে সিলেবাস "${topic.titleBn}"-এর সাথে মিলান। ভাষ্য নয়; যাচাইকৃত নয়।`,
    explanation: `${note}অফিসিয়াল ইংরেজি পাঠ ${url} (সংগ্রহ ${FETCHED})। বাংলা পূর্ণ পাঠ একই অফিসিয়াল সূত্রে। এখানে বাংলা অনুবাদ উদ্ভাবন করা হয়নি।\n\nসিলেবাস: ${topic.titleBn} (${topic.section})।\n\n${quoted.slice(0, 14000)}`,
    key_concepts: [topic.section, topic.titleBn, cited, 'bdlaws.minlaw.gov.bd'],
    important_rules: firstSentences(quoted, 4).slice(0, 6),
    examples: [] as string[],
    exam_focus: `পরীক্ষার আগে ${url} খুলে ${cited} নোট করুন। নকল MCQ/উত্তর এখানে নেই।`,
    common_traps: [
      'এই অফিসিয়াল উদ্ধৃতিকে verified ভাষ্য ভাবা।',
      'বাদ পড়া বিধি/তফসিল এই HTML উদ্ধৃতিতে আছে বলে ধরে নেওয়া।',
    ],
    key_takeaways: [`অফিসিয়াল পাতা: ${url}`, `উদ্ধৃত: ${cited}`],
  }
  return {
    content_id: `BC-OFFICIAL-${topic.topicId}`,
    asset_type: 'LESSON',
    lesson_id: `BC-OFFICIAL-${topic.topicId}`,
    topic_id: topic.topicId,
    module_id: topic.moduleId,
    status: 'PENDING_REVIEW',
    verification_status: 'OFFICIAL_FETCHED_PENDING_LAWYER',
    verification_note: `Official extract retrieved ${FETCHED}. Bangla statute text was not invented. No MCQ. Lawyer review still required.`,
    is_shell: false,
    official_url: url,
    section_or_order: topic.section,
    official_fetched_at: FETCHED,
    cited_interactive: true,
    language_versions: { en, bn },
  }
}

function merge(into: Record<string, string>, add: Record<string, string>) {
  for (const [k, v] of Object.entries(add)) {
    if (!into[k] || v.length > into[k].length) into[k] = v
  }
}

async function main() {
  const already = uniqueTopicIds()
  const topics = loadTopics()
  const remaining = topics.filter((t) => !already.has(t.topicId))
  console.error(`remaining shells ${remaining.length}`)

  const htmlBlobs: string[] = []
  console.error('loading cache')
  for (const name of readdirSync(cacheDir).filter((n) => n.endsWith('.txt'))) {
    if (!/act-(11|75|86|88|387|details-11|details-75|details-86|details-88|details-387|details-367)/.test(name)) continue
    htmlBlobs.push(decodeBuffer(readFileSync(join(cacheDir, name))).slice(0, 800_000))
    console.error(`cached ${name}`)
  }
  const cpcSchedule = join(cacheDir, 'bdlaws-cpc-first-schedule.txt')
  if (existsSync(cpcSchedule)) {
    htmlBlobs.push(readFileSync(cpcSchedule, 'utf8'))
    console.error('cached bdlaws-cpc-first-schedule.txt')
  }
  console.error(`cache blobs ${htmlBlobs.length}`)
  // Prefer cache. Extra URLs only when a needed act page is missing.
  const haveCpc = htmlBlobs.some((h) => /civil procedure/i.test(h))
  const haveCrpc = htmlBlobs.some((h) => /criminal procedure/i.test(h))
  const havePenal = htmlBlobs.some((h) => /penal code/i.test(h))
  const haveEth = htmlBlobs.some((h) => /bar council/i.test(h))
  const missingUrls = EXTRA_URLS.filter((u) => {
    if (u.includes('act-86') || u.includes('details-86')) return !haveCpc
    if (u.includes('act-75') || u.includes('details-75')) return !haveCrpc
    if (u.includes('act-11') || u.includes('details-11')) return !havePenal
    if (u.includes('387')) return !haveEth
    if (u.includes('367')) return true
    if (u.includes('act-88')) return true
    return false
  })
  for (const url of missingUrls) {
    console.error(`fetch ${url}`)
    const raw = await loadUrl(url)
    if (raw) htmlBlobs.push(raw.slice(0, 800_000))
  }

  const discovered: string[] = []
  for (const html of htmlBlobs) {
    discovered.push(...extractScheduleHrefs(html, '86'))
    discovered.push(...extractScheduleHrefs(html, '88'))
  }
  for (const href of [...new Set(discovered)].slice(0, 8)) {
    console.error(`schedule ${href}`)
    const raw = await loadUrl(href)
    if (raw) htmlBlobs.push(raw.slice(0, 800_000))
  }

  const sections: Record<string, Record<string, string>> = {
    CRPC: {},
    PENAL: {},
    LIM: {},
    ETH: {},
    CONST: constitutionArticles(),
  }
  const orders: Record<string, string> = {}
  let limSchedule = ''
  let ethicsPreamble = ''

  for (const html of htmlBlobs) {
    const lower = html.toLowerCase()
    if (lower.includes('criminal procedure')) merge(sections.CRPC, pickSections(html, ['4', '144', '172', '173', '561A']))
    if (lower.includes('penal code')) merge(sections.PENAL, pickSections(html, ['32', '33', '39', '40', '43', '53']))
    if (lower.includes('limitation act')) {
      merge(sections.LIM, pickSections(html, ['3', '29']))
      const sch = parseScheduleBlock(html, /THE FIRST SCHEDULE/i)
      if (sch.length > limSchedule.length) limSchedule = sch
    }
    if (lower.includes('bar council')) {
      merge(sections.ETH, pickSections(html, ['3', '8', '10', '21', '27', '32', '40', '44']))
      const meta = html.match(/name="Description"\s+content="([^"]+)"/i)
      if (meta?.[1] && meta[1].length > ethicsPreamble.length) ethicsPreamble = meta[1]
      const stripped = stripHtml(html.slice(0, 400000))
      if (/oath/i.test(stripped)) {
        const om = stripped.match(/[^.]*oath[^.]*\./i)
        if (om && om[0].length > 40) sections.ETH.oath = om[0]
      }
      if (/bar association/i.test(stripped)) {
        const am = stripped.match(/[^.]*Bar Association[^.]*\./i)
        if (am && am[0].length > 40) sections.ETH.assoc = am[0]
      }
    }
    if (lower.includes('constitution of the people')) {
      merge(sections.CONST, pickSections(html, ['94', '95', '96', '101', '102', '103', '107', '109', '111']))
    }
    if (lower.includes('civil procedure') || /ORDER\s+[IVX]+/i.test(html)) {
      merge(orders, parseOrders(html))
    }
  }

  console.error(JSON.stringify({
    crpc: Object.keys(sections.CRPC).length,
    penal: Object.keys(sections.PENAL).length,
    lim: Object.keys(sections.LIM).length,
    eth: Object.keys(sections.ETH).length,
    const: Object.keys(sections.CONST).length,
    orders: Object.keys(orders),
    limSchedule: limSchedule.length,
  }))

  const byModule: Record<string, Json[]> = {
    CPC: [],
    CRPC: [],
    PENAL: [],
    LIM: [],
    ETH: [],
  }
  const converted: string[] = []
  const skipped: { id: string; reason: string }[] = []

  for (const topic of remaining) {
    if (ORDER_MAP[topic.topicId]) {
      const romans = ORDER_MAP[topic.topicId]
      const found = romans
        .map((r) => ({ r, text: orders[r] || orders[r.replace(/-/g, '')] || '' }))
        .filter((x) => x.text.length >= 80)
      if (!found.length) {
        skipped.push({ id: topic.topicId, reason: `no_order_html:${romans.join(',')}` })
        continue
      }
      const quoted = found.map((x) => x.text.slice(0, 4500)).join('\n\n')
      byModule.CPC.push(
        makeLesson(
          topic,
          quoted,
          'https://bdlaws.minlaw.gov.bd/act-details-86.html',
          found.map((x) => `Order ${x.r}`).join(', '),
          'First Schedule / Orders quoted from official CPC HTML where present.',
        ),
      )
      converted.push(topic.topicId)
      already.add(topic.topicId)
      continue
    }

    if (topic.topicId === 'T-LIM-14' && limSchedule.length >= 120) {
      byModule.LIM.push(
        makeLesson(
          topic,
          limSchedule.slice(0, 12000),
          'https://bdlaws.minlaw.gov.bd/act-details-88.html',
          'First Schedule',
          'Official First Schedule block from Limitation Act HTML. Not a reconstructed table.',
        ),
      )
      converted.push(topic.topicId)
      already.add(topic.topicId)
      continue
    }

    if (RELATED_SECTIONS[topic.topicId]) {
      const spec = RELATED_SECTIONS[topic.topicId]
      const pool = topic.topicId.startsWith('T-PENAL') ? sections.PENAL : sections.LIM
      const found = spec.nums
        .map((num) => ({ num, text: pool[num] || '' }))
        .filter((s) => s.text.length >= 80)
      if (!found.length) {
        skipped.push({ id: topic.topicId, reason: `no_related_text:${spec.nums.join(',')}` })
        continue
      }
      const quoted = found.map((s) => `Section ${s.num}.\n${s.text.slice(0, 4500)}`).join('\n\n')
      const bucket = topic.topicId.startsWith('T-PENAL') ? 'PENAL' : 'LIM'
      byModule[bucket].push(makeLesson(topic, quoted, spec.url, found.map((s) => `S.${s.num}`).join(', '), spec.note))
      converted.push(topic.topicId)
      already.add(topic.topicId)
      continue
    }

    if (topic.topicId === 'T-CRPC-01' || topic.topicId === 'T-CRPC-07' || topic.topicId === 'T-CRPC-11' || topic.topicId === 'T-CRPC-27') {
      const nums =
        topic.topicId === 'T-CRPC-01'
          ? ['4']
          : topic.topicId === 'T-CRPC-07'
            ? ['144']
            : topic.topicId === 'T-CRPC-11'
              ? ['172', '173']
              : ['561A']
      const found = nums
        .map((num) => ({ num, text: sections.CRPC[num] || '' }))
        .filter((s) => s.text.length >= 80)
      if (!found.length) {
        skipped.push({ id: topic.topicId, reason: `no_official_text:${nums.join(',')}` })
        continue
      }
      const quoted = found.map((s) => `Section ${s.num}.\n${s.text.slice(0, 4500)}`).join('\n\n')
      byModule.CRPC.push(
        makeLesson(topic, quoted, 'https://bdlaws.minlaw.gov.bd/act-details-75.html', found.map((s) => `S.${s.num}`).join(', ')),
      )
      converted.push(topic.topicId)
      already.add(topic.topicId)
      continue
    }

    if (topic.topicId === 'T-ETH-08') {
      const arts = ['94', '95', '96', '101', '102', '103', '107', '109', '111']
      const found = arts
        .map((n) => sections.CONST[n] || '')
        .filter((t) => t.length >= 40)
      if (!found.length) {
        skipped.push({ id: topic.topicId, reason: 'no_constitution_articles' })
        continue
      }
      byModule.ETH.push(
        makeLesson(
          topic,
          found.join('\n\n').slice(0, 12000),
          'https://bdlaws.minlaw.gov.bd/act-details-367.html',
          arts.map((n) => `Art.${n}`).join(', '),
          'Official Constitution articles on the Supreme Court (existing corpus / bdlaws). Not Bar Council commentary.',
        ),
      )
      converted.push(topic.topicId)
      already.add(topic.topicId)
      continue
    }

    if (topic.topicId === 'T-ETH-01' && ethicsPreamble.length >= 80) {
      byModule.ETH.push(
        makeLesson(
          topic,
          ethicsPreamble,
          'https://bdlaws.minlaw.gov.bd/act-details-387.html',
          'Preamble / WHEREAS (Bar Council Order, 1972)',
          'Official WHEREAS clause of the Bangladesh Legal Practitioner\'s and Bar Council Order, 1972. Not invented social-duty commentary.',
        ),
      )
      converted.push(topic.topicId)
      already.add(topic.topicId)
      continue
    }

    if (topic.moduleId.includes('ETHIC')) {
      const pool = sections.ETH
      const keys = Object.keys(pool)
      const needle = topic.titleEn.toLowerCase()
      let hit = ''
      let hitKey = ''
      for (const k of keys) {
        const t = pool[k]
        if (/oath/i.test(t) && topic.topicId === 'T-ETH-04') {
          hit = t
          hitKey = k
          break
        }
        if (/bar association/i.test(t) && topic.topicId === 'T-ETH-07') {
          hit = t
          hitKey = k
          break
        }
        if (/enrol/i.test(t) && /advocat/i.test(t) && (topic.topicId === 'T-ETH-04' || topic.topicId === 'T-ETH-09')) {
          if (t.length > hit.length) {
            hit = t
            hitKey = k
          }
        }
        if (topic.topicId === 'T-ETH-09' && /rule/i.test(needle) && /bar council/i.test(t) && t.length > hit.length) {
          hit = t
          hitKey = k
        }
      }
      if (hit.length >= 80) {
        byModule.ETH.push(
          makeLesson(
            topic,
            `Article/section ${hitKey}.\n${hit.slice(0, 6000)}`,
            'https://bdlaws.minlaw.gov.bd/act-details-387.html',
            `Art.${hitKey}`,
            'Matched official Bar Council Order HTML to this syllabus heading. Canons/Rules 1972 may still be a different instrument.',
          ),
        )
        converted.push(topic.topicId)
        already.add(topic.topicId)
        continue
      }
      skipped.push({ id: topic.topicId, reason: 'no_official_ethics_match' })
      continue
    }

    skipped.push({ id: topic.topicId, reason: 'unmapped' })
  }

  const existingNums = readdirSync(mobileCareer)
    .map((n) => n.match(/^bar_batch_(\d+)\.json$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => Number(m[1]))
  let next = Math.max(33, ...existingNums, 33) + 1
  const batchMeta: { n: string; module: string; count: number }[] = []
  for (const [mod, assets] of Object.entries(byModule)) {
    if (!assets.length) continue
    const n = String(next).padStart(3, '0')
    next++
    const batch = {
      batch_id: `BATCH-2026-09-${n}-OFFICIAL-${mod}`,
      schema_version: '1.0',
      content_version: '2026.09.14',
      created_at: `${FETCHED}T12:00:00Z`,
      source: 'bdlaws.minlaw.gov.bd-official-html',
      operation: 'CREATE',
      status: 'PENDING_REVIEW',
      batch_purpose: `Official extracts for remaining ${mod} shells. Interactive lesson player. No invented MCQ. Not lawyer-verified.`,
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
  shells.batch_purpose =
    'Syllabus topic shells pointing at official sources. Topics with official extracts were moved to unique lesson batches. No invented MCQ.'
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
    note: 'Unique bodies = flagship doctrinal + official bdlaws/constitution extracts (OFFICIAL_FETCHED_PENDING_LAWYER). Remaining shells lack official HTML (Canons/Rules 1972, ethics N/A, missing Orders). No scraped banks, no invented law.',
  }
  writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`)

  console.log(
    JSON.stringify(
      {
        converted: converted.length,
        uniqueTopics: already.size,
        remainingShells: remainingShells.length,
        batches: batchMeta,
        convertedIds: converted,
        skipped,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
