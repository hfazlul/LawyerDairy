/**
 * Ingest user-supplied Bar Council papers from docs/plan/mobile-v3/_inbox
 * into career JSON (MCQ tap player + written cards). Not a PDF viewer.
 *
 * Source: user-supplied. Origin: AUTHENTIC_REPORTED_QUESTION.
 * Does not scrape Ain Prokash / Live MCQ / QuesBankBD.
 * Does not invent model answers or missing pages.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const inbox = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox')
const outBar = join(repo, 'Barcouncil assets', 'batches')
const outMobile = join(repo, 'mobile', 'assets', 'career')

const BN = '০১২৩৪৫৬৭৮৯'
const KEY = { ক: 'A', খ: 'B', গ: 'C', ঘ: 'D' }

function bnInt(s) {
  const n = [...String(s)]
    .map((c) => {
      const i = BN.indexOf(c)
      return i >= 0 ? String(i) : c
    })
    .join('')
    .replace(/\D/g, '')
  return parseInt(n, 10)
}

function stripInboxHeader(md) {
  const idx = md.search(/\n---\r?\n/)
  if (idx < 0) return md
  return md.slice(idx).replace(/^\n---\r?\n/, '')
}

function guessSubject(text) {
  const t = text
  if (/সাক্ষ্য আইন|Evidence Act|প্রাথমিক সাক্ষ্য|এস্টোপেল/.test(t)) {
    return { module: 'BC-MOD-EVIDENCE', topic: 'T-EVID-01' }
  }
  if (/তামাদি|Limitation Act|সুখাধিকার/.test(t)) {
    return { module: 'BC-MOD-LIMITATION', topic: 'T-LIM-01' }
  }
  if (/সুনির্দিষ্ট প্রতিকার|Specific Relief/.test(t)) {
    return { module: 'BC-MOD-SRA', topic: 'T-SRA-01' }
  }
  if (/দণ্ডবিধি|দন্ডবিধি|Penal Code/.test(t)) {
    return { module: 'BC-MOD-PENAL', topic: 'T-PENAL-01' }
  }
  if (/ফৌজদার|Criminal Procedure|CrPC|জামিন|FIR|৫৬১/.test(t)) {
    return { module: 'BC-MOD-CRPC', topic: 'T-CRPC-01' }
  }
  if (/বার কাউন্সিল|এডভোকেট|Canons|BBC |আইন শিক্ষা কমিটি/.test(t)) {
    return { module: 'BC-MOD-ETHICS', topic: 'T-ETH-01' }
  }
  if (/দেওয়ানী কার্যবিধি|দেওয়ানি কার্যবিধি|Civil Procedure|CPC |আদেশ \d/.test(t)) {
    return { module: 'BC-MOD-CPC', topic: 'T-CPC-01' }
  }
  return { module: 'BC-MOD-CPC', topic: 'T-CPC-01' }
}

function parseOptions(raw) {
  const parts = raw.split(/\(([কখগঘ])\)/)
  if (parts.length < 9) return { question: raw.trim(), options: null }
  const question = parts[0].replace(/\s+/g, ' ').trim()
  const options = {}
  const keys = ['A', 'B', 'C', 'D']
  let ki = 0
  const labels = []
  for (let i = 1; i < parts.length && ki < 4; i += 2) {
    labels.push(parts[i])
    options[keys[ki]] = String(parts[i + 1] || '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[।.\s]+$/, '')
    ki += 1
  }
  if (!options.A || !options.B || !options.C || !options.D) {
    return { question, options: null }
  }
  return { question, options, messy: labels.join('') !== 'কখগঘ' }
}

function splitMcqBlock(block) {
  const m =
    block.match(/সঠিক উত্তরঃ?\s*([^\n]*?)\(([কখগঘ])\)\s*([\s\S]*)$/) ||
    block.match(/উত্তরঃ?-?\s*([^\n]*?)\(([কখগঘ])\)\s*([\s\S]*)$/) ||
    block.match(/উত্তর:-?\s*([^\n]*?)\(([কখগঘ])\)\s*([\s\S]*)$/)
  if (!m) return null
  const correctBn = m[2]
  const cite = `${m[1] || ''} ${m[3] || ''}`
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[।.\s]+/, '')
    .replace(/[।.\s]+$/, '')
  const stem = block.slice(0, m.index).trim()
  return { stem, correctKey: KEY[correctBn], cite }
}

function parseMcqFile(md, year) {
  const content = stripInboxHeader(md)
  const re = /(?:^|\n)[\(]?([০-৯]{2,3})(?:[\)।.]|\s)+/g
  const hits = []
  let m
  while ((m = re.exec(content))) {
    const n = bnInt(m[1])
    if (n < 1 || n > 100) continue
    hits.push({ n, start: m.index + (m[0][0] === '\n' ? 1 : 0), endPrefix: m.index + m[0].length })
  }
  const items = []
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].endPrefix
    const end = i + 1 < hits.length ? hits[i + 1].start : content.length
    const n = hits[i].n
    const block = content.slice(start, end).trim()
    const split = splitMcqBlock(block)
    if (!split) {
      items.push({ n, error: 'no_answer', raw: block.slice(0, 80) })
      continue
    }
    const parsed = parseOptions(split.stem)
    if (!parsed.options) {
      items.push({ n, error: 'no_options', raw: split.stem.slice(0, 80) })
      continue
    }
    items.push({
      n,
      question: parsed.question,
      options: parsed.options,
      correctKey: split.correctKey,
      cite: split.cite,
      messyOptions: !!parsed.messy,
    })
  }
  return items
}

function parseWrittenFile(md, year) {
  const content = stripInboxHeader(md)
  const re = /(?:^|\n)([১২৩৪৫৬৭৮৯]|১[০-৯])[।.]\s+/g
  const hits = []
  let m
  while ((m = re.exec(content))) {
    const n = bnInt(m[1])
    if (n < 1 || n > 20) continue
    hits.push({ n, start: m.index + (m[0][0] === '\n' ? 1 : 0), endPrefix: m.index + m[0].length })
  }
  const groups = []
  const groupRe =
    /\(([কখগঘঙচ])\s*অংশ[^)]*\)[^\n]*|\b([কখগঘঙচ])\s*অংশ[^\n]*/g
  let gm
  while ((gm = groupRe.exec(content))) {
    const label = gm[1] || gm[2]
    groups.push({ label, at: gm.index })
  }
  function groupAt(pos) {
    let g = ''
    for (const row of groups) {
      if (row.at <= pos) g = row.label
    }
    return g
  }
  const items = []
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].endPrefix
    const end = i + 1 < hits.length ? hits[i + 1].start : content.length
    const prompt = content.slice(start, end).trim()
    if (prompt.length < 12) continue
    items.push({
      n: hits[i].n,
      group: groupAt(hits[i].start),
      prompt,
    })
  }
  return items
}

/** Hardcoded Bare Act checks (bdlaws). Keep user key; only flag. */
const CONFLICTS = {
  '2017-10': {
    flag: 'answer_conflict',
    note:
      'Limitation Act 1908 legal-disability cluster is ss.6–8 (s.6 disability, s.7 one of several, s.8 special exceptions). s.9 is continuous running of time, not disability. User key (ক) 6,7 omits s.8; option (ঘ) 6,7,8 is closer. User key kept. Source: bdlaws act-88.',
  },
  '2017-11': {
    flag: 'answer_conflict',
    note:
      'Limitation Act 1908 s.23 (bdlaws act-88/section-25835): a continuing breach gives a fresh period of limitation at every moment. User key (ক) “মেয়াদ অপরিবর্তিত” kept; statute matches option (গ).',
  },
  '2017-18': {
    flag: 'answer_conflict',
    note:
      'Easements Act 1882 s.15 (bdlaws act-49): 20 years generally; “sixty years” only when the servient property belongs to the Government. Question is non-government, so 20 years (খ), not 60 (ক). User key kept.',
  },
  '2017-22': {
    flag: 'answer_conflict',
    note:
      'SRA 1877 s.5 lists five modes of specific relief; only clause (c) is preventive. s.6 names that clause “preventive relief”. User key (গ) “৫টি” counts all modes, not নিষেধাত্মক. User key kept. Source: bdlaws act-36.',
  },
  '2017-31': {
    flag: 'answer_conflict',
    note:
      'CPC 1908 s.54 is partition of estate / separation of share by the Collector, not perpetual injunction (that is SRA s.54). User key (গ) kept. Source: bdlaws act-details-86.',
  },
  '2017-35': {
    flag: 'answer_conflict',
    note:
      'Representative suit is Order I Rule 8 CPC. Order II Rule 5 is claims by/against executor, administrator or heir. User key (ক) O.2 R.5 kept. Source: CPC First Schedule index, bdlaws.',
  },
  '2017-36': {
    flag: 'bd_schedule_confirmed',
    note:
      'BD CPC First Schedule (bdlaws PDF 2025-06-15) lists Order IX r.13 “Setting aside decree ex parte” and r.13A “Directly setting aside ex parte decree”. Question asks সরাসরি বাতিল; user key (গ) 13ক matches the BD schedule. Not treated as a key conflict.',
  },
  '2017-59': {
    flag: 'answer_conflict',
    note:
      'Penal Code s.303 (murder by a life-convict) is death as the only punishment. s.302 is death or imprisonment for life. s.304 is culpable homicide not amounting to murder (not death-only). User key (ঘ) s.304 kept; statute points to (গ) s.303.',
  },
  '2017-65': {
    flag: 'answer_conflict',
    note:
      'Penal Code s.54: Government may commute a sentence of death. s.55 commutes imprisonment for life. User key (ঘ) s.55 kept; statute points to (ক) s.54.',
  },
  '2017-76': {
    flag: 'answer_conflict',
    note:
      'CPC s.114 is review. Remand / retrial on appeal is Order XLI Rule 23 (asked correctly in Q77). User key (ক) s.114 kept.',
  },
  '2017-97': {
    flag: 'answer_conflict',
    note:
      'Reduction of an excessive bail-bond amount is CrPC s.440. Options ক and খ are both s.498 (High Court/Sessions power to grant bail). User key (ক) 498 kept.',
  },
  '2025-53': {
    flag: 'messy_options',
    note:
      '2025 Q53 options গ/ঘ both print s.530 on the paste. User key B (s.529) kept. Not treated as a key conflict.',
  },
}

