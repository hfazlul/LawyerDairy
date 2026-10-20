/**
 * Count unique Bar practice items. Build HC Permission drills from official
 * bdlaws Constitution extracts + already-verified revision facts.
 * Does not scrape Ain Prokash / Live MCQ. Does not invent past-paper years.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const webappRoot = join(here, '..')
const repoRoot = join(webappRoot, '..')
const cacheDir = join(here, 'official-cache')
const batchesDir = join(repoRoot, 'Barcouncil assets', 'batches')
const mobileCareer = join(repoRoot, 'mobile', 'assets', 'career')
const FETCHED = '2026-09-14'

type Json = Record<string, unknown>

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

function extractArticle(html: string, num: string): string {
  const text = stripHtml(html)
  const re = new RegExp(`${num}\\.\\s*\\(1\\)[\\s\\S]{80,3500}?(?=\\n\\s*\\d{2,3}\\.\\s*\\(|$)`)
  const m = text.match(re)
  if (m) return m[0].replace(/\s+/g, ' ').trim().slice(0, 2200)
  const idx = text.indexOf(`${num}. (1)`)
  if (idx < 0) return ''
  return text.slice(idx, idx + 1800).replace(/\s+/g, ' ').trim()
}

function letterFor(options: string[], answer: string): string {
  const i = options.findIndex((o) => o.trim() === answer.trim())
  return i >= 0 ? String.fromCharCode(65 + i) : 'A'
}

type Counts = {
  files: number
  uniqueIds: number
  lesson: number
  mcq: number
  written: number
  viva: number
  model: number
  lawSection: number
  other: number
  withYear: number
  authenticPrev: number
}

function countBar(): Counts {
  const seen = new Set<string>()
  const c: Counts = {
    files: 0,
    uniqueIds: 0,
    lesson: 0,
    mcq: 0,
    written: 0,
    viva: 0,
    model: 0,
    lawSection: 0,
    other: 0,
    withYear: 0,
    authenticPrev: 0,
  }
  if (!existsSync(batchesDir)) return c
  for (const name of readdirSync(batchesDir).filter((n) => n.endsWith('.json')).sort()) {
    c.files++
    const data = load(join(batchesDir, name))
    for (const raw of (data.assets as Json[]) ?? []) {
      const id = String(raw.content_id || raw.id || '')
      if (!id || seen.has(id)) continue
      seen.add(id)
      c.uniqueIds++
      const t = String(raw.asset_type || '').toUpperCase()
      if (t === 'LESSON') c.lesson++
      else if (t === 'MCQ') c.mcq++
      else if (t === 'WRITTEN_QUESTION') c.written++
      else if (t === 'VIVA_QUESTION') c.viva++
      else if (t === 'MODEL_TEST') c.model++
      else if (t === 'LAW_SECTION') c.lawSection++
      else c.other++
      const year = String(raw.exam_year || raw.paper_year || raw.year || '')
      if (/^\d{4}$/.test(year)) c.withYear++
      const origin = String(raw.question_origin || '')
      if (origin === 'AUTHENTIC_PREVIOUS' || origin === 'AUTHENTIC_REPORTED_QUESTION') c.authenticPrev++
    }
  }
  return c
}

function lessonAsset(opts: {
  id: string
  section: string
  titleEn: string
  titleBn: string
  url: string
  cited: string
  explanationEn: string
  explanationBn: string
  rulesEn: string[]
  rulesBn: string[]
}): Json {
  return {
    content_id: opts.id,
    asset_type: 'LESSON',
    section_id: opts.section,
    module_id: opts.section,
    topic_id: opts.id,
    status: 'PENDING_REVIEW',
    verification_status: 'OFFICIAL_FETCHED_PENDING_LAWYER',
    question_origin: 'ORIGINAL_PRACTICE',
    official_url: opts.url,
    source: 'bdlaws.minlaw.gov.bd',
    fetched: FETCHED,
    language_versions: {
      en: {
        title: opts.titleEn,
        short_description: `Official extract ${opts.cited}. Practice drill — not a past paper.`,
        learning_objective: `Read the official wording of ${opts.cited} and map it to High Court Permission practice.`,
        explanation: opts.explanationEn,
        key_concepts: [opts.cited, 'High Court Division', 'অনুশীলন'],
        important_rules: opts.rulesEn,
        exam_focus: 'Anushilon drill from official statute text. Not labelled as any exam year.',
        key_takeaways: [
          'This card quotes official public law. It is not a 2012–2025 question paper.',
          'Lawyer review still required before relying on it in court.',
        ],
      },
      bn: {
        title: opts.titleBn,
        short_description: `অফিসিয়াল উদ্ধৃতি ${opts.cited}। অনুশীলন — বিগত সালের পেপার নয়।`,
        learning_objective: `${opts.cited}-এর অফিসিয়াল পাঠ পড়ে হাইকোর্ট পারমিশন অনুশীলনে মিলান।`,
        explanation: opts.explanationBn,
        key_concepts: [opts.cited, 'হাইকোর্ট বিভাগ', 'অনুশীলন'],
        important_rules: opts.rulesBn,
        exam_focus: 'অফিসিয়াল আইন থেকে অনুশীলন। কোনো সালের পেপার নয়।',
        key_takeaways: [
          'এই কার্ড সরকারি আইনের উদ্ধৃতি। ২০১২–২০২৫ পেপার নয়।',
          'আদালতে ব্যবহারের আগে আইনজীবী যাচাই প্রয়োজন।',
        ],
      },
    },
  }
}

async function fetchOnce(url: string): Promise<{ ok: boolean; status: number; bytes: number }> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), 25000)
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { 'User-Agent': 'MamlaqOfficialRetry/1.0' },
    })
    const buf = Buffer.from(await res.arrayBuffer())
    return { ok: res.ok, status: res.status, bytes: buf.length }
  } catch {
    return { ok: false, status: 0, bytes: 0 }
  } finally {
    clearTimeout(t)
  }
}

async function main() {
  const bar = countBar()
  const constPath = join(cacheDir, 'bdlaws.minlaw.gov.bd_act-details-367.html_lang_en.txt')
  const html = existsSync(constPath) ? readFileSync(constPath, 'utf8') : ''
  const art94 = extractArticle(html, '94')
  const art102 = extractArticle(html, '102')
  const art103 = extractArticle(html, '103')
  const art107 = extractArticle(html, '107')
  const constUrl = 'https://bdlaws.minlaw.gov.bd/act-details-367.html?lang=en'

  const hcCanonical = load(join(mobileCareer, 'hc_canonical.json'))
  const rev = ((hcCanonical.assets as Json[]) ?? []).find((a) => a.content_id === 'REVISION-TEST-001')
  const nested = ((rev?.questions as Json[]) ?? [])

  const prevMcq: Json[] = nested.map((q, i) => {
    const en = (q.en || {}) as Json
    const bn = (q.bn || {}) as Json
    const enOpts = (en.options as string[]) ?? []
    const bnOpts = (bn.options as string[]) ?? enOpts
    const enAns = String(en.answer || '')
    const bnAns = String(bn.answer || enAns)
    const key = letterFor(enOpts, enAns)
    const bnKey = letterFor(bnOpts, bnAns)
    return {
      content_id: `HC-PREVQ-RT-${String(q.id || i + 1)}`,
      asset_type: 'MCQ',
      section_id: 'SEC-PREVQ',
      module_id: 'SEC-PREVQ',
      topic_id: 'HC-PREVQ-BANK',
      status: 'PENDING_REVIEW',
      question_origin: 'ORIGINAL_PRACTICE',
      question_type: 'MCQ',
      correct_answer: key,
      related_lesson: q.related_lesson,
      official_url: constUrl,
      language_versions: {
        en: {
          question: String(en.q || ''),
          options: Object.fromEntries(enOpts.map((t, idx) => [String.fromCharCode(65 + idx), t])),
          explanation: `${en.explanation || ''} — অনুশীলন (সূত্র: verified HC dataset + Constitution). Not an official past paper.`,
        },
        bn: {
          question: String(bn.q || ''),
          options: Object.fromEntries(bnOpts.map((t, idx) => [String.fromCharCode(65 + idx), t])),
          explanation: `${bn.explanation || ''} — অনুশীলন। অফিসিয়াল বিগত পেপার নয়।`,
          correct_answer_note: bnKey,
        },
      },
    }
  })

  const assets: Json[] = [
    lessonAsset({
      id: 'HC-DRILL-ART94',
      section: 'SEC-START',
      titleEn: 'Constitution Art. 94 — Supreme Court structure',
      titleBn: 'সংবিধান অনুচ্ছেদ ৯৪ — সুপ্রিম কোর্ট কাঠামো',
      url: constUrl,
      cited: 'Constitution Art. 94',
      explanationEn: `Official English from ${constUrl} (retrieved ${FETCHED}). Not lawyer-verified.\n\n${art94 || 'Open the official Constitution page for Art. 94.'}`,
      explanationBn: `অফিসিয়াল ইংরেজি উদ্ধৃতি ${constUrl} (সংগ্রহ ${FETCHED})। আইনজীবী যাচাই হয়নি। বাংলা ধারা উদ্ভাবন করা হয়নি।\n\n${art94 || 'অনুচ্ছেদ ৯৪ অফিসিয়াল পাতায় খুলুন।'}`,
      rulesEn: [
        'Art. 94(1): one Supreme Court comprising Appellate Division and High Court Division.',
        'Judges of each division sit only in that division.',
      ],
      rulesBn: [
        'অনুচ্ছেদ ৯৪(১): একটি সুপ্রিম কোর্ট — আপিল বিভাগ ও হাইকোর্ট বিভাগ।',
        'প্রতি বিভাগের বিচারক শুধু সেই বিভাগে বসেন।',
      ],
    }),
    lessonAsset({
      id: 'HC-DRILL-ART102',
      section: 'SEC-SYLL',
      titleEn: 'Constitution Art. 102 — High Court writ jurisdiction',
      titleBn: 'সংবিধান অনুচ্ছেদ ১০২ — হাইকোর্ট রিট এখতিয়ার',
      url: constUrl,
      cited: 'Constitution Art. 102',
      explanationEn: `Official English from ${constUrl} (retrieved ${FETCHED}). Not lawyer-verified.\n\n${art102 || 'Open Art. 102 on bdlaws.'}`,
      explanationBn: `অফিসিয়াল ইংরেজি উদ্ধৃতি। বাংলা ধারা উদ্ভাবন করা হয়নি।\n\n${art102 || 'অনুচ্ছেদ ১০২ অফিসিয়াল পাতায়।'}`,
      rulesEn: [
        'Art. 102 is the writ machinery of the High Court Division.',
        'Permission written exam often tests drafting a writ — confirm the live Bar Council notice.',
      ],
      rulesBn: [
        'অনুচ্ছেদ ১০২ হাইকোর্ট বিভাগের রিট প্রক্রিয়া।',
        'পারমিশন লিখিত পরীক্ষা প্রায়ই রিট খসড়া চায় — চলতি নোটিশ দেখুন।',
      ],
    }),
    lessonAsset({
      id: 'HC-DRILL-ART103',
      section: 'SEC-AD',
      titleEn: 'Constitution Art. 103 — Appellate Division appeals',
      titleBn: 'সংবিধান অনুচ্ছেদ ১০৩ — আপিল বিভাগে আপিল',
      url: constUrl,
      cited: 'Constitution Art. 103',
      explanationEn: `Official English from ${constUrl} (retrieved ${FETCHED}). AD enrolment is separate from HC Permission.\n\n${art103 || 'Open Art. 103 on bdlaws.'}`,
      explanationBn: `আপিল বিভাগ এনরোলমেন্ট হাইকোর্ট পারমিশন থেকে আলাদা।\n\n${art103 || 'অনুচ্ছেদ ১০৩ অফিসিয়াল পাতায়।'}`,
      rulesEn: [
        'Art. 103(1): AD hears appeals from HCD judgments, decrees, orders or sentences.',
        'Never merge AD enrolment with the HC Permission drafting paper.',
      ],
      rulesBn: [
        'অনুচ্ছেদ ১০৩(১): আপিল বিভাগ হাইকোর্ট বিভাগের রায়/ডিক্রি/আদেশ/দণ্ডের আপিল শোনে।',
        'আপিল বিভাগ এনরোলমেন্ট ও হাইকোর্ট পারমিশন মিশাবেন না।',
      ],
    }),
    lessonAsset({
      id: 'HC-DRILL-ART107',
      section: 'SEC-HCPRAC',
      titleEn: 'Constitution Art. 107 — Supreme Court rule-making',
      titleBn: 'সংবিধান অনুচ্ছেদ ১০৭ — সুপ্রিম কোর্টের রুল প্রণয়ন',
      url: constUrl,
      cited: 'Constitution Art. 107',
      explanationEn: `Official English from ${constUrl} (retrieved ${FETCHED}). Practice directions sit under this power.\n\n${art107 || 'Open Art. 107 on bdlaws.'}`,
      explanationBn: `প্র্যাকটিস ডিরেকশন এই ক্ষমতার অধীনে। বাংলা ধারা উদ্ভাবন করা হয়নি।\n\n${art107 || 'অনুচ্ছেদ ১০৭ অফিসিয়াল পাতায়।'}`,
      rulesEn: [
        'Art. 107(1): Supreme Court may make rules for practice and procedure of each division, with President’s approval, subject to Parliament.',
        'The High Court Division Rules are not a downloadable past-paper bank.',
      ],
      rulesBn: [
        'অনুচ্ছেদ ১০৭(১): সুপ্রিম কোর্ট প্রতি বিভাগের কার্যপ্রণালী রুল করতে পারে।',
        'হাইকোর্ট রুলস কোনো বিগত প্রশ্নপত্র ব্যাংক নয়।',
      ],
    }),
    lessonAsset({
      id: 'HC-DRILL-PREVQ-HONEST',
      section: 'SEC-PREVQ',
      titleEn: 'Previous papers: official bank is empty — practice drills',
      titleBn: 'বিগত পেপার: অফিসিয়াল ব্যাংক খালি — অনুশীলন ড্রিল',
      url: 'https://www.barcouncil.gov.bd/enrolment-examination-syllabus/',
      cited: 'barcouncil.gov.bd / supremecourt.gov.bd',
      explanationEn:
        'Searched 14 Sep 2026: barcouncil.gov.bd (home, syllabus, notices, Order & Rules), supremecourt.gov.bd, dpp.gov.bd gazettes. No downloadable 2012–2025 enrolment or HC Permission question-paper PDF. Ain Prokash / Live MCQ / QuesBankBD were not scraped (copyright). This module is অনুশীলন: statute drills + unique items already in the user’s JSON. Never labelled Exam 2012 unless the file is that paper.',
      explanationBn:
        '১৪ সেপ্টেম্বর ২০২৬ অনুসন্ধান: barcouncil.gov.bd, supremecourt.gov.bd, dpp.gov.bd গেজেট। ২০১২–২০২৫ অফিসিয়াল প্রশ্নপত্র PDF পাওয়া যায়নি। Ain Prokash / Live MCQ / QuesBankBD স্ক্র্যাপ করা হয়নি (কপিরাইট)। এই মডিউল অনুশীলন: আইন-ড্রিল + ব্যবহারকারীর JSON-এর ইউনিক আইটেম। ফাইল সেই পেপার না হলে “পরীক্ষা ২০১২” লেখা হয়নি।',
      rulesEn: [
        'Official past papers in this app: 0.',
        'Interactive practice bank uses user JSON + official-rule drills.',
      ],
      rulesBn: [
        'অ্যাপে অফিসিয়াল বিগত পেপার: ০।',
        'ইন্টারঅ্যাকটিভ অনুশীলন = ব্যবহারকারীর JSON + অফিসিয়াল রুল ড্রিল।',
      ],
    }),
    lessonAsset({
      id: 'HC-DRILL-PROGRESS',
      section: 'SEC-PROGRESS',
      titleEn: 'How My Progress is counted',
      titleBn: 'আমার অগ্রগতি কীভাবে গণনা হয়',
      url: 'https://www.barcouncil.gov.bd/',
      cited: 'in-app progress',
      explanationEn:
        'Progress records MCQ submits and opened lessons on this phone (XP, streak, answers). It tracks অনুশীলন items — including these official-rule drills — not pirated past papers. No leaderboard in v1.',
      explanationBn:
        'অগ্রগতি এই ফোনে MCQ জমা ও খোলা পাঠ গণনা করে (XP, স্ট্রিক, উত্তর)। এটি অনুশীলন আইটেম ট্র্যাক করে — চুরি করা বিগত পেপার নয়। v1-এ লিডারবোর্ড নেই।',
      rulesEn: ['Local stats work offline. Signed-in sync is extra, not required to see numbers.'],
      rulesBn: ['লোকাল পরিসংখ্যান অফলাইনে কাজ করে। লগইন সিঙ্ক অতিরিক্ত।'],
    }),
    ...prevMcq,
  ]

  const pack = {
    schema_version: '1.0',
    dataset_id: 'HC_PERMISSION_OFFICIAL_DRILLS',
    status: 'PENDING_REVIEW',
    official_past_papers: 0,
    practice_items: assets.length,
    note: 'অফিসিয়াল বিগত পেপার 0; ইন্টারঅ্যাকটিভ প্রশ্নব্যাংক = user JSON Bar items + these statute drills. Not Exam 2012.',
    fetched: FETCHED,
    assets,
  }

  mkdirSync(mobileCareer, { recursive: true })
  const drillsPath = join(mobileCareer, 'hc_permission_drills.json')
  writeFileSync(drillsPath, `${JSON.stringify(pack, null, 2)}\n`)

  const officialProbe = {
    barcouncilHome: await fetchOnce('https://www.barcouncil.gov.bd/'),
    barcouncilSyllabus: await fetchOnce('https://www.barcouncil.gov.bd/enrolment-examination-syllabus/'),
    supremeCourt: await fetchOnce('https://www.supremecourt.gov.bd/'),
    cpcBn: await fetchOnce('https://bdlaws.minlaw.gov.bd/act-details-86.html?lang=bn'),
    crpcBn: await fetchOnce('https://bdlaws.minlaw.gov.bd/act-details-75.html?lang=bn'),
    penalBn: await fetchOnce('https://bdlaws.minlaw.gov.bd/act-details-11.html?lang=bn'),
    constSched: await fetchOnce('https://bdlaws.minlaw.gov.bd/act-details-367.html?lang=en'),
  }

  const coverage = {
    date: FETCHED,
    syllabusTopics: 134,
    uniqueDoctrinalLessons: 134,
    officialPastPapers: 0,
    barPracticeBank: bar,
    hcDrills: {
      lessons: assets.filter((a) => a.asset_type === 'LESSON').length,
      mcq: assets.filter((a) => a.asset_type === 'MCQ').length,
      file: 'mobile/assets/career/hc_permission_drills.json',
    },
    officialProbe,
    whyPastPapersZero:
      'Official sites (barcouncil.gov.bd, supremecourt.gov.bd, dpp.gov.bd gazette) publish notices/syllabus/orders, not a downloadable 2012–2025 question-paper PDF. Commercial banks were not scraped. Interactive bank = unique user-JSON MCQ/written/viva + official-rule drills labelled অনুশীলন.',
    note: `অফিসিয়াল বিগত পেপার 0; ইন্টারঅ্যাকটিভ প্রশ্নব্যাংক = ${bar.mcq + bar.written + bar.viva} Bar items from user JSON + ${assets.length} HC drills.`,
  }
  writeFileSync(
    join(repoRoot, 'docs', 'plan', 'mobile-v3', '_career_coverage_2026-09-14.json'),
    `${JSON.stringify(coverage, null, 2)}\n`,
  )
  console.log(JSON.stringify({ bar, drills: assets.length, officialProbe }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
