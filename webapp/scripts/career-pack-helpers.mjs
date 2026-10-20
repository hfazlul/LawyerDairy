/**
 * Shared career-pack helpers for 16 Sep 2026 user ingest.
 */
export const BANNER_DOCX =
  'সূত্র: ব্যবহারকারীর Word ফাইল OCR/টেক্সট (docx)। অফিসিয়াল বার কাউন্সিল/BJSC ডাউনলোড নয়। মডেল উত্তর নেই যদি না চাবি ফাইলে ছিল।'

export function guessSubject(text) {
  const t = text
  if (/Evidence Act|সাক্ষ্য আইন/.test(t)) return { module: 'BC-MOD-EVIDENCE', topic: 'T-EVID-01' }
  if (/Limitation Act|তামাদি/.test(t)) return { module: 'BC-MOD-LIMITATION', topic: 'T-LIM-01' }
  if (/Specific Relief|সুনির্দিষ্ট প্রতিকার/.test(t)) return { module: 'BC-MOD-SRA', topic: 'T-SRA-01' }
  if (/Penal Code|দণ্ডবিধি|দন্ডবিধি/.test(t)) return { module: 'BC-MOD-PENAL', topic: 'T-PENAL-01' }
  if (/Criminal Procedure|CrPC|ফৌজদার|FIR|৫৬১/.test(t)) return { module: 'BC-MOD-CRPC', topic: 'T-CRPC-01' }
  if (/Constitution|সংবিধান|writ|Article 102/.test(t)) return { module: 'BJS-MOD-CONST', topic: 'T-CONST-01' }
  if (/Canons|বার কাউন্সিল|Bar Council Order/.test(t)) return { module: 'BC-MOD-ETHICS', topic: 'T-ETH-01' }
  return { module: 'BC-MOD-CPC', topic: 'T-CPC-01' }
}

export function batchEnvelope({ batchId, purpose, assets, extra = {}, source = 'user-supplied' }) {
  return {
    batch_id: batchId,
    schema_version: '1.0',
    content_version: '2026.09.16',
    created_at: '2026-09-16T00:00:00Z',
    source,
    content_source: source,
    operation: 'CREATE',
    status: 'PENDING_REVIEW',
    batch_purpose: purpose,
    official_past_papers: 0,
    asset_count: assets.length,
    assets,
    ...extra,
  }
}

