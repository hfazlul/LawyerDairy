/**
 * Ingest 16 Sep 2026 user Word + 2021 PDF photos into career packs.
 * Live MCQ App PDFs in _inbox/user-pdfs are recorded as found, not decoded/copied.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { batchEnvelope, mcqAsset, writtenAsset } from './career-pack-helpers.mjs'
import { BAR_2026, HC_2023, BJS_2025, BJS_2024, BJS_2021 } from './user-2026-09-16-written-data.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const outMobile = join(repo, 'mobile', 'assets', 'career')
const outBar = join(repo, 'Barcouncil assets', 'batches')
const outWeb = join(repo, 'webapp', 'data', 'career', 'packs')
const inbox = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'user-2026-09-16-docx')

function writeJson(abs, obj) {
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, `${JSON.stringify(obj, null, 2)}\n`, 'utf8')
}

function copyPack(name, obj) {
  writeJson(join(outMobile, name), obj)
  writeJson(join(outWeb, name), obj)
}

function mapWritten({ id, year, sitting, examBoard, source, extraFlags = [] }, q) {
  return writtenAsset({
    id,
    year,
    sitting,
    n: q.n,
    group: q.group || '',
    promptBn: q.bn,
    promptEn: q.bn,
    marks: q.marks,
    paper: q.paper || '',
    flags: ['ocr_unverified', 'user-supplied', ...extraFlags, ...(q.flags || [])],
    examBoard,
    source,
  })
}

const parsed = JSON.parse(readFileSync(join(inbox, 'bjs-mcq-parsed.json'), 'utf8'))

const mcqLow = []
const mcqHigh = []
for (const paper of parsed.papers) {
  for (const item of paper.items) {
    const yearKey = paper.year || `S${paper.sitting}`
    const id = `BJS-MCQ-US-${yearKey}-${String(item.n).padStart(3, '0')}`
    const flags = [...(item.flags || [])]
    if (!paper.year) flags.push('header_year_missing')
    if (paper.items.length < 90) flags.push('source_incomplete_not_100')
    const asset = mcqAsset({
      id,
      year: paper.year,
      sitting: paper.sitting,
      n: item.n,
      question: item.question,
      options: item.options,
      correctKey: item.correctKey,
      cite: item.cite,
      flags,
    })
    if (paper.sitting <= 10) mcqLow.push(asset)
    else mcqHigh.push(asset)
  }
}

copyPack(
  'bjs_mcq_03_10.json',
  batchEnvelope({
    batchId: 'BATCH-2026-09-BJS-MCQ-03-10-DOCX',
    purpose:
      'User Word dump: BJS prelim 3rd–10th (2007–2016 as headed). AUTHENTIC_REPORTED_QUESTION. Older sittings are incomplete in the source file — not padded. No Ain Prokash HTML.',
    assets: mcqLow,
    extra: { exam_sittings: [3, 4, 5, 6, 7, 8, 9, 10], source_file: 'New Microsoft Word Document.docx' },
  }),
)
copyPack(
  'bjs_mcq_11_16.json',
  batchEnvelope({
    batchId: 'BATCH-2026-09-BJS-MCQ-11-16-DOCX',
    purpose:
      'User Word dump: BJS prelim 11th–16th (2017–2023 as headed; 12th header has no calendar year). AUTHENTIC_REPORTED_QUESTION. Missing numbers/keys flagged, not invented.',
    assets: mcqHigh,
    extra: { exam_sittings: [11, 12, 13, 14, 15, 16], source_file: 'New Microsoft Word Document.docx' },
  }),
)

const bar2026 = BAR_2026.items.map((q) =>
  mapWritten(
    {
      id: `BC-WQ-US-2026-${String(q.n).padStart(2, '0')}`,
      year: '2026',
      examBoard: 'Bangladesh Bar Council',
      source: 'docx',
      extraFlags: ['exam_date_2026-08-22'],
    },
    { ...q, paper: q.paper || 'এনরোলমেন্ট লিখিত · ২২ আগস্ট ২০২৬' },
  ),
)
const bar046 = batchEnvelope({
  batchId: 'BATCH-2026-09-046-WRITTEN-2026-DOCX',
  purpose:
    'User Word photos: Bar Council enrolment written 2026. Header on the paper: ২২ আগস্ট ২০২৬ শনিবার, পূর্ণমান ১০০, ৪ ঘণ্টা. OCR flagged. No model answers invented.',
  assets: bar2026,
  extra: { exam_years: ['2026'], exam_date: '2026-08-22' },
  source: 'docx',
})
writeJson(join(outBar, 'batch-2026-09-046-written-2026-user.json'), bar046)
copyPack('bar_batch_046.json', bar046)

const hc2023 = HC_2023.items.map((q) => {
  const a = mapWritten(
    {
      id: `HC-WQ-US-2023-${String(q.n).padStart(2, '0')}`,
      year: '2023',
      examBoard: 'Bangladesh Bar Council',
      source: 'docx',
      extraFlags: ['reproduction_prohibited_not_official_download'],
    },
    { ...q, paper: q.paper || 'HC Permission written · 04 March 2023' },
  )
  a.exam_date = '4 March 2023'
  a.section_id = 'SEC-PREVQ'
  return a
})
copyPack(
  'hc_written_2023.json',
  batchEnvelope({
    batchId: 'BATCH-2026-09-HC-WRITTEN-2023-DOCX',
    purpose:
      'User Word photos: HC Permission written 2023 (header Date: 04 March, 2023; Full Marks 25; 3 Hours; Groups A/B/C). Cover page not in the photos (starts page 2). No HC MCQ invented. No model answers.',
    assets: hc2023,
    extra: { exam_years: ['2023'], exam_date: '2023-03-04', hc_mcq_invented: false },
    source: 'docx',
  }),
)

const bjsWq = [
  ...BJS_2025.items.map((q) =>
    mapWritten(
      {
        id: `BJS-WQ-US-2025-${String(q.n).padStart(2, '0')}`,
        year: '2025',
        sitting: 18,
        examBoard: 'BJSC',
        source: 'user-supplied',
        extraFlags: ['docx', 'law_papers_not_in_this_file'],
      },
      q,
    ),
  ),
  ...BJS_2024.items.map((q) =>
    mapWritten(
      {
        id: `BJS-WQ-US-2024-${String(q.n).padStart(2, '0')}`,
        year: '2024',
        sitting: 17,
        examBoard: 'BJSC',
        source: 'docx',
        extraFlags: ['docx'],
      },
      q,
    ),
  ),
  ...BJS_2021.items.map((q) =>
    mapWritten(
      {
        id: `BJS-WQ-US-2021-${String(q.n).padStart(2, '0')}`,
        year: '2021',
        sitting: 14,
        examBoard: 'BJSC',
        source: 'user-supplied',
        extraFlags: ['pdf-scan', 'filename_said_13th_header_is_14th'],
      },
      q,
    ),
  ),
]

copyPack(
  'bjs_written_user_v1.json',
  batchEnvelope({
    batchId: 'BATCH-2026-09-BJS-WRITTEN-2021-2024-2025',
    purpose:
      'User-supplied BJS written: 2025 (18th) typed in Word (Bangla/English/Affairs/Math only — law papers not in that slice); 2024 (17th) photos in the Word file; 2021 (14th) from user PDF scans labelled 13th BJS Exam 2021 Written Question.pdf but header on pages is ১৪শ বিজেএস ২০২১. No model answers.',
    assets: bjsWq,
    extra: {
      exam_years: ['2021', '2024', '2025'],
      sittings: [14, 17, 18],
      bjs_2025_law_papers_in_docx: false,
      bjs_2021_booklet_pages_ingested: 'family_q1_8_full_other_papers_pending_page_ocr',
    },
  }),
)

const report = {
  bjsMcq: parsed.report,
  bjsMcqTotal: mcqLow.length + mcqHigh.length,
  bjsMcqLow: mcqLow.length,
  bjsMcqHigh: mcqHigh.length,
  bjsWritten2025: BJS_2025.items.length,
  bjsWritten2024: BJS_2024.items.length,
  bjsWritten2021: BJS_2021.items.length,
  bar2026: bar2026.length,
  hc2023: hc2023.length,
  liveMcqPdfsFoundNotIngested: ['2012', '2013', '2015', '2020', '2022', '2023'],
}
writeJson(join(inbox, '_ingest-report-2026-09-16.json'), report)
console.log(JSON.stringify(report, null, 2))
