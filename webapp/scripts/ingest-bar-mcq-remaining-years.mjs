/**
 * Ingest leftover user Bar MCQ years into remote batches 047–053.
 * 047 = June 2026 Set ক (user photos). 048–053 = parsed Live MCQ PDFs already on disk.
 * Does not scrape websites. Does not invent missing stems.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { batchEnvelope, citedIssuesFromPrompt, mcqAsset, writtenAsset } from './career-pack-helpers.mjs'
import { BAR_MCQ_2026 as MCQ2026 } from './bar-mcq-2026-set-ka.mjs'
import { BJS_2021_EXTRA } from './bjs-2021-written-extra.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const outMobile = join(repo, 'mobile', 'assets', 'career')
const outBar = join(repo, 'Barcouncil assets', 'batches')
const outWeb = join(repo, 'webapp', 'data', 'career', 'packs')
const parsedDir = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'user-pdfs-2026-09-16', 'parsed')

function writeJson(abs, obj) {
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, `${JSON.stringify(obj, null, 2)}\n`, 'utf8')
}

function copyPack(name, obj) {
  writeJson(join(outMobile, name), obj)
  writeJson(join(outWeb, name), obj)
}

function extraRepair(s) {
  return String(s || '')
    .replace(/রকািণ ন্স ফ বান্সেল/g, 'কোনটিই নয়')
    .replace(/ন্স েন/g, 'দিন')
    .replace(/সশ্নবণাচ্চ/g, 'সর্বোচ্চ')
    .replace(/শান্সি/g, 'শাস্তি')
    .replace(/করশ্নল োর/g, 'করলে তার')
    .replace(/সিপন্সরিার্/g, 'অর্ধেক')
    .replace(/চেুেণাংশ/g, 'চতুর্থাংশ')
    .replace(/অশ্নধণক/g, 'অর্ধেক')
    .replace(/োন্সরখ্ হশ্নে/g, 'তারিখ হবে')
    .replace(/স্ব ােণ জন্সিে/g, 'স্থাপন জারি')
    .replace(/অন্সফস/g, 'অফিস')
    .replace(/অন্স ফস/g, 'অফিস')
    .replace(/েত্তক নয/g, 'হতে কন্যা')
    .replace(/েত্ত ক পুত্র/g, 'হতেক পুত্র')
    .replace(/পালক ন্স পো/g, 'পালক পিতা')
    .replace(/প্রশ্নিণ র াষর্া/g, 'প্রতিনিধি হিসাবে')
    .replace(/প্রশ্ন িণ র াষর্ া/g, 'প্রতিনিধি হিসাবে')
    .replace(/র াষর্া/g, 'হিসাবে')
    .trim()
}

function fillHundred(items, year) {
  const byN = new Map(items.map((it) => [it.n, it]))
  const out = []
  for (let n = 1; n <= 100; n++) {
    const hit = byN.get(n)
    if (hit) {
      out.push({
        ...hit,
        question: extraRepair(hit.question),
        options: {
          A: extraRepair(hit.options?.A),
          B: extraRepair(hit.options?.B),
          C: extraRepair(hit.options?.C),
          D: extraRepair(hit.options?.D),
        },
      })
      continue
    }
    out.push({
      n,
      question: `প্রশ্ন ${n} সোর্স PDF টেক্সটে পাওয়া যায়নি (CID ফাঁক, ${year})। উদ্ভাবন করা হয়নি।`,
      options: { A: '—', B: '—', C: '—', D: '—' },
      correctKey: '',
      flags: ['not_in_source_pdf', 'key_unreadable', 'coaching_compiled_pdf', 'cid_font_repair', 'not_official_gazette'],
    })
  }
  return out
}

function barMcqAssets(year, items, extraFlags, sourceNote) {
  return items.map((it) =>
    mcqAsset({
      id: `BC-MCQ-US-${year}-${String(it.n).padStart(3, '0')}`,
      year: String(year),
      n: it.n,
      question: it.question || it.q,
      options: it.options || { A: it.A, B: it.B, C: it.C, D: it.D },
      correctKey: it.correctKey || it.k || '',
      cite: it.note || '',
      flags: [...(it.flags || it.f || []), ...extraFlags],
      packPrefix: 'BC',
      examBoard: 'Bangladesh Bar Council',
      sourceNote,
      titleBn: `বার কাউন্সিল MCQ ${year} — প্রশ্ন ${it.n}`,
      titleEn: `Bar Council MCQ ${year} — Q${it.n}`,
    }),
  )
}

const YEAR_BATCH = [
  ['2012', '048'],
  ['2013', '049'],
  ['2015', '050'],
  ['2020', '051'],
  ['2022', '052'],
  ['2023', '053'],
]

const pdfFlags = ['coaching_compiled_pdf', 'cid_font_repair', 'not_official_gazette', 'user-supplied']
const pdfNote =
  'সূত্র: ব্যবহারকারীর ইনবক্স Live MCQ PDF (CID টেক্সট)। ওয়েবসাইট স্ক্র্যাপ নয়। অফিসিয়াল গেজেট নয়। কোচিং ব্যাখ্যা কপি হয়নি।'

for (const [year, batch] of YEAR_BATCH) {
  const raw = JSON.parse(readFileSync(join(parsedDir, `${year}.json`), 'utf8'))
  const items = fillHundred(raw, year)
  const assets = barMcqAssets(year, items, pdfFlags, pdfNote)
  const pack = batchEnvelope({
    batchId: `BATCH-2026-09-${batch}-MCQ-${year}-USER-PDF`,
    purpose: `User-inbox Live MCQ PDF text for Bar Council MCQ ${year} Q1–100. AUTHENTIC_REPORTED_QUESTION. Keys from the PDF “সঠিক উত্তর” line where readable. CID font repaired; not official gazette; coaching explanations not copied.`,
    assets,
    extra: { exam_years: [year], exam_set: null, source_media: 'pdf' },
    source: 'user-supplied',
  })
  writeJson(join(outBar, `batch-2026-09-${batch}-mcq-${year}.json`), pack)
  copyPack(`bar_batch_${batch}.json`, pack)
  const keyed = assets.filter((a) => a.correct_answer).length
  console.log(`bar_batch_${batch} ${year} n=${assets.length} keyed=${keyed}`)
}

const nums2026 = MCQ2026.map((it) => it.n)
if (nums2026.length !== 100 || new Set(nums2026).size !== 100) {
  throw new Error(`2026 bank must be 100 unique numbers, got ${nums2026.length}/${new Set(nums2026).size}`)
}
const assets2026 = barMcqAssets(
  '2026',
  MCQ2026.map((it) => ({
    n: it.n,
    question: it.q,
    options: { A: it.A, B: it.B, C: it.C, D: it.D },
    correctKey: it.k,
    flags: it.f,
    note: it.note,
  })),
  [],
  'সূত্র: ব্যবহারকারীর ছবি OCR (জুন ২০২৬, ক সেট)। সবুজ হাইলাইট = প্রার্থী চাবি, অফিসিয়াল গেজেট নয়। সংঘাত থাকলে চাবি রাখা, পতাকা দেওয়া।',
)
const pack047 = batchEnvelope({
  batchId: 'BATCH-2026-09-047-MCQ-2026-SET-KA',
  purpose:
    'User photos: Bangladesh Bar Council Advocate Enrolment MCQ June 2026, Set ক, 100 marks, 1 hour. Green highlighter = candidate keys. Gaps 45–49 and 61–64 not on the four photos. Statute conflicts flagged, keys not silently rewritten.',
  assets: assets2026,
  extra: {
    exam_years: ['2026'],
    exam_set: 'ক',
    exam_month: 'June 2026',
    source_media: 'user-photo-ocr',
  },
  source: 'user-photo-ocr',
})
writeJson(join(outBar, 'batch-2026-09-047-mcq-2026-set-ka.json'), pack047)
copyPack('bar_batch_047.json', pack047)
const keyed2026 = assets2026.filter((a) => a.correct_answer).length
const conflicts = assets2026.filter((a) => (a.flags || []).includes('answer_conflict')).length
console.log(`bar_batch_047 2026 n=${assets2026.length} keyed=${keyed2026} conflicts=${conflicts}`)

const writtenPath = join(outMobile, 'bjs_written_user_v1.json')
const written = JSON.parse(readFileSync(writtenPath, 'utf8'))
const existingIds = new Set(written.assets.map((a) => a.content_id))
const extraAssets = BJS_2021_EXTRA.map((q) =>
  writtenAsset({
    id: q.id,
    year: '2021',
    sitting: 14,
    n: q.n,
    group: q.group || '',
    promptBn: q.bn,
    promptEn: q.en || q.bn,
    marks: q.marks,
    paper: q.paper,
    flags: ['ocr_unverified', 'user-supplied', 'user-pdf-photo', ...(q.flags || [])],
    examBoard: 'BJSC',
    source: 'user-photo-ocr',
  }),
).filter((a) => !existingIds.has(a.content_id))
written.assets.push(...extraAssets)
written.asset_count = written.assets.length
written.content_version = '2026.09.17'
written.batch_purpose =
  'User-supplied BJS written: 2025 (18th) non-law in Word; 2024 (17th) photos; 2021 (14th) family + remaining booklet pages from 13th BJS Exam 2021 Written Question.pdf scans (header ১৪শ বিজেএস ২০২১). Law papers 2025 still absent from disk. No model answers invented.'
for (const a of written.assets) {
  const bn = a.language_versions?.bn
  if (!bn) continue
  if (!bn.prep_outline || !bn.prep_outline.length) {
    bn.prep_outline = citedIssuesFromPrompt(bn.question)
  }
  if (
    Array.isArray(bn.answer_outline) &&
    bn.answer_outline[0] === 'প্রশ্নে যা চাওয়া হয়েছে তাই লিখুন।'
  ) {
    bn.answer_outline = citedIssuesFromPrompt(bn.question)
  }
}
copyPack('bjs_written_user_v1.json', written)
console.log(`bjs_written extra +${extraAssets.length} total=${written.asset_count}`)

function patchWrittenPack(name) {
  const p = join(outMobile, name)
  let data
  try {
    data = JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return
  }
  let n = 0
  for (const a of data.assets || []) {
    if (a.asset_type !== 'WRITTEN_QUESTION') continue
    const bn = a.language_versions?.bn
    if (!bn) continue
    const q = bn.question || ''
    if (!bn.prep_outline || !bn.prep_outline.length) {
      bn.prep_outline = citedIssuesFromPrompt(q)
      n++
    }
    if (
      Array.isArray(bn.answer_outline) &&
      bn.answer_outline[0] === 'প্রশ্নে যা চাওয়া হয়েছে তাই লিখুন।'
    ) {
      bn.answer_outline = citedIssuesFromPrompt(q)
      n++
    }
  }
  if (n) copyPack(name, data)
  console.log(`prep_outline ${name} patched≈${n}`)
}

for (const name of [
  'bar_batch_046.json',
  'hc_written_2023.json',
  'hc_written_2016_2017.json',
  'hc_user_written_2024_2025.json',
]) {
  patchWrittenPack(name)
}