function citedSectionMismatch(item, year) {
  const cite = item.cite || ''
  const opt = item.options[item.correctKey] || ''
  const q = item.question || ''
  const flags = []
  const key = `${year}-${item.n}`
  if (CONFLICTS[key]) {
    flags.push({ flag: CONFLICTS[key].flag || 'answer_conflict', note: CONFLICTS[key].note })
  }
  const citeNums = [...cite.matchAll(/(?:সেকশন|ধারা|অনু|article|s\.|sec\.?)\s*([০-৯0-9]+[A-ক-ঘক]?)/gi)].map((x) =>
    x[1],
  )
  const optNums = [...opt.matchAll(/([০-৯0-9]+)/g)].map((x) => x[1])
  if (citeNums.length && optNums.length) {
    const citeN = bnInt(citeNums[0]) || parseInt(String(citeNums[0]).replace(/\D/g, ''), 10)
    const optHas = optNums.some((n) => (bnInt(n) || parseInt(n, 10)) === citeN)
    if (!optHas && /ধারা|সেকশন/.test(opt) && Number.isFinite(citeN)) {
      flags.push({
        flag: 'answer_conflict',
        note: `Answer cite names section ${citeNums[0]} but chosen option text is “${opt}”. User key kept.`,
      })
    }
  }
  if (/ধারা\s*১১৪\(E\)/.test(cite) && year === '2025' && item.n === 2 && item.correctKey === 'A') {
    /* Evidence s.114(e) — matches option ১১৪ */
  }
  void q
  const seen = new Set()
  return flags.filter((f) => {
    const k = f.flag + f.note
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function locPair(bn, extra = {}) {
  return {
    bn: { ...bn, ...extra },
    en: {
      ...bn,
      ...extra,
      title: extra.titleEn || bn.title,
    },
  }
}

function mcqAsset(year, item, flags) {
  const id = `BC-MCQ-US-${year}-${String(item.n).padStart(3, '0')}`
  const sub = guessSubject(`${item.question} ${item.cite}`)
  const allFlags = [...flags]
  if (item.messyOptions) {
    allFlags.push({
      flag: 'messy_option_labels',
      note: 'Option labels in the paste are duplicated or out of ক-খ-গ-ঘ order. Mapped in print order A–D. User key kept.',
    })
  }
  const flagNotes = allFlags.map((f) => `${f.flag}: ${f.note}`).join(' ')
  const explanation = [
    item.cite ? `ব্যবহারকারীর চাবি: ${item.correctKey}. ${item.cite}` : `ব্যবহারকারীর চাবি: ${item.correctKey}.`,
    'সূত্র: user-supplied। অফিসিয়াল বার কাউন্সিল PDF নয়।',
    flagNotes,
  ]
    .filter(Boolean)
    .join('\n')
  const title = `বার কাউন্সিল MCQ ${year} — প্রশ্ন ${item.n}`
  return {
    content_id: id,
    question_id: id,
    asset_type: 'MCQ',
    question_type: 'MCQ',
    question_origin: 'AUTHENTIC_REPORTED_QUESTION',
    question_category_authenticity: 'AUTHENTIC_REPORTED_QUESTION',
    content_source: 'user-supplied',
    exam_year: String(year),
    paper_year: String(year),
    exam_stage: 'MCQ',
    subject_module_id: sub.module,
    topic_id: sub.topic,
    version: 1,
    status: 'PENDING_REVIEW',
    verification_status: 'NOT_VERIFIED',
    correct_answer: item.correctKey,
    flags: allFlags.map((f) => f.flag),
    flag_note: flagNotes || null,
    language_versions: {
      bn: {
        title,
        question: item.question,
        options: item.options,
        explanation,
      },
      en: {
        title: `Bar Council MCQ ${year} — Q${item.n}`,
        question: item.question,
        options: item.options,
        explanation,
      },
    },
  }
}

function writtenAsset(year, item, extraFlags = []) {
  const id = `BC-WQ-US-${year}-${String(item.n).padStart(2, '0')}`
  const sub = guessSubject(item.prompt)
  const flags = [...extraFlags]
  if (year === '2014') {
    flags.push({
      flag: 'messy_group_labels',
      note: '2014 group headers in the user paste look mis-aligned with the questions. Kept verbatim.',
    })
  }
  const title = `বার কাউন্সিল লিখিত ${year} — প্রশ্ন ${item.n}${item.group ? ` (${item.group} অংশ)` : ''}`
  const prompt = item.prompt
  return {
    content_id: id,
    written_question_id: id,
    asset_type: 'WRITTEN_QUESTION',
    question_origin: 'AUTHENTIC_REPORTED_QUESTION',
    question_category_authenticity: 'AUTHENTIC_REPORTED_QUESTION',
    content_source: 'user-supplied',
    exam_year: String(year),
    paper_year: String(year),
    exam_stage: 'WRITTEN',
    subject_module_id: sub.module,
    topic_id: sub.topic,
    group_label: item.group || null,
    version: 1,
    status: 'PENDING_REVIEW',
    verification_status: extraFlags.some((f) => f.flag === 'ocr_unverified') ? 'NOT_VERIFIED' : 'NOT_VERIFIED',
    answer_type: 'NONE',
    flags: flags.map((f) => f.flag),
    flag_note: flags.map((f) => f.note).join(' ') || null,
    language_versions: {
      bn: {
        title,
        question: prompt,
        answer_outline: [
          'প্রশ্নে যা চাওয়া হয়েছে তাই লিখুন।',
          'সংশ্লিষ্ট ধারা/আদেশ উল্লেখ করুন।',
          'মডেল উত্তর ব্যবহারকারী দেননি — অ্যাপে উদ্ভাবন করা হয়নি।',
        ],
        marking_points: [
          'প্রশ্নের সব অংশ উত্তর দিয়েছি',
          'সংশ্লিষ্ট আইন/ধারা উল্লেখ করেছি',
          'প্রার্থনা/খসড়া চাইলে কাঠামো মেনেছি',
        ],
        model_answer: '',
      },
      en: {
        title: `Bar Council written ${year} — Q${item.n}`,
        question: prompt,
        answer_outline: [
          'Answer only what the paper asks.',
          'Cite the relevant section/order.',
          'No model answer was supplied — none invented.',
        ],
        marking_points: [
          'Answered every part',
          'Cited the relevant law',
          'Used a drafting structure if a petition was asked',
        ],
        model_answer: '',
      },
    },
  }
}

function parseHcWrittenMd(md, year) {
  const date = (md.match(/^Date:\s*(.+)$/m) || [])[1]?.trim() || ''
  const re =
    /###\s*(\d+)\s*\|\s*([ABC])\s*\|\s*([A-Z]+)\s*\|\s*(\d+)(?:\s*\|\s*(OR))?[\r\n]+([\s\S]*?)(?=\n###\s*\d+\s*\||$)/g
  const items = []
  let m
  while ((m = re.exec(md))) {
    items.push({
      n: parseInt(m[1], 10),
      group: m[2],
      groupName: m[3],
      marks: parseInt(m[4], 10),
      isOr: m[5] === 'OR',
      prompt: m[6].trim(),
      examDate: date,
      year: String(year),
    })
  }
  return { date, items }
}

function hcUserWrittenAsset(item) {
  const year = item.year
  const id = `HC-WQ-US-${year}-${String(item.n).padStart(2, '0')}`
  const orBn = item.isOr ? ' OR' : ''
  const title = `HC পারমিশন লিখিত ${year} — প্রশ্ন ${item.n} (Group ${item.group} ${item.groupName}${orBn}) · ${item.marks}`
  const banner =
    `সূত্র: ব্যবহারকারী সরবরাহকৃত ছবি। অফিসিয়াল বার কাউন্সিল ডাউনলোড নয়। পুনর্মুদ্রণ নিষিদ্ধ (পেপার ফুটার)। মডেল উত্তর নেই।\nপরীক্ষা: ${item.examDate}। Group ${item.group} (${item.groupName}) · ${item.marks} নম্বর${item.isOr ? ' · OR' : ''}।\n\n`
  return {
    content_id: id,
    written_question_id: id,
    asset_type: 'WRITTEN_QUESTION',
    section_id: 'SEC-PREVQ',
    module_id: 'SEC-PREVQ',
    topic_id: id,
    order: 100 + (year === '2024' ? 0 : 10) + item.n,
    question_origin: 'AUTHENTIC_REPORTED_QUESTION',
    question_category_authenticity: 'AUTHENTIC_REPORTED_QUESTION',
    content_source: 'user-supplied',
    exam_year: String(year),
    paper_year: String(year),
    exam_date: item.examDate,
    exam_stage: 'WRITTEN',
    exam_board: 'Bangladesh Bar Council',
    group_label: item.group,
    marks: item.marks,
    version: 1,
    status: 'PENDING_REVIEW',
    verification_status: 'NOT_VERIFIED',
    answer_type: 'NONE',
    flags: ['user_photo_ocr', 'reproduction_prohibited_not_official_download'],
    flag_note:
      'User-supplied photo of the printed paper (Bar Council header + date + Group A/B/C). Reproduction without permission is prohibited. Not shipped as an official download. No model answer invented.',
    language_versions: {
      bn: {
        title,
        question: `${banner}${item.prompt}`,
        answer_outline: [
          'প্রশ্নে যা চাওয়া হয়েছে তাই খসড়া করুন (brief / petition / next course)।',
          'সংশ্লিষ্ট ধারা/আদেশ ও ফোরাম উল্লেখ করুন।',
          'মডেল উত্তর ব্যবহারকারী দেননি — অ্যাপে উদ্ভাবন করা হয়নি।',
        ],
        marking_points: [
          'সঠিক ফোরাম ও প্রতিকার বেছেছি',
          'ঘটনা কালানুক্রমে সাজিয়েছি',
          'গ্রাউন্ডস ও প্রার্থনা আলাদা করেছি',
        ],
        model_answer: '',
      },
      en: {
        title: `HC Permission written ${year} — Q${item.n} (Group ${item.group}${orBn})`,
        question: `${banner}${item.prompt}`,
        answer_outline: [
          'Draft only what the paper asks (brief / petition / next course).',
          'Cite the forum and the relevant section/order.',
          'No model answer was supplied — none invented.',
        ],
        marking_points: [
          'Chose the correct forum and remedy',
          'Set out facts in order',
          'Separated grounds and prayer',
        ],
        model_answer: '',
      },
    },
  }
}

const OCR_2025 = {
  header: {
    board: 'বাংলাদেশ বার কাউন্সিল',
    title: 'অ্যাডভোকেট তালিকাভুক্তির লিখিত পরীক্ষা, ২০২৫',
    date: '২৮ জুন ২০২৫, শনিবার',
    marks: 'পূর্ণমান—১০০',
    time: 'সময়—৪ ঘণ্টা',
    instruction:
      "('ক' অংশ থেকে ২টি এবং 'খ', 'গ', 'ঘ', 'ঙ', 'চ' অংশের প্রত্যেকটি থেকে ১টি করে মোট ৭টি প্রশ্নের উত্তর দিতে হবে)",
  },
  questions: [
    {
      n: 1,
      group: 'ক',
      prompt:
        'ক) The Code of Civil Procedure, 1908 এর Order-1, Rule-10 এর আলোকে মোকদ্দমার যেকোনো পর্যায়ে আদালত কর্তৃক পক্ষসমূহকে কর্তন বা সংযোজন করার বিধান আলোচনা করুন। [≈১০]\n\nখ) বাদী স্বত্ব ঘোষণার দাবীতে দেওয়ানী ৬৫/২০২৪ নং মোকদ্দমা দায়ের করেন যা উভয় বিবাদীর বিরুদ্ধে একতরফা ডিক্রি প্রদানে নিষ্পত্তি হয়। এক্ষেত্রে ক্ষতিগ্রস্ত বিবাদীদের প্রতিকারসমূহ কী? [≈৫]',
    },
    {
      n: 2,
      group: 'ক',
      prompt:
        'ক) কোন কোন বিষয়সমূহ অন্তর্ভুক্ত করে আরজি মুসাবিদা করতে হবে তা The Code of Civil Procedure, 1908 এর Order-7 এর প্রাসঙ্গিক বিধানাবলী উল্লেখ্য বর্ণনা করুন। [≈১০]\n\nখ) মামলা দায়েরের পরবর্তী ঘটনাপ্রবাহ আরজিতে বাদীর দাবিকৃত সম্পূর্ণ প্রতিকারকে প্রভাবিত করতে পারে কি না তা সংক্ষেপে আলোচনা করুন। [≈৫]',
    },
    {
      n: 3,
      group: 'ক',
      prompt:
        'ক) "ঘোষণামূলক ডিক্রি প্রদান আদালতের বিবেচনামূলক ক্ষমতা" — আলোচনা করুন। ঘোষণামূলক ডিক্রির ফলাফল কী? [≈৮]\n\nখ) The Specific Relief Act, 1877-এর অধীনে নিরোধমূলক প্রতিকার প্রদানের পদ্ধতিসমূহ কী? Y, একজন সেবিকা Z এর মালিকানাধীন ক্লিনিকে ৩ বছরের জন্য সেবা প্রদান করবে মর্মে চুক্তিবদ্ধ হয়। ১ বছর পর Y এই চাকরী ছেড়ে Z এর প্রতিদ্বন্দ্বী ক্লিনিকে যোগদান করে। এক্ষেত্রে The Specific Relief Act, 1877 এর অধীনে Z এর প্রতিকার কী? [≈৪+৩=৭]',
    },
    {
      n: 4,
      group: 'খ',
      prompt:
        'ক) FIR, GD Entry এবং UD মামলার মধ্যে পার্থক্য নিরুপন করুন। কখন একটি UD মামলা FIR এ রূপান্তরিত হয়? [≈৫]\n\nখ) P এর মৃতদেহ তার পঞ্চনককে গাছের ডালে [OCR_UNCERTAIN] P এর কয়েকজন আত্মীয় FIR দায়ের করে সে উল্লেখ করে যে P কে কয়েকজন অজ্ঞাত দুষ্কৃতিকারী জানালার বাইরে থেকে লোহার রড দিয়ে আঘাত করে হত্যা করেছে। পুলিশ তদন্তকালে উদঘাটন করে যে P এর আত্মীয়রাই তাকে হত্যা করেছে। পুলিশ পৃথক FIR দায়ের করে। এমতাবস্থায় ২য় FIR টি নতুন FIR নাকি The Code of Criminal Procedure, 1898 এর অধীনে ১৬১ ধারার জবানবন্দী হিসেবে বিবেচিত হবে সে মর্মে প্রাসঙ্গিক আইন উল্লেখ্য উত্তর দিন। [≈১০]',
    },
    {
      n: 5,
      group: 'খ',
      prompt:
        'ক) The Code of Criminal Procedure, 1898 এর অধীনে কখন কখন দণ্ডাদেশের বিরুদ্ধে আপিল চলে না? বর্ণনা করুন। [≈৫]\n\nখ) Y এর আয়কর পরিশোধের জন্য আয়কর আইনজীবী X টাকা গ্রহণ করেন। পরবর্তীতে X উক্ত টাকা আত্মসাৎ করে। Y দণ্ডবিধির ৪০৬/৪২০ ধারায় অভিযোগ এনে একটি নালিশী দরখাস্ত দায়ের করেন। The Code of Criminal Procedure, 1898 এর 241A ধারার অধীনে জনানীকালে অভিযুক্ত X নালিশকারীর আয়কর পরিশোধ সম্পন্ন হয়েছে মর্মে একটি অডিট রিপোর্ট দাখিল করে। এই রিপোর্ট পর্যালোচনা করে বিচারিক ম্যাজিস্ট্রেট অভিযুক্ত X কে অব্যাহতি প্রদান করেন। নালিশকারীর পক্ষে একটি রিভিশন দরখাস্ত প্রস্তুত করুন। [≈১০]',
    },
    {
      n: 6,
      group: 'গ',
      prompt:
        "ক) The Penal Code, 1860 অনুসারে 'মিথ্যা সাক্ষ্যদান' এবং 'মিথ্যা সাক্ষ্য সৃষ্টি করা' এর মধ্যে পার্থক্য লিখুন। [≈৫]\n\nখ) X তার প্রতিবেশী Y কে আঘাত করে এবং এতে Y [OCR_UNCERTAIN: বধ?] উদ্ভেজিত হয় এবং ক্রোধে উদ্দীপ্ত হয়ে যায়। Z একজন দর্শক হয়ে Y এর ক্রোধের সুবিধা গ্রহণ করে এবং তার মাধ্যমে X কে হত্যা করানোর উদ্দেশ্যে Y এর হাতে একটি পিস্তল [OCR_UNCERTAIN: পিস্তল/শস্ত্র] দেয়। Y উক্ত অস্ত্র দিয়ে গুলি করে X কে হত্যা করে। The Penal Code, 1860 এর সংশ্লিষ্ট বিধানাবলি আলোচনা করে Y ও Z এর দায় নিরুপন করুন। [≈৫]\n\nগ) A বিষ প্রয়োগ করে B কে হত্যা করার উদ্দেশ্যে বিষ ক্রয় করে এবং উহা খাবারে মিশ্রিত করে। পরবর্তীতে B এর টেবিল পরিবেশন করার জন্য A উক্ত খাবার B এর কর্মচারী C কে দেয়। B উক্ত খাবার খেয়ে অসুস্থ হয়ে পড়লেও তাৎক্ষণিক চিকিৎসা গ্রহণের কারণে তার মৃত্যু হয়নি। The Penal Code, 1860 এর সংশ্লিষ্ট বিধান অনুসারে A ও C এর দায় নির্ধারণ করুন। [≈৫]",
    },
    {
      n: 7,
      group: 'গ',
      prompt:
        'ক) নিম্নলিখিত যেকোনো ৪টি বিষয়ের উপর সংক্ষিপ্ত টিকা লিখুন— [৪×২.৫=১০]\nক) দুষ্কর্ম সহায়তা; খ) চোরাই মাল; গ) মিথ্যা পরিচয় দানের মাধ্যমে প্রতারণা; ঘ) অগ্নিসংযোগ; ঙ) মিথ্যা দলিল প্রণয়ন; চ) রাষ্ট্রদ্রোহিতা।',
    },
  ],
}

function batchEnvelope({ batchId, purpose, assets }) {
  return {
    batch_id: batchId,
    schema_version: '1.0',
    content_version: '2026.09.15',
    created_at: '2026-09-15T00:00:00Z',
    source: 'user-supplied',
    content_source: 'user-supplied',
    operation: 'CREATE',
    status: 'PENDING_REVIEW',
    batch_purpose: purpose,
    official_past_papers: 0,
    asset_count: assets.length,
    assets,
  }
}

function writeJson(abs, obj) {
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, `${JSON.stringify(obj, null, 2)}\n`, 'utf8')
}

const MODEL_BANNER =
  'মডেল অনুশীলন — বিগত সালের প্রশ্ন নয়। কোনো সালের HC পারমিশন পেপার নয়।'

function hcLesson({
  id,
  order,
  titleBn,
  titleEn,
  explanationBn,
  explanationEn,
  structure,
  grounds,
  prayer,
  traps,
  flags,
  sectionId = 'SEC-DRAFT',
  shortBn,
  shortEn,
}) {
  return {
    content_id: id,
    asset_type: 'LESSON',
    section_id: sectionId,
    module_id: sectionId === 'SEC-DRAFT' ? 'MOD-DRAFT' : sectionId,
    topic_id: id,
    order,
    status: 'PENDING_REVIEW',
    verification_status: 'VERIFY_CURRENT_RULE',
    question_origin: 'ORIGINAL_PRACTICE',
    content_source: 'user-supplied-syllabus-2026',
    flags: flags || [],
    language_versions: {
      bn: {
        title: titleBn,
        short_description: shortBn || 'হাইকোর্ট পারমিশন ড্রাফটিং সিলেবাস মডিউল — বিগত পেপার নয়।',
        learning_objective: 'কাঠামো, গ্রাউন্ডস ও প্রার্থনা আলাদা করে খসড়া করতে পারা।',
        explanation: explanationBn,
        structure,
        grounds,
        prayer,
        key_concepts: structure,
        important_rules: grounds,
        examples: prayer,
        common_traps: traps,
        exam_focus: 'ইন্টারঅ্যাকটিভ সিলেবাস কার্ড। কোনো নকল HC বিগত পেপার নয়।',
        key_takeaways: [
          'কাঠামো → গ্রাউন্ডস → প্রার্থনা।',
          'কোচিং সাইট ainprokash.com থেকে কিছু কপি করা হয়নি।',
        ],
      },
      en: {
        title: titleEn,
        short_description: shortEn || 'HC Permission drafting syllabus module — not a past paper.',
        learning_objective: 'Separate structure, grounds, and prayer when drafting.',
        explanation: explanationEn,
        structure,
        grounds,
        prayer,
        key_concepts: structure,
        important_rules: grounds,
        examples: prayer,
        common_traps: traps,
        exam_focus: 'Interactive syllabus card. Not a fake HC past paper.',
        key_takeaways: [
          'Structure → grounds → prayer.',
          'Nothing copied from ainprokash.com.',
        ],
      },
    },
  }
}

function hcWritten({ id, titleBn, promptBn, sectionId = 'SEC-DRAFT', order }) {
  const bannered = `${MODEL_BANNER}\n\n${promptBn}`
  return {
    content_id: id,
    asset_type: 'WRITTEN_QUESTION',
    section_id: sectionId,
    module_id: sectionId === 'SEC-DRAFT' ? 'MOD-DRAFT' : sectionId,
    order: order || 0,
    question_origin: 'ORIGINAL_PRACTICE',
    content_source: 'user-supplied-syllabus-2026',
    status: 'PENDING_REVIEW',
    verification_status: 'VERIFY_CURRENT_RULE',
    answer_type: 'NONE',
    flags: ['model_practice_not_past_paper'],
    language_versions: {
      bn: {
        title: titleBn,
        question: bannered,
        answer_outline: ['কাঠামো', 'গ্রাউন্ডস', 'প্রার্থনা'],
        marking_points: ['Cause title ঠিক', 'গ্রাউন্ডস আইনি পয়েন্ট', 'প্রার্থনা সুনির্দিষ্ট'],
        model_answer: '',
      },
      en: {
        title: titleBn,
        question: `MODEL PRACTICE — not a previous-year HC paper.\n\n${promptBn}`,
        answer_outline: ['Structure', 'Grounds', 'Prayer'],
        marking_points: ['Correct cause title', 'Legal grounds', 'Specific prayer'],
        model_answer: '',
      },
    },
  }
}

function hcViva({ id, order, qBn, qEn, pointsBn, pointsEn, followBn, followEn, sectionId = 'SEC-VIVA' }) {
  return {
    content_id: id,
    asset_type: 'VIVA_QUESTION',
    viva_question_id: id,
    section_id: sectionId,
    module_id: sectionId,
    topic_id: id,
    order,
    status: 'PENDING_REVIEW',
    verification_status: 'VERIFY_CURRENT_RULE',
    question_origin: 'ORIGINAL_PRACTICE',
    content_source: 'user-supplied-syllabus-2026',
    flags: ['model_practice_not_past_paper'],
    language_versions: {
      bn: {
        title: qBn,
        question: `${MODEL_BANNER}\n\n${qBn}`,
        ideal_answer: pointsBn.join(' '),
        key_points: pointsBn,
        follow_up_questions: followBn,
      },
      en: {
        title: qEn,
        question: `MODEL PRACTICE — not a previous-year HC paper.\n\n${qEn}`,
        ideal_answer: pointsEn.join(' '),
        key_points: pointsEn,
        follow_up_questions: followEn,
      },
    },
  }
}

function buildHcPack() {
  const assets = [
    hcLesson({
      id: 'HC-DRAFT-SYL-2026',
      order: 20,
      titleBn: 'হাইকোর্ট পারমিশন সিলেবাস ২০২৬ (যাচাইকৃত রূপরেখা)',
      titleEn: 'HC Permission syllabus 2026 (verified outline)',
      explanationBn:
        'ব্যবহারকারীর পেস্ট: লিখিত ২৫ + ভাইভা ২৫; পাস ১২ করে; মোট অন্তত ২৫ (এক পাশে ১২ হলে অন্য পাশে ১৩)। Group A দেওয়ানি: Memo of Appeal ও CPC ১১৫ রিভিশন। Group B ফৌজদারি: Memo of Appeal, CrPC ৫৬১এ, CrPC ৪৯১। Group C রিট: সংবিধান অনুচ্ছেদ ১০২-এর পাঁচ রিট (Mandamus, Certiorari, Habeas Corpus, Prohibition, Quo-Warranto)।\n\nঅ্যাপে আগে থেকেই SEC-DRAFT-এ এই যন্ত্রগুলো নামে আছে (DRAFT-001…005)। অফিসিয়াল Permission PDF নেই। ব্যবহারকারীর ২০২৪ (১০ মে) ও ২০২৫ (২৪ অক্টোবর) ছবিতে Full Marks 25, Time 3 Hours, এক Group থেকে একটি; ডান মার্জিন দেওয়ানি ৮ / ফৌজদারি ৮ / রিট ৯ — user-supplied পেপার, গেজেট নয়। পাস ১২+১২ এখনও সিলেবাস পেস্ট। HC MCQ ব্যাংক উদ্ভাবন করা হয়নি।',
      explanationEn:
        'User paste: Written 25 + Viva 25; pass 12 each; combined at least 25. Group A civil memo of appeal + CPC 115. Group B criminal memo of appeal + CrPC 561A + 491. Group C Art. 102 five writs. 15 Sep 2026: no official Permission PDF. User photos of 10 May 2024 and 24 Oct 2025 show Full Marks 25, 3 hours, one question per group; margin marks civil 8 / criminal 8 / writ 9 — confirmed on those papers, not a gazette PDF. Pass 12+12 still from the user syllabus paste. No invented HC MCQ bank (2019 notice announced MCQ; 2024–25 papers are written).',
      structure: [
        'লিখিত ২৫ + ভাইভা ২৫ (ব্যবহারকারী সিলেবাস; অফিসিয়াল PDF নেই)',
        'Group A / B / C ড্রাফটিং',
        '৮/৮/৯ ও ৩ ঘণ্টা — ২০২৪ ও ২০২৫ user-supplied পেপার',
      ],
      grounds: [
        '৮/৮/৯ মার্ক: ব্যবহারকারীর ২০২৪ ও ২০২৫ ছবি; গেজেট নয়।',
        'আইন: CPC 115, CrPC 410/561A/491, Constitution Art. 102।',
      ],
      prayer: ['সিলেবাস মডিউল + PREVQ-এ ২০২৪/২০২৫ লিখিত কার্ড।'],
      traps: ['কোচিং FAQ-কে অফিসিয়াল গেজেট মনে করা', 'নকল বিগত পেপার বানানো'],
      flags: ['user_paper_confirmed_marks_8_8_9'],
    }),
    hcLesson({
      id: 'HC-DRAFT-CIVIL-APPEAL',
      order: 21,
      titleBn: 'Group A — দেওয়ানি Memo of Appeal',
      titleEn: 'Group A — Civil memorandum of appeal',
      explanationBn:
        'দেওয়ানি আপিল সাধারণত CPC ১৯০৮-এর ধারা ৯৬ (প্রথম আপিল) ইত্যাদি সক্ষমকারী বিধান উল্লেখ করে অধস্তন আদালতের ডিক্রি/চূড়ান্ত আদেশ চ্যালেঞ্জ করে। আপিল তথ্য ও আইন উভয়ের ভুল ধরতে পারে; রিভিশন (ধারা ১১৫) তা করে না।',
      explanationEn:
        'A civil first appeal commonly cites CPC 1908 s.96 (and related provisions) against a decree. Appeal may raise error of fact and of law; revision under s.115 does not re-try facts.',
      structure: [
        'আদালতের নাম, আপিল নম্বর, cause title',
        'নিম্ন আদালত, মামলা নম্বর, চ্যালেঞ্জকৃত ডিক্রির তারিখ',
        'ঘটনার ক্রম',
        'নম্বরযুক্ত grounds',
        'প্রার্থনা, সত্যায়ন, স্বাক্ষর',
      ],
      grounds: [
        'নিম্ন আদালতের আইনি ভুল',
        'প্রমাণ মূল্যায়নের ভুল (আপিলে)',
        'ডিক্রি টিকবে না কেন — পয়েন্ট আকারে',
      ],
      prayer: ['ডিক্রি বাতিল/সংশোধন', 'খরচ', 'অন্তর্বর্তীকালীন আদেশ যদি চান'],
      traps: ['আপিলকে রিভিশনের মতো শুধু এখতিয়ারগত ভুলে সীমাবদ্ধ করা'],
    }),
    hcLesson({
      id: 'HC-DRAFT-CIVIL-REV115',
      order: 22,
      titleBn: 'Group A — দেওয়ানি রিভিশন (CPC ১১৫)',
      titleEn: 'Group A — Civil revision (CPC s.115)',
      explanationBn:
        'CPC ধারা ১১৫: হাইকোর্ট বিভাগ অধস্তন আদালতের রেকর্ড তলব করতে পারে যদি (ক) আইনগত এখতিয়ার নেই এমন ক্ষমতা ব্যবহার হয়, (খ) অর্পিত এখতিয়ার প্রয়োগে ব্যর্থতা হয়, অথবা (গ) এখতিয়ার প্রয়োগে বেআইনিভাবে বা বস্তুগত অনিয়মে কাজ হয়। সাধারণ তথ্যগত আপিল নয়।',
      explanationEn:
        'CPC s.115 revisional jurisdiction: exercise of jurisdiction not vested; failure to exercise jurisdiction vested; or illegality/material irregularity in exercising jurisdiction. Not a second appeal on facts.',
      structure: ['শিরোনামে s.115 CPC', 'চ্যালেঞ্জকৃত আদেশ', 'এখতিয়ারগত grounds', 'প্রার্থনা'],
      grounds: [
        'Jurisdiction not vested',
        'Failure to exercise jurisdiction',
        'Illegality or material irregularity',
      ],
      prayer: ['আদেশ বাতিল/সংশোধন', 'মামলা পুনর্বিচারের নির্দেশ যদি প্রযোজ্য'],
      traps: ['শুধু “রায় ভুল” লেখা — ধারা ১১৫-এর তিন শাখা না মিলিয়ে'],
    }),
    hcLesson({
      id: 'HC-DRAFT-CRIM-APPEAL',
      order: 23,
      titleBn: 'Group B — ফৌজদারি Memo of Appeal',
      titleEn: 'Group B — Criminal memorandum of appeal',
      explanationBn:
        'দণ্ডাদেশ/সাজার বিরুদ্ধে ফৌজদারি আপিল সাধারণত CrPC ১৮৯৮-এর ধারা ৪১০ (এবং সংশ্লিষ্ট আপিল বিধান) উল্লেখ করে খসড়া হয়। সাক্ষ্য মূল্যায়ন ও আইনের ভুল আলাদা করে লিখুন। জামিন/জামিননামা প্রার্থনা আলাদা ধারায় চাইতে হয়।',
      explanationEn:
        'Criminal appeals against conviction/sentence are commonly drafted under CrPC 1898 s.410 and related appeal provisions. Separate evidence-evaluation grounds from pure points of law. Bail, if sought, is a distinct prayer.',
      structure: ['Cause title ও s.410 (বা প্রযোজ্য আপিল ধারা)', 'দণ্ডাদেশের সার', 'grounds', 'প্রার্থনা (খালাস/সাজা হ্রাস/জামিন)'],
      grounds: ['সাক্ষ্য যথেষ্ট নয়', 'আইনের ভুল নির্দেশ', 'সাজা অতিরিক্ত'],
      prayer: ['দণ্ডাদেশ বাতিল', 'বিকল্প সাজা', 'জামিন যদি চান'],
      traps: ['জামিন প্রার্থনা ছাড়াই শুধু আপিল', '৫৬১এ-কে আপিল মনে করা'],
    }),
    hcLesson({
      id: 'HC-DRAFT-561A',
      order: 24,
      titleBn: 'Group B — CrPC ৫৬১এ (quashment)',
      titleEn: 'Group B — CrPC s.561A',
      explanationBn:
        'ধারা ৫৬১এ হাইকোর্ট বিভাগের সহজাত ক্ষমতা: আদালতের প্রক্রিয়ার অপব্যবহার রোধ বা ন্যায়বিচার নিশ্চিত করা। এটি সাধারণ আপিল/রিভিশন নয়।',
      explanationEn:
        'CrPC s.561A is inherent power to prevent abuse of process or secure the ends of justice. It is not a routine appeal.',
      structure: ['শিরোনামে s.561A', 'FIR/চার্জের ইতিহাস', 'কেন সাধারণ প্রতিকার অপর্যাপ্ত', 'প্রার্থনা: কার্যক্রম quash'],
      grounds: ['Abuse of process', 'প্রাথমিক অপরাধ নেই', 'আইনগত বার', 'mala fide'],
      prayer: ['কার্যক্রম বাতিল', 'অন্তর্বর্তী স্থগিতাদেশ'],
      traps: ['এটিকে নিত্য আপিল হিসেবে খসড়া করা'],
    }),
    hcLesson({
      id: 'HC-DRAFT-491',
      order: 25,
      titleBn: 'Group B — CrPC ৪৯১ (হেবিয়াস কর্পাস)',
      titleEn: 'Group B — CrPC s.491 habeas corpus',
      explanationBn:
        'ধারা ৪৯১ বিধিবদ্ধ পথ: আটক ব্যক্তিকে আদালতে হাজির করানো। সংবিধান অনুচ্ছেদ ১০২(২)(খ)(i) সমান্তরাল সাংবিধানিক পথ — বিনিময়যোগ্য বলে চুপ করে না লিখে উভয়ের কথা জানুন।',
      explanationEn:
        'CrPC s.491 is the statutory habeas route. Constitution Art. 102(2)(b)(i) is a parallel constitutional route — a strong draft knows both.',
      structure: ['s.491 এবং/বা Art. 102(2)(b)(i)', 'আটকের ঘটনা', 'অবৈধতার grounds', 'হাজিরা ও মুক্তির প্রার্থনা'],
      grounds: ['আইনগত কর্তৃত্ব নেই', 'পদ্ধতি লঙ্ঘন', 'মৌলিক অধিকার'],
      prayer: ['উত্পাদন (produce the body)', 'মুক্তি'],
      traps: ['আটককারী কর্তৃপক্ষকে respondent না করা'],
    }),
    hcLesson({
      id: 'HC-DRAFT-WRIT-MANDAMUS',
      order: 26,
      titleBn: 'Group C — Mandamus (Art. 102)',
      titleEn: 'Group C — Mandamus (Art. 102)',
      explanationBn:
        'অনুচ্ছেদ ১০২(২)(ক): আইন অনুসারে যা করতে বাধ্য, তা করতে নির্দেশ; যা করতে আইন দেয় না, তা থেকে বিরত। ম্যান্ডামাসে আইনি অধিকার + কর্তৃপক্ষের আইনি কর্তব্য দেখাতে হয়।',
      explanationEn:
        'Art. 102(2)(a): order a public functionary to do what the law requires, or refrain from what the law forbids. Mandamus needs a legal right and a corresponding public duty.',
      structure: ['রিট ফর্ম / cause title', 'অধিকার ও কর্তব্য', 'গ্রাউন্ডস', 'রুল নিসি ও প্রার্থনা'],
      grounds: ['আইনি অধিকার', 'কর্তব্য পালনে ব্যর্থতা', 'বিকল্প প্রতিকার অপর্যাপ্ত (১০২(২) শর্ত)'],
      prayer: ['দায়িত্ব পালনের নির্দেশ', 'রুল নিসি'],
      traps: ['প্রাইভেট বিরোধকে রিট বানানো'],
    }),
    hcLesson({
      id: 'HC-DRAFT-WRIT-CERTIORARI',
      order: 27,
      titleBn: 'Group C — Certiorari (Art. 102)',
      titleEn: 'Group C — Certiorari (Art. 102)',
      explanationBn:
        'অনুচ্ছেদ ১০২(২)(ক)(ii): বেআইনি কর্তৃত্বে কৃত কাজ/কার্যক্রম বাতিল ঘোষণা — সার্টিওরারির প্রকৃতি। রেকর্ডে স্পষ্ট আইনি ভুল (error of law apparent on the face of the record) গুরুত্ব পায়।',
      explanationEn:
        'Art. 102(2)(a)(ii) is the certiorari-type declaration that an act/proceeding is without lawful authority and of no legal effect.',
      structure: ['চ্যালেঞ্জকৃত আদেশ সংযুক্ত', 'এখতিয়ার/আইনি ভুল', 'প্রার্থনা: বাতিল ঘোষণা'],
      grounds: ['Without lawful authority', 'Error of law on the face of the record'],
      prayer: ['আদেশ অবৈধ ও বাতিল', 'রুল নিসি'],
      traps: ['সার্টিওরারি বানান ও উপধারা ভুল'],
    }),
    hcLesson({
      id: 'HC-DRAFT-WRIT-HABEAS',
      order: 28,
      titleBn: 'Group C — Habeas Corpus (Art. 102)',
      titleEn: 'Group C — Habeas Corpus (Art. 102)',
      explanationBn:
        'অনুচ্ছেদ ১০২(২)(খ)(i): কাস্টডিতে থাকা ব্যক্তিকে আদালতে হাজির করানো যাতে আটক বৈধ কি না দেখা যায়। CrPC ৪৯১ আলাদা বিধিবদ্ধ পথ।',
      explanationEn:
        'Art. 102(2)(b)(i): produce a person in custody so the Court may test the legality of detention. Distinct from CrPC s.491.',
      structure: ['Art. 102(2)(b)(i)', 'কাস্টডির তথ্য', 'অবৈধতা', 'প্রার্থনা'],
      grounds: ['Without lawful authority', 'Unlawful manner of detention'],
      prayer: ['Produce', 'Release'],
      traps: ['৪৯১ ও ১০২ গুলিয়ে একই খসড়ায় ব্যাখ্যা না করা'],
    }),
    hcLesson({
      id: 'HC-DRAFT-WRIT-PROHIBITION',
      order: 29,
      titleBn: 'Group C — Prohibition (Art. 102)',
      titleEn: 'Group C — Prohibition (Art. 102)',
      explanationBn:
        'প্রোহিবিশন চলমান বেআইনি কার্যক্রম থামানোর নির্দেশের প্রকৃতি — অনুচ্ছেদ ১০২(২)(ক)-এর “refrain from doing that which he is not permitted by law to do” অংশের সাথে মিলে।',
      explanationEn:
        'Prohibition restrains ongoing action the authority is not permitted by law to take, mapping to the “refrain” limb of Art. 102(2)(a).',
      structure: ['চলমান কার্যক্রম চিহ্নিত করুন', 'এখতিয়ারের বাইরে কেন', 'বিরত থাকার প্রার্থনা'],
      grounds: ['Want of jurisdiction', 'Ultra vires proceeding still in motion'],
      prayer: ['কার্যক্রম চালিয়ে যেতে নিষেধ', 'রুল নিসি'],
      traps: ['ইতিমধ্যে শেষ হয়ে যাওয়া আদেশে প্রোহিবিশন (সেক্ষেত্রে সার্টিওরারি)'],
    }),
    hcLesson({
      id: 'HC-DRAFT-WRIT-QUOWARRANTO',
      order: 30,
      titleBn: 'Group C — Quo-Warranto (Art. 102)',
      titleEn: 'Group C — Quo-Warranto (Art. 102)',
      explanationBn:
        'অনুচ্ছেদ ১০২(২)(খ)(ii): পাবলিক অফিস দাবিদারকে কোন অধিকারে পদ ধরে আছেন তা দেখাতে বলা।',
      explanationEn:
        'Art. 102(2)(b)(ii): require a person holding or purporting to hold a public office to show the authority for that office.',
      structure: ['পদ ও ধারক', 'যোগ্যতা/নিয়োগ আইন', 'প্রার্থনা: পদ শূন্য/অবৈধ ঘোষণা'],
      grounds: ['নিয়োগ আইন লঙ্ঘন', 'যোগ্যতা নেই', 'পদ পাবলিক অফিস'],
      prayer: ['Show cause under what authority', 'ঘোষণা যে তিনি পদ ধরে রাখতে পারেন না'],
      traps: ['প্রাইভেট কোম্পানি পদকে পাবলিক অফিস মনে করা'],
    }),
    hcLesson({
      id: 'HC-DRAFT-COMPARE-APPEAL-REV',
      order: 31,
      titleBn: 'আপিল বনাম CPC ১১৫ রিভিশন',
      titleEn: 'Appeal versus CPC s.115 revision',
      sectionId: 'SEC-DRAFT',
      explanationBn:
        'CPC ধারা ৯৬ (প্রথম আপিল) ডিক্রির বিরুদ্ধে তথ্য ও আইন উভয়ের ভুল তুলতে পারে। ধারা ১০০ দ্বিতীয় আপিল সাধারণত আইনের প্রশ্ন। ধারা ১১৫ রিভিশন তিন শাখা: এখতিয়ার নেই এমন ক্ষমতা; অর্পিত এখতিয়ার প্রয়োগে ব্যর্থতা; বেআইনি/বস্তুগত অনিয়ম। তথ্য পুনর্মূল্যায়ন রিভিশনের কাজ নয়। সূত্র: bdlaws CPC.',
      explanationEn:
        'CPC s.96 first appeal may raise error of fact and of law. s.100 second appeal is generally a question of law. s.115 revision is jurisdictional (not vested / failure to exercise / illegality or material irregularity). Not a retrial on facts. Source: bdlaws CPC.',
      structure: ['প্রথমে প্রতিকার বাছুন: আপিল না রিভিশন', 'সক্ষমকারী ধারা উল্লেখ', 'গ্রাউন্ডস সেই ধারার ভাষায়'],
      grounds: ['আপিলে তথ্য+আইন', 'রিভিশনে শুধু এখতিয়ার/অনিয়ম'],
      prayer: ['আপিলে ডিক্রি বাতিল', 'রিভিশনে আদেশ বাতিল/পুনর্বিচার'],
      traps: ['“রায় ভুল” দিয়ে ১১৫ খসড়া'],
    }),
    hcLesson({
      id: 'HC-DRAFT-COMPARE-HABEAS',
      order: 32,
      titleBn: 'CrPC ৪৯১ বনাম অনুচ্ছেদ ১০২ হেবিয়াস',
      titleEn: 'CrPC s.491 versus Art. 102 habeas',
      sectionId: 'SEC-DRAFT',
      explanationBn:
        'CrPC ৪৯১ (bdlaws act-75/section-21977): হাইকোর্ট বিভাগ অবৈধ/অনুপযুক্ত কাস্টডি থেকে মুক্তির নির্দেশ দিতে পারে; উপধারা (৩) প্রতিরোধমূলক আটকে প্রযোজ্য নয়। অনুচ্ছেদ ১০২(২)(খ)(i) সাংবিধানিক পথ — “any person” আবেদন করতে পারে। খসড়ায় কোন পথ ব্যবহার করছেন তা স্পষ্ট লিখুন; দুটিকে এক করে ফেলবেন না।',
      explanationEn:
        'CrPC s.491 is the statutory habeas route (not for preventive detention under 491(3)). Art. 102(2)(b)(i) is constitutional habeas; any person may apply. A draft must pick the path and not mash the two together.',
      structure: ['পথ বাছুন: ৪৯১ না ১০২(২)(খ)(i)', 'আটককারী কর্তৃপক্ষকে respondent', 'produce + release প্রার্থনা'],
      grounds: ['আইনগত কর্তৃত্ব নেই', 'পদ্ধতি লঙ্ঘন', '৪৯১(৩) প্রতিরোধমূলক আটক বাদ'],
      prayer: ['শরীর হাজির', 'মুক্তি'],
      traps: ['প্রতিরোধমূলক আটকে ৪৯১ ব্যবহার', 'আটককারীকে বাদ দেওয়া'],
    }),
    hcLesson({
      id: 'HC-DRAFT-PREVQ-HONEST',
      order: 10,
      titleBn: 'HC বিগত পেপার: অফিসিয়াল ০; ব্যবহারকারী ২০২৪–২৫',
      titleEn: 'HC past papers: official 0; user 2024–25',
      sectionId: 'SEC-PREVQ',
      shortBn: 'অফিসিয়াল PDF ০। ব্যবহারকারীর লিখিত ২০২৪ ও ২০২৫ আলাদা কার্ড।',
      shortEn: 'Official PDF 0. User-supplied written 2024 and 2025 are separate cards.',
      flags: ['official_past_papers_zero', 'user_supplied_written_2024_2025'],
      explanationBn:
        'অফিসিয়াল HC Permission PDF এখনও ০ (বার কাউন্সিল Cloudflare; সুপ্রিম কোর্ট বিচার/কজলিস্ট; Teletalk ফর্ম; ডিপিপি গেজেট নয়)। ব্যবহারকারী ১৫ সেপ্টেম্বর ২০২৬-এ ২০২৪ (১০ মে) ও ২০২৫ (২৪ অক্টোবর) লিখিত পেপারের ছবি দিয়েছেন — হেডার+তারিখ+Group A/B/C যাচাই। সেগুলো PREVQ-এ user-supplied লিখিত কার্ড; অফিসিয়াল ডাউনলোড নয়; মডেল উত্তর নেই। অন্য সালের ছবি/PDF এই শিকারে পাওয়া যায়নি। ২০১৯-এ HC MCQ ঘোষণা ছিল; ২০২৪–২৫ পেপার লিখিত ২৫ নম্বর — MCQ ব্যাংক উদ্ভাবন করা হয়নি। Ain Prokash / Live MCQ / QuesBankBD কপি হয়নি। নিচের ফ্যাক্ট প্যাটার্ন এখনও কাল্পনিক মডেল।',
      explanationEn:
        'Official HC Permission PDF still 0. User photos (15 Sep 2026) of written 10 May 2024 and 24 Oct 2025 are in PREVQ as user-supplied cards — not an official download, no invented model answers. No other years found with a Bar Council header. A 2019 notice announced HC MCQ; 2024–25 papers are written 25 — no MCQ bank invented. Coaching banks not scraped. Fact patterns below remain fictional models.',
      structure: ['অফিসিয়াল পেপার ০', 'user-supplied লিখিত ২০২৪ ও ২০২৫', 'মডেল ফ্যাক্ট আলাদা'],
      grounds: ['প্রশ্নপত্র গেজেটে প্রকাশিত নয়', 'কোচিং ব্যাংক কপিরাইট'],
      prayer: ['PREVQ সাল ফিল্টার: ২০২৪ / ২০২৫'],
      traps: ['জাল “HC exam 2019” লেবেল', 'MCQ ব্যাংক উদ্ভাবন'],
    }),
    hcLesson({
      id: 'HC-DRAFT-FACT-CIVIL',
      order: 40,
      titleBn: 'মডেল ফ্যাক্ট — দেওয়ানি আপিল',
      titleEn: 'Model facts — civil appeal',
      sectionId: 'SEC-PREVQ',
      shortBn: 'মডেল অনুশীলন — বিগত সালের প্রশ্ন নয়।',
      flags: ['model_practice_not_past_paper'],
      explanationBn:
        `${MODEL_BANNER}\n\nকাল্পনিক: সহকারী জজ, ঢাকা, Title Suit No. 88/2024। বাদী রহিম দাবি করেন ১২ শতক জমি কবলামূলে ক্রয়; বিবাদী করিম দাবি করেন দখল ও রেকর্ড। ১২.০১.২০২৬ তারিখের ডিক্রিতে মামলা খারিজ — আদালত বলেছে বাদীর দলিল “সন্দেহজনক” কিন্তু প্রমাণ মূল্যায়ন সংক্ষিপ্ত। আপনি রহিমের পক্ষে হাইকোর্ট বিভাগে memo of appeal খসড়া করবেন (CPC s.96)। Cause title, তিন গ্রাউন্ড, প্রার্থনা।`,
      explanationEn:
        'MODEL PRACTICE — not a previous-year paper. Fictional Assistant Judge, Dhaka, Title Suit 88/2024 dismissed 12 Jan 2026. Draft a civil memo of appeal under CPC s.96.',
      structure: ['Cause title + s.96', 'নিম্ন আদালত ও তারিখ', 'তিন গ্রাউন্ড', 'প্রার্থনা'],
      grounds: ['প্রমাণ মূল্যায়নের ভুল (আপিলে)', 'দলিল অগ্রাহ্য করার আইনি ভুল', 'দখল-স্বত্ব মিলিয়ে না দেখা'],
      prayer: ['ডিক্রি বাতিল', 'মামলা মঞ্জুর', 'খরচ'],
      traps: ['এটিকে ২০১৯ সালের পেপার লেবেল করা'],
    }),
    hcLesson({
      id: 'HC-DRAFT-FACT-115',
      order: 41,
      titleBn: 'মডেল ফ্যাক্ট — CPC ১১৫',
      titleEn: 'Model facts — CPC s.115',
      sectionId: 'SEC-PREVQ',
      shortBn: 'মডেল অনুশীলন — বিগত সালের প্রশ্ন নয়।',
      flags: ['model_practice_not_past_paper'],
      explanationBn:
        `${MODEL_BANNER}\n\nকাল্পনিক: যুগ্ম জেলা জজ অস্থায়ী নিষেধাজ্ঞা (O.39) খারিজ করেছেন এই বলে যে “বাদীর মামলা দুর্বল”, কিন্তু এখতিয়ার/প্রথম নজরে মামলা/সুবিধার ভারসাম্য আলোচনা করেননি। আপিল চলে কি না সন্দেহ। CPC s.115-এর তিন শাখার একটি বেঁধে রিভিশন খসড়া করুন।`,
      explanationEn:
        'MODEL PRACTICE — not a previous-year paper. Fictional joint district judge dismissed a temporary injunction with no jurisdictional analysis. Draft s.115 revision.',
      structure: ['s.115 শিরোনাম', 'চ্যালেঞ্জকৃত আদেশ', 'এখতিয়ারগত গ্রাউন্ড', 'প্রার্থনা'],
      grounds: ['Failure to exercise jurisdiction', 'Material irregularity'],
      prayer: ['আদেশ বাতিল', 'নিষেধাজ্ঞা আবেদন পুনর্বিচার'],
      traps: ['শুধু “রায় ভুল”'],
    }),
    hcLesson({
      id: 'HC-DRAFT-FACT-561A',
      order: 42,
      titleBn: 'মডেল ফ্যাক্ট — ৫৬১এ',
      titleEn: 'Model facts — s.561A',
      sectionId: 'SEC-PREVQ',
      shortBn: 'মডেল অনুশীলন — বিগত সালের প্রশ্ন নয়।',
      flags: ['model_practice_not_past_paper'],
      explanationBn:
        `${MODEL_BANNER}\n\nকাল্পনিক FIR: শ্বশুর-শাশুড়ি ও দেবরের বিরুদ্ধে ৪০৬/৪২০ — অভিযোগ শুধু এই যে যৌতুকের টাকা “ফেরত দেননি”; কোনো প্রতারণামূলক প্রলোভনের তারিখ নেই; তদন্তে দেওয়ানি দেনমোহর মামলা চলমান। s.561A-তে quashment খসড়া করুন। সূত্র: bdlaws CrPC s.561A — abuse of process / ends of justice.`,
      explanationEn:
        'MODEL PRACTICE — not a previous-year paper. Fictional 406/420 FIR that is a civil dower dispute. Draft s.561A quashment.',
      structure: ['s.561A', 'FIR সার', 'কেন প্রাথমিক অপরাধ নেই', 'quash প্রার্থনা'],
      grounds: ['Abuse of process', 'দেওয়ানি বিরোধ', 'mala fide'],
      prayer: ['কার্যক্রম বাতিল', 'অন্তর্বর্তী স্থগিত'],
      traps: ['এটিকে সাধারণ আপিল খসড়া'],
    }),
    hcLesson({
      id: 'HC-DRAFT-FACT-WRIT',
      order: 43,
      titleBn: 'মডেল ফ্যাক্ট — পাঁচ রিট বাছুন',
      titleEn: 'Model facts — pick a writ',
      sectionId: 'SEC-PREVQ',
      shortBn: 'মডেল অনুশীলন — বিগত সালের প্রশ্ন নয়।',
      flags: ['model_practice_not_past_paper'],
      explanationBn:
        `${MODEL_BANNER}\n\nতিন কাল্পনিক ঘটনা থেকে রিট বাছুন (Art. 102):\n(১) সিটি কর্পোরেশন বৈধ ট্রেড লাইসেন্স নবায়ন না করে।\n(২) একটি ট্রাইব্যুনাল এখতিয়ারের বাইরে জরিমানা আরোপ করেছে (আদেশ হয়ে গেছে)।\n(৩) এক ব্যক্তি সরকারি কলেজের অধ্যক্ষ পদে বসে আছেন, নিয়োগবিধি অনুসারে যোগ্যতা নেই।\nপ্রতিটিতে ম্যান্ডামাস / সার্টিওরারি / প্রোহিবিশন / হেবিয়াস / কো-ওয়ারেন্টো — কোনটি ও কেন।`,
      explanationEn:
        'MODEL PRACTICE — not a previous-year paper. Three fictional facts: licence non-renewal; tribunal ultra vires order already made; ineligible public-office holder. Pick the writ.',
      structure: ['ঘটনা → রিট', 'Art. 102 উপধারা', 'বিকল্প প্রতিকার'],
      grounds: ['(১) Mandamus', '(২) Certiorari', '(৩) Quo-warranto'],
      prayer: ['রুল নিসি + নির্দিষ্ট প্রার্থনা'],
      traps: ['শেষ হয়ে যাওয়া আদেশে প্রোহিবিশন'],
    }),
  ]

  const written = [
    hcWritten({
      id: 'HC-WQ-DRAFT-CIVIL-APPEAL',
      titleBn: 'স্ব-পরীক্ষা: দেওয়ানি আপিল খসড়া',
      promptBn:
        'একটি কাল্পনিক সহকারী জজের ডিক্রির বিরুদ্ধে দেওয়ানি memo of appeal-এর কাঠামো, তিনটি গ্রাউন্ড এবং প্রার্থনা লিখুন। নমুনা উত্তর দেওয়া হয়নি।',
    }),
    hcWritten({
      id: 'HC-WQ-DRAFT-115',
      titleBn: 'স্ব-পরীক্ষা: CPC ১১৫',
      promptBn: 'ধারা ১১৫-এর তিন শাখার একটির সাথে বেঁধে রিভিশন গ্রাউন্ড ও প্রার্থনা লিখুন। নমুনা উত্তর নেই।',
    }),
    hcWritten({
      id: 'HC-WQ-DRAFT-561A',
      titleBn: 'স্ব-পরীক্ষা: ৫৬১এ',
      promptBn: 'একটি কাল্পনিক FIR quash করতে s.561A খসড়ার কাঠামো-গ্রাউন্ড-প্রার্থনা লিখুন। নমুনা উত্তর নেই।',
    }),
    hcWritten({
      id: 'HC-WQ-DRAFT-WRIT',
      titleBn: 'স্ব-পরীক্ষা: Art. 102 রিট বেছে নিন',
      promptBn:
        'একটি সরকারি কর্তৃপক্ষের নিষ্ক্রিয়তার ঘটনায় কোন রিট (ম্যান্ডামাস/সার্টিওরারি/প্রোহিবিশন/হেবিয়াস/কো-ওয়ারেন্টো) এবং কেন — কাঠামো ও প্রার্থনা লিখুন। নমুনা উত্তর নেই।',
    }),
    hcWritten({
      id: 'HC-WQ-DRAFT-FACT-CIVIL',
      sectionId: 'SEC-PREVQ',
      order: 50,
      titleBn: 'মডেল অনুশীলন — দেওয়ানি আপিল ফ্যাক্ট',
      promptBn:
        'Title Suit 88/2024 (কাল্পনিক) খারিজ। CPC s.96 memo of appeal: cause title, ঘটনার ক্রম, তিন গ্রাউন্ড, প্রার্থনা। নমুনা উত্তর নেই।',
    }),
    hcWritten({
      id: 'HC-WQ-DRAFT-FACT-115',
      sectionId: 'SEC-PREVQ',
      order: 51,
      titleBn: 'মডেল অনুশীলন — ১১৫ ফ্যাক্ট',
      promptBn:
        'কাল্পনিক O.39 খারিজ আদেশে এখতিয়ার আলোচনা নেই। s.115 খসড়া লিখুন। নমুনা উত্তর নেই।',
    }),
    hcWritten({
      id: 'HC-WQ-DRAFT-FACT-561A',
      sectionId: 'SEC-PREVQ',
      order: 52,
      titleBn: 'মডেল অনুশীলন — ৫৬১এ ফ্যাক্ট',
      promptBn:
        'কাল্পনিক ৪০৬/৪২০ FIR (দেওয়ানি দেনমোহর)। s.561A quashment খসড়া। নমুনা উত্তর নেই।',
    }),
    hcWritten({
      id: 'HC-WQ-DRAFT-FACT-491',
      sectionId: 'SEC-PREVQ',
      order: 53,
      titleBn: 'মডেল অনুশীলন — ৪৯১ ফ্যাক্ট',
      promptBn:
        'কাল্পনিক: থানায় ৭২ ঘণ্টার বেশি আটক, ম্যাজিস্ট্রেটের সামনে হাজিরা নেই। CrPC ৪৯১ খসড়া — ৪৯১(৩) প্রতিরোধমূলক আটক নয় বলে উল্লেখ করুন। নমুনা উত্তর নেই।',
    }),
    hcWritten({
      id: 'HC-WQ-DRAFT-FACT-WRIT',
      sectionId: 'SEC-WRITPREP',
      order: 54,
      titleBn: 'মডেল অনুশীলন — রিট ফ্যাক্ট',
      promptBn:
        'কাল্পনিক লাইসেন্স নবায়ন না হওয়া। Mandamus খসড়া: অধিকার, কর্তব্য, demand, প্রার্থনা। নমুনা উত্তর নেই।',
    }),
  ]

  const vivas = [
    hcViva({
      id: 'HC-DRAFT-VIVA-01',
      order: 60,
      qBn: 'দেওয়ানি আপিল ও CPC ১১৫ রিভিশনের পার্থক্য কী?',
      qEn: 'Difference between a civil appeal and CPC s.115 revision?',
      pointsBn: [
        'আপিল (s.96) তথ্য ও আইন; রিভিশন শুধু এখতিয়ার/অনিয়ম।',
        'রিভিশন দ্বিতীয় আপিল নয়।',
        'গ্রাউন্ডস ধারা ১১৫-এর তিন শাখার ভাষায়।',
      ],
      pointsEn: [
        'Appeal may retry facts and law; revision is jurisdictional.',
        'Revision is not a second appeal.',
        'Grounds must track the three limbs of s.115.',
      ],
      followBn: ['দ্বিতীয় আপিল কখন চলে?', 'O.39 আদেশে আপিল না রিভিশন?'],
      followEn: ['When does a second appeal lie?', 'Appeal or revision against an O.39 order?'],
    }),
    hcViva({
      id: 'HC-DRAFT-VIVA-02',
      order: 61,
      qBn: 'CrPC ৫৬১এ কখন ব্যবহার করবেন, আপিল নয় কেন?',
      qEn: 'When is CrPC s.561A used instead of an appeal?',
      pointsBn: [
        'সহজাত ক্ষমতা: abuse of process বা ends of justice।',
        'সাধারণ সাক্ষ্য পুনর্মূল্যায়ন নয়।',
        'bdlaws act-75/section-22145।',
      ],
      pointsEn: [
        'Inherent power to stop abuse of process or secure justice.',
        'Not a routine evidence appeal.',
        'bdlaws CrPC s.561A.',
      ],
      followBn: ['৪০২/৪০৬ দেওয়ানি বিরোধে quash?', 'চার্জ গঠনের পর ৫৬১এ?'],
      followEn: ['Quash a civil dispute dressed as 406/420?', '561A after charge?'],
    }),
    hcViva({
      id: 'HC-DRAFT-VIVA-03',
      order: 62,
      qBn: '৪৯১ ও অনুচ্ছেদ ১০২ হেবিয়াস — পার্থক্য?',
      qEn: 's.491 versus Art. 102 habeas?',
      pointsBn: [
        '৪৯১ বিধিবদ্ধ; ১০২(২)(খ)(i) সাংবিধানিক।',
        '৪৯১(৩) প্রতিরোধমূলক আটক বাদ।',
        '১০২-এ “any person” আবেদন করতে পারে।',
      ],
      pointsEn: [
        '491 statutory; 102(2)(b)(i) constitutional.',
        '491(3) excludes preventive detention.',
        'Art. 102 habeas may be moved by any person.',
      ],
      followBn: ['কাস্টডি প্রাইভেট হলে?', 'রুল নিসির প্রার্থনা?'],
      followEn: ['Private custody?', 'Do you pray for a rule nisi?'],
    }),
    hcViva({
      id: 'HC-DRAFT-VIVA-04',
      order: 63,
      qBn: 'পাঁচ রিট সংক্ষেপে বলুন (Art. 102)।',
      qEn: 'Name the five writs under Art. 102.',
      pointsBn: [
        'Mandamus — কর্তব্য পালন/বিরত।',
        'Certiorari — বেআইনি আদেশ বাতিল।',
        'Prohibition — চলমান বেআইনি কার্যক্রম থামানো।',
        'Habeas — কাস্টডি পরীক্ষা।',
        'Quo-warranto — পাবলিক পদের কর্তৃত্ব।',
      ],
      pointsEn: [
        'Mandamus — do or refrain.',
        'Certiorari — quash without lawful authority.',
        'Prohibition — stop an ongoing ultra vires act.',
        'Habeas — test custody.',
        'Quo-warranto — title to public office.',
      ],
      followBn: ['১০২(২) “equally efficacious remedy”?', 'অন্তর্বর্তী আদেশে অ্যাটর্নি জেনারেল নোটিশ?'],
      followEn: ['Equally efficacious remedy under 102(2)?', 'Attorney-General notice for interim orders?'],
    }),
    hcViva({
      id: 'HC-DRAFT-VIVA-05',
      order: 64,
      qBn: 'হাইকোর্ট পারমিশনের পাস মার্ক কী বলেছেন? অফিসিয়াল PDF আছে কি?',
      qEn: 'What pass mark did we record, and is there an official PDF?',
      pointsBn: [
        'ব্যবহারকারী: লিখিত ২৫ + ভাইভা ২৫; পাস ১২ করে; মোট ২৫।',
        '৮/৮/৯ ও ৩ ঘণ্টা — কোচিং, অফিসিয়াল নোটিশ এই পাসে নেই।',
        'অফিসিয়াল বিগত পেপার ০।',
      ],
      pointsEn: [
        'User paste: 25+25, pass 12 each, combined 25.',
        '8/8/9 and 3 hours remain unverified coaching figures.',
        'Official past papers 0.',
      ],
      followBn: ['দুই বছর সাবঅর্ডিনেট প্র্যাকটিস কোন আর্টিকেল?', 'অব্যাহতি Rule 65A?'],
      followEn: ['Two years’ subordinate practice — which article?', 'Exemption under Rule 65A?'],
    }),
    hcViva({
      id: 'HC-DRAFT-VIVA-06',
      order: 65,
      qBn: 'অনুচ্ছেদ ২১ বার কাউন্সিল অর্ডার — হাইকোর্ট পারমিশনের শর্ত?',
      qEn: 'Bar Council Order Art. 21 — conditions for High Court practice?',
      pointsBn: [
        'Art. 21: সাবঅর্ডিনেট কোর্টে দুই বছর, বা গেজেটভুক্ত বিদেশি হাইকোর্ট, বা নির্ধারিত অব্যাহতি।',
        'ফি Art. 22।',
        'এনরোলমেন্ট পরীক্ষা (MCQ/লিখিত/ভাইভা) আলাদা — পারমিশন পরীক্ষা মেশাবেন না।',
      ],
      pointsEn: [
        'Art. 21: two years in subordinate courts, or notified foreign High Court, or prescribed exemption.',
        'Fee under Art. 22.',
        'Enrolment exams are a separate track from Permission drafting.',
      ],
      followBn: ['সাবেক বিচারক অব্যাহতি?', 'পারমিশন ফর্ম কোথায় (teletalk)?'],
      followEn: ['Exemption for former judicial officers?', 'Where is the Permission form (Teletalk)?'],
    }),
    hcViva({
      id: 'HC-DRAFT-VIVA-07',
      order: 66,
      sectionId: 'SEC-HCPRAC',
      qBn: 'খসড়ায় List of Dates কেন দেবেন?',
      qEn: 'Why include a List of Dates?',
      pointsBn: [
        'বিচারকের জন্য ঘটনার ক্রম।',
        'গ্রাউন্ডস থেকে আলাদা রাখুন।',
        'মার্কিং স্কিম অফিসিয়াল PDF-এ নেই — কাঠামোই নম্বর বাঁচায়।',
      ],
      pointsEn: [
        'Helps the judge follow chronology.',
        'Keep dates out of the legal grounds.',
        'No official marking PDF this pass — structure still saves marks.',
      ],
      followBn: ['Affidavit কি বাধ্যতামূলক?', 'Interim-এ Art. 102(4)?'],
      followEn: ['Is an affidavit mandatory?', 'Art. 102(4) on interim orders?'],
    }),
    hcViva({
      id: 'HC-DRAFT-VIVA-08',
      order: 67,
      qBn: 'আপিল বিভাগ ও হাইকোর্ট পারমিশন এক পরীক্ষা নয় কেন?',
      qEn: 'Why is the Appellate Division not the Permission exam?',
      pointsBn: [
        'অনুচ্ছেদ ৯৪: দুই বিভাগ। পারমিশন = হাইকোর্ট বিভাগে প্র্যাকটিস।',
        'আপিল বিভাগ আলাদা এখতিয়ার (Art. 103)। অ্যাপে SEC-AD মিশে না।',
      ],
      pointsEn: [
        'Art. 94: two divisions. Permission is HCD practice.',
        'AD jurisdiction is Art. 103. The app never merges SEC-AD into Permission.',
      ],
      followBn: ['Art. 103 leave?', 'P4-18 নিয়ম?'],
      followEn: ['Art. 103 leave?', 'P4-18 never-merge rule?'],
    }),
  ]

  const modelTest = {
    content_id: 'HC-DRAFT-MTEST-2026',
    asset_type: 'MODEL_TEST',
    section_id: 'SEC-MTEST',
    module_id: 'SEC-MTEST',
    question_origin: 'ORIGINAL_PRACTICE',
    content_source: 'user-supplied-syllabus-2026',
    status: 'PENDING_REVIEW',
    flags: ['model_practice_not_past_paper'],
    duration_minutes: 180,
    question_ids: [
      'HC-WQ-DRAFT-FACT-CIVIL',
      'HC-WQ-DRAFT-FACT-561A',
      'HC-WQ-DRAFT-FACT-WRIT',
    ],
    language_versions: {
      bn: {
        title: 'মডেল অনুশীলন — তিন খসড়া (বিগত পেপার নয়)',
        instructions:
          `${MODEL_BANNER} তিনটি কাল্পনিক খসড়া: দেওয়ানি আপিল, ৫৬১এ, ম্যান্ডামাস। অফিসিয়াল ৩-ঘণ্টা দাবি যাচাই হয়নি। নমুনা উত্তর নেই।`,
      },
      en: {
        title: 'Model practice — three drafts (not a past paper)',
        instructions:
          'MODEL PRACTICE — not a previous-year paper. Three fictional drafts. Official 3-hour claim unverified. No model answers.',
      },
    },
  }

  return {
    schema_version: '1.0',
    dataset_id: 'HC_PERMISSION_DRAFTING_SYLLABUS_2026',
    status: 'PENDING_REVIEW',
    official_past_papers: 0,
    official_notice_fetched: false,
    official_notice_note:
      '2026-09-15: barcouncil.gov.bd Cloudflare 403; supremecourt.gov.bd 200 judgments/cause lists, no Permission PDF; bar.teletalk.com.bd forms only; dpp.gov.bd gazette index; Wayback 2023-06 enrolment syllabus (no question papers).',
    note: 'Interactive drafting+viva trainer from user 2026 outline + bdlaws. Fictional facts labelled মডেল অনুশীলন — বিগত সালের প্রশ্ন নয়. Not fake past papers.',
    fetched: '2026-09-15',
    assets: [...assets, ...written, ...vivas, modelTest],
  }
}

function countSyllabus() {
  const syl = JSON.parse(readFileSync(join(repo, 'Barcouncil assets', 'data', 'syllabus.json'), 'utf8'))
  const subjects = syl.subjects || []
  const rows = []
  let total = 0
  for (const s of subjects) {
    const topics = s.topics || []
    total += topics.length
    rows.push({
      module_id: s.module_id,
      title: s.title?.en || s.title?.bn,
      topics: topics.length,
      pending: topics.filter((t) => t.content_status === 'PENDING_CONTENT').length,
    })
  }
  return { total, rows, status: syl.verification_status, note: syl.verification_note }
}

const mcq2017 = parseMcqFile(readFileSync(join(inbox, 'mcq-2017.md'), 'utf8'), '2017')
const mcq2025 = parseMcqFile(readFileSync(join(inbox, 'mcq-2025.md'), 'utf8'), '2025')

const bad2017 = mcq2017.filter((x) => x.error)
const bad2025 = mcq2025.filter((x) => x.error)
if (mcq2017.filter((x) => !x.error).length !== 100 || mcq2025.filter((x) => !x.error).length !== 100) {
  console.error('MCQ parse failed', {
    n2017: mcq2017.length,
    ok2017: mcq2017.filter((x) => !x.error).length,
    bad2017,
    n2025: mcq2025.length,
    ok2025: mcq2025.filter((x) => !x.error).length,
    bad2025,
  })
  process.exit(1)
}

const writtenYears = ['2011', '2012', '2014', '2015', '2017', '2020', '2021', '2022']
const writtenByYear = {}
for (const y of writtenYears) {
  writtenByYear[y] = parseWrittenFile(readFileSync(join(inbox, `written-${y}.md`), 'utf8'), y)
}

const flags2017 = []
const assets2017 = mcq2017.map((item) => {
  const flags = citedSectionMismatch(item, '2017')
  for (const f of flags) flags2017.push({ n: item.n, ...f })
  return mcqAsset('2017', item, flags)
})
const flags2025 = []
const assets2025 = mcq2025.map((item) => {
  const flags = citedSectionMismatch(item, '2025')
  for (const f of flags) flags2025.push({ n: item.n, ...f })
  return mcqAsset('2025', item, flags)
})

const writtenEarly = []
for (const y of ['2011', '2012', '2014', '2015']) {
  for (const q of writtenByYear[y]) writtenEarly.push(writtenAsset(y, q))
}
const writtenLate = []
for (const y of ['2017', '2020', '2021', '2022']) {
  for (const q of writtenByYear[y]) writtenLate.push(writtenAsset(y, q))
}
const ocrFlags = [
  { flag: 'ocr_unverified', note: 'Re-OCR of page-1 photo on 2026-09-15. Marks in the margin are approximate.' },
  { flag: 'page_1_only', note: 'Groups ঘ/ঙ/চ are not in the photo. Not invented.' },
]
for (const q of OCR_2025.questions) {
  writtenLate.push(writtenAsset('2025', q, ocrFlags))
}

const batches = [
  {
    file: 'batch-2026-09-041-mcq-2017-user.json',
    mobile: 'bar_batch_041.json',
    json: batchEnvelope({
      batchId: 'BATCH-2026-09-041-MCQ-2017-USER',
      purpose: 'User-supplied Bar Council MCQ 2017 Q1–100. AUTHENTIC_REPORTED_QUESTION, not official PDF.',
      assets: assets2017,
    }),
  },
  {
    file: 'batch-2026-09-042-mcq-2025-user.json',
    mobile: 'bar_batch_042.json',
    json: batchEnvelope({
      batchId: 'BATCH-2026-09-042-MCQ-2025-USER',
      purpose: 'User-supplied Bar Council MCQ 2025 Q1–100 (prelim 25 Apr 2025).',
      assets: assets2025,
    }),
  },
  {
    file: 'batch-2026-09-043-written-2011-2015-user.json',
    mobile: 'bar_batch_043.json',
    json: batchEnvelope({
      batchId: 'BATCH-2026-09-043-WRITTEN-2011-2015-USER',
      purpose: 'User-supplied written papers 2011, 2012, 2014, 2015. No invented model answers.',
      assets: writtenEarly,
    }),
  },
  {
    file: 'batch-2026-09-044-written-2017-2025-user.json',
    mobile: 'bar_batch_044.json',
    json: batchEnvelope({
      batchId: 'BATCH-2026-09-044-WRITTEN-2017-2025-USER',
      purpose: 'User-supplied written 2017, 2020, 2021, 2022 + 2025 page-1 OCR (unverified, page 1 only).',
      assets: writtenLate,
    }),
  },
]

mkdirSync(outBar, { recursive: true })
mkdirSync(outMobile, { recursive: true })
for (const b of batches) {
  writeJson(join(outBar, b.file), b.json)
  writeJson(join(outMobile, b.mobile), b.json)
}

const hcPack = buildHcPack()
writeJson(join(outMobile, 'hc_drafting_syllabus_v1.json'), hcPack)

const hcInbox = join(inbox, 'hc-permission')
const hc2024 = parseHcWrittenMd(readFileSync(join(hcInbox, 'written-2024.md'), 'utf8'), '2024')
const hc2025 = parseHcWrittenMd(readFileSync(join(hcInbox, 'written-2025.md'), 'utf8'), '2025')
if (hc2024.items.length !== 6 || hc2025.items.length !== 6) {
  console.error('HC written parse failed', { y2024: hc2024.items.length, y2025: hc2025.items.length })
  process.exit(1)
}
const hcUserWritten = [...hc2024.items, ...hc2025.items].map(hcUserWrittenAsset)
const hcUserPack = batchEnvelope({
  batchId: 'BATCH-2026-09-045-HC-WRITTEN-2024-2025-USER',
  purpose:
    'User-supplied HC Permission written 2024 (10 May) and 2025 (24 Oct). AUTHENTIC_REPORTED_QUESTION. Not an official download. No model answers.',
  assets: hcUserWritten,
})
hcUserPack.exam_years = ['2024', '2025']
hcUserPack.hc_mcq_invented = false
writeJson(join(outMobile, 'hc_user_written_2024_2025.json'), hcUserPack)

const syl = countSyllabus()
const writtenCounts = Object.fromEntries(writtenYears.map((y) => [y, writtenByYear[y].length]))
writtenCounts['2025'] = OCR_2025.questions.length

const report = {
  date: '2026-09-15',
  mcq: { 2017: assets2017.length, 2025: assets2025.length },
  written: writtenCounts,
  hc_written_user: { 2024: hc2024.items.length, 2025: hc2025.items.length },
  hc_mcq_invented: false,
  conflicts: { 2017: flags2017, 2025: flags2025 },
  still_missing_mcq: ['2012', '2013', '2015', '2020', '2022', '2023'],
  still_missing_written: ['2013', '2016', '2018', '2019', '2023', '2024', '2025-pages-2plus'],
  official_hunt: {
    barcouncil_live: 'Cloudflare 403 on home/syllabus/notices — no downloadable paper bank',
    barcouncil_wayback:
      'https://web.archive.org/web/20230601000000/https://www.barcouncil.gov.bd/enrolment-examination-syllabus/ — enrolment MCQ/written syllabus & marks; NO past-question PDF',
    supremecourt: '200 HTML judgments/cause lists 15 Sep 2026; no HC Permission exam PDF',
    teletalk: 'http://bar.teletalk.com.bd/ — High Court registration/admit forms, not questions',
    dpp: 'gazette indexes = Order/amendment/PSC lists, not enrolment or Permission scripts',
    kushtia_bar_notice:
      'https://www.kushtiabar.org.bd/notice_details.php?id=5 — admit-card notice for HC written 24 Oct 2025; no question paper',
    hc_2025_date_news:
      'https://lawyersclubbangladesh.com/2025/09/17/high-court-permission-exam-2025/ — written 24 Oct 2025, 3 hours (seat/admit, not questions)',
    hc_2024_date_news:
      'https://campustimesbd.com/archives/5962 — HC written 10 May 2024 3:00–6:00 p.m. (notice, not questions)',
    hc_mcq_2019_notice:
      'Lawyers Club BD 30 Dec 2019 — Bar Council announced HC Permission preliminary MCQ 100/50/1h. No authentic MCQ paper found. 2024 and 2025 user papers are written 25, not MCQ.',
    facebook_2025_post_loginwalled:
      'BDLEGALSOLUTION Facebook 2025 post login-walled; not OCR’d. User photos used instead.',
    hc_official_past_papers: 0,
    hc_other_years_with_header: 0,
    refused: [
      'ainprokash.com',
      'web.livemcq.com',
      'quesbankbd.blogspot.com',
      'ainbid.com',
      'sattacademy.com',
      'scribd compiled keys',
      'facebook.com dumps',
      'telegram PDFs',
    ],
  },
  hc_modules: hcPack.assets.map((a) => a.content_id),
  hc_user_written_ids: hcUserWritten.map((a) => a.content_id),
  syllabus_134: syl,
  apk_batch: '041',
  remote_batches: ['042', '043', '044'],
  apk_hc_user_written: 'hc_user_written_2024_2025.json',
}

writeJson(join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', '_ingest-report-2026-09-15.json'), report)
const conflictCount = {
  c2017: flags2017.filter((f) => f.flag === 'answer_conflict').length,
  other2017: flags2017.filter((f) => f.flag !== 'answer_conflict').length,
  c2025: flags2025.filter((f) => f.flag === 'answer_conflict').length,
}
console.log(
  JSON.stringify(
    {
      mcq: report.mcq,
      written: report.written,
      hc_written_user: report.hc_written_user,
      conflicts: conflictCount,
      hc: report.hc_modules.length,
      topics: syl.total,
    },
    null,
    2,
  ),
)