export function citedIssuesFromPrompt(prompt) {
  const p = String(prompt || '')
  const acts = [...p.matchAll(/The [A-Za-z][A-Za-z0-9'",.\-() ]{3,80}?,?\s*1[789]\d{2}/g)].map((m) => m[0].trim())
  const bnActs = [...p.matchAll(/[অ-হ][অ-হা-্য\s]{0,40}আইন[^\n,]{0,20}/g)].map((m) => m[0].trim())
  const secs = [...p.matchAll(/(?:ধারা|section|s\.)\s*([০-৯0-9]+[A-কক-ঘA-Za-z]?)/gi)].map((m) => m[0])
  const orders = [...p.matchAll(/(?:আদেশ|Order)\s*([০-৯0-9IVX]+)/gi)].map((m) => m[0])
  const issues = ['অফিসিয়াল মডেল উত্তর নয় — প্রশ্নে যা চাওয়া তার ইস্যু-স্পট মাত্র।']
  if (acts.length) issues.push(`প্রশ্নে নাম করা আইন: ${[...new Set(acts)].slice(0, 6).join(' · ')}`)
  if (bnActs.length) issues.push(`প্রশ্নে নাম করা বাংলা আইন: ${[...new Set(bnActs)].slice(0, 4).join(' · ')}`)
  if (secs.length) issues.push(`প্রশ্নে নাম করা ধারা: ${[...new Set(secs)].slice(0, 8).join(', ')}`)
  if (orders.length) issues.push(`প্রশ্নে নাম করা আদেশ: ${[...new Set(orders)].slice(0, 4).join(', ')}`)
  if (/Advise|পরামর্শ|প্রতিকার|brief|খসড়া|দরখাস্ত/.test(p)) {
    issues.push('প্রশ্ন পরামর্শ/প্রতিকার/খসড়া চেয়েছে — ফোরাম, ধারা ও প্রার্থনা আলাদা করে লিখুন।')
  }
  if (issues.length === 1) issues.push('প্রশ্নের প্রতিটি উপভাগ (ক/খ/গ) আলাদা করে উত্তর দিন।')
  return issues
}

export function mcqAsset({
  id,
  year,
  sitting,
  n,
  question,
  options,
  correctKey,
  cite,
  flags = [],
  packPrefix = 'BJS',
  examBoard,
  sourceNote,
  titleBn,
  titleEn,
}) {
  const sub = guessSubject(`${question} ${cite || ''}`)
  const yearLabel = year || `${sitting}th`
  const flagNote = flags.length ? flags.join(', ') : null
  const board = examBoard || (packPrefix === 'BC' ? 'Bangladesh Bar Council' : 'BJSC')
  const explanation = [
    correctKey ? `ব্যবহারকারীর চাবি: ${correctKey}.` : 'চাবি ফাইলে পড়া যায়নি — উত্তর খালি রাখা হয়েছে।',
    cite || '',
    sourceNote || 'সূত্র: user-supplied docx। অফিসিয়াল BJSC PDF নয়।',
    flagNote,
  ]
    .filter(Boolean)
    .join('\n')
  const opts = {
    A: options.A || '',
    B: options.B || '',
    C: options.C || '',
    D: options.D || '',
  }
  return {
    content_id: id,
    question_id: id,
    asset_type: 'MCQ',
    question_type: 'MCQ',
    question_origin: 'AUTHENTIC_REPORTED_QUESTION',
    question_category_authenticity: 'AUTHENTIC_REPORTED_QUESTION',
    content_source: 'user-supplied',
    exam_year: year || null,
    paper_year: year || null,
    exam_sitting: sitting || null,
    exam_stage: 'MCQ',
    exam_board: board,
    subject_module_id: sub.module,
    topic_id: sub.topic,
    module_id: packPrefix === 'BC' ? sub.module : 'BJS-MOD-PRELIM',
    version: 1,
    status: 'PENDING_REVIEW',
    verification_status: 'NOT_VERIFIED',
    correct_answer: correctKey || '',
    flags,
    flag_note: flagNote,
    language_versions: {
      bn: {
        title: titleBn || `বিজেএস প্রিলি ${yearLabel} — প্রশ্ন ${n}`,
        question,
        options: opts,
        explanation,
      },
      en: {
        title: titleEn || `BJS prelim ${yearLabel} — Q${n}`,
        question,
        options: opts,
        explanation,
      },
    },
  }
}

export function writtenAsset({
  id,
  year,
  sitting,
  n,
  group,
  promptBn,
  promptEn,
  marks,
  paper,
  flags = [],
  examBoard = 'BJSC',
  source = 'user-supplied',
}) {
  const sub = guessSubject(`${promptBn} ${promptEn || ''}`)
  const yearLabel = year || `${sitting}th`
  const titleExtra = [paper, group ? `Group ${group}` : '', marks ? `${marks}` : '']
    .filter(Boolean)
    .join(' · ')
  const q = `${BANNER_DOCX}\nপরীক্ষা: ${yearLabel}${paper ? ` · ${paper}` : ''}${group ? ` · ${group}` : ''}${marks ? ` · ${marks} নম্বর` : ''}।\n\n${promptBn}`
  return {
    content_id: id,
    written_question_id: id,
    asset_type: 'WRITTEN_QUESTION',
    section_id: 'SEC-PREVQ',
    module_id: sub.module,
    topic_id: sub.topic,
    question_origin: 'AUTHENTIC_REPORTED_QUESTION',
    question_category_authenticity: 'AUTHENTIC_REPORTED_QUESTION',
    content_source: source,
    exam_year: year || null,
    paper_year: year || null,
    exam_sitting: sitting || null,
    exam_stage: 'WRITTEN',
    exam_board: examBoard,
    group_label: group || null,
    paper_label: paper || null,
    marks: marks || null,
    version: 1,
    status: 'PENDING_REVIEW',
    verification_status: 'NOT_VERIFIED',
    answer_type: 'NONE',
    flags,
    flag_note: flags.join(', ') || null,
    language_versions: {
      bn: {
        title: `${examBoard === 'BJSC' ? 'বিজেএস' : 'বার/HC'} লিখিত ${yearLabel} — প্রশ্ন ${n}${titleExtra ? ` (${titleExtra})` : ''}`,
        question: q,
        prep_outline: citedIssuesFromPrompt(promptBn),
        answer_outline: citedIssuesFromPrompt(promptBn),
        marking_points: [
          'প্রশ্নের সব অংশ উত্তর দিয়েছি',
          'সংশ্লিষ্ট আইন/ধারা উল্লেখ করেছি',
          'প্রার্থনা/খসড়া চাইলে কাঠামো মেনেছি',
        ],
        model_answer: '',
      },
      en: {
        title: `Written ${yearLabel} — Q${n}`,
        question: `${BANNER_DOCX}\nExam: ${yearLabel}${paper ? ` · ${paper}` : ''}.\n\n${promptEn || promptBn}`,
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
