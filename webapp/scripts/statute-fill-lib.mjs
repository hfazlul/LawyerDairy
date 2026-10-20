/** Shared builder for statute-grounded Bar Council syllabus lessons. */

export const NOW = '2026-09-13T00:00:00Z'
export const ACCESSED = '2026-09-13'

export const ACTS = {
  'BC-MOD-CPC': {
    act_name: 'The Code of Civil Procedure, 1908',
    act_year: 1908,
    act_number: 'Act No. V of 1908',
    url: 'https://bdlaws.minlaw.gov.bd/act-86.html',
  },
  'BC-MOD-CRPC': {
    act_name: 'The Code of Criminal Procedure, 1898',
    act_year: 1898,
    act_number: 'Act No. V of 1898',
    url: 'https://bdlaws.minlaw.gov.bd/act-75.html',
  },
  'BC-MOD-PENAL': {
    act_name: 'The Penal Code, 1860',
    act_year: 1860,
    act_number: 'Act No. XLV of 1860',
    url: 'https://bdlaws.minlaw.gov.bd/act-11.html',
  },
  'BC-MOD-EVIDENCE': {
    act_name: 'The Evidence Act, 1872',
    act_year: 1872,
    act_number: 'Act No. I of 1872',
    url: 'https://bdlaws.minlaw.gov.bd/act-24.html',
  },
  'BC-MOD-LIMITATION': {
    act_name: 'The Limitation Act, 1908',
    act_year: 1908,
    act_number: 'Act No. IX of 1908',
    url: 'https://bdlaws.minlaw.gov.bd/act-88.html',
  },
  'BC-MOD-SRA': {
    act_name: 'The Specific Relief Act, 1877',
    act_year: 1877,
    act_number: 'Act No. I of 1877',
    url: 'https://bdlaws.minlaw.gov.bd/act-36.html',
  },
  'BC-MOD-ETHICS': {
    act_name: 'Bangladesh Legal Practitioners and Bar Council Order, 1972',
    act_year: 1972,
    act_number: "President's Order No. 46 of 1972",
    url: 'http://bdlaws.minlaw.gov.bd/act-details-387.html',
  },
}

export function makeLesson(topic, k) {
  const act = ACTS[topic.module_id]
  const url = topic.official_url || act.url
  const titleEn = topic.title.en
  const titleBn = topic.title.bn
  const sec = topic.section_or_order
  return {
    content_id: `BC-STATUTE-${topic.topic_id}`,
    asset_type: 'LESSON',
    lesson_id: `BC-STATUTE-${topic.topic_id}`,
    topic_id: topic.topic_id,
    module_id: topic.module_id,
    version: 1,
    status: 'PENDING_REVIEW',
    verification_status: 'VERIFY_CURRENT_RULE',
    verification_note:
      'Structured explanation of the official statutory scheme, cited to the bdlaws act page. Not a certified bare-act transcription and not a past paper. Lawyer review still required before VERIFIED.',
    is_shell: false,
    practice_kind: 'STATUTE_LESSON',
    official_url: url,
    source_url: url,
    source_title: act.act_name,
    source_date: ACCESSED,
    section_or_order: sec,
    difficulty: 'MEDIUM',
    estimated_minutes: 12,
    related_question_ids: (k.q || []).map((_, i) => mcqId(topic, i)),
    related_law_ids: [`LREF-STATUTE-${topic.topic_id}`],
    related_previous_question_ids: [],
    related_previous_question_note:
      'Intentionally empty. No authentic Bar Council past paper for this topic is in the dataset.',
    language_versions: {
      en: {
        title: titleEn,
        short_description: k.sE || `Statute trainer on ${sec} of ${act.act_name}. Practice only — not a past paper.`,
        learning_objective: k.oE || `State the statutory rule in ${sec}, apply it to a short fact pattern, and avoid the usual exam traps.`,
        explanation: k.gE,
        key_concepts: k.cE || [],
        important_rules: k.rE || [],
        definitions: (k.dE || []).map((d) => ({ term: d[0], definition: d[1] })),
        examples: k.xE || [],
        exam_focus: k.eE || `MCQ will test the exact outcome of ${sec}, not folklore. This is অনুশীলন / statute-based practice — not গত সালের প্রশ্নপত্র.`,
        common_traps: k.tE || [],
        quick_revision: k.vE || k.rE || [],
        key_takeaways: k.kE || [],
      },
      bn: {
        title: titleBn,
        short_description: k.sB || `${act.act_name}-এর ${sec} নিয়ে ধারাভিত্তিক অনুশীলন পাঠ। বিগত প্রশ্নপত্র নয়।`,
        learning_objective: k.oB || `${sec}-এর বিধি বলতে পারা, সংক্ষিপ্ত ঘটনায় প্রয়োগ করা, এবং সাধারণ ফাঁদ এড়ানো।`,
        explanation: k.gB,
        key_concepts: k.cB || [],
        important_rules: k.rB || [],
        definitions: (k.dB || []).map((d) => ({ term: d[0], definition: d[1] })),
        examples: k.xB || [],
        exam_focus: k.eB || `এমসিকিউ ${sec}-এর সঠিক ফলাফল যাচাই করে। এটি অনুশীলন / ধারাভিত্তিক — গত সালের প্রশ্নপত্র নয়।`,
        common_traps: k.tB || [],
        quick_revision: k.vB || k.rB || [],
        key_takeaways: k.kB || [],
      },
    },
  }
}

export function mcqId(topic, i) {
  return `BC-MCQ-STATUTE-${topic.topic_id}-${String.fromCharCode(65 + i)}`
}

export function makeLawSection(topic) {
  const act = ACTS[topic.module_id]
  return {
    content_id: `LREF-STATUTE-${topic.topic_id}`,
    asset_type: 'LAW_SECTION',
    act_name: act.act_name,
    act_year: act.act_year,
    act_number: act.act_number,
    section_or_order: topic.section_or_order,
    version: 1,
    status: 'PENDING_REVIEW',
    verification_status: 'VERIFY_CURRENT_RULE',
    source_url: topic.official_url || act.url,
    official_url: topic.official_url || act.url,
    note: 'Anchor to the official act page. Lesson body is a structured explanation, not a gazette dump.',
  }
}

export function makeMcq(topic, q, i) {
  const act = ACTS[topic.module_id]
  const url = topic.official_url || act.url
  const ans = q.a
  const optsEn = { A: q.oe[0], B: q.oe[1], C: q.oe[2], D: q.oe[3] }
  const optsBn = { A: q.ob[0], B: q.ob[1], C: q.ob[2], D: q.ob[3] }
  const wrongEn = {}
  const wrongBn = {}
  for (const k of ['A', 'B', 'C', 'D']) {
    if (k !== ans) {
      wrongEn[k] = q.we || 'Not what the cited section provides.'
      wrongBn[k] = q.wb || 'উদ্ধৃত ধারার বিধান এটি নয়।'
    }
  }
  if (q.wE) Object.assign(wrongEn, q.wE)
  if (q.wB) Object.assign(wrongBn, q.wB)
  return {
    content_id: mcqId(topic, i),
    asset_type: 'MCQ',
    question_id: mcqId(topic, i),
    question_type: 'MCQ',
    question_origin: 'ORIGINAL_PRACTICE',
    question_category_authenticity: 'APP_PRACTICE_QUESTION',
    ui_label_bn: 'অনুশীলন (ধারাভিত্তিক)',
    ui_label_en: 'Practice (statute-based)',
    subject_module_id: topic.module_id,
    topic_id: topic.topic_id,
    version: 1,
    status: 'PENDING_REVIEW',
    difficulty: i === 0 ? 'EASY' : 'MEDIUM',
    verification_status: 'VERIFY_CURRENT_RULE',
    source_url: url,
    official_url: url,
    source_basis: `Original practice item written from the statutory structure of ${topic.section_or_order} as summarised in BC-STATUTE-${topic.topic_id}. Not an authentic previous-year paper.`,
    related_lesson_ids: [`BC-STATUTE-${topic.topic_id}`],
    correct_answer: ans,
    language_versions: {
      en: {
        question: q.e,
        options: optsEn,
        explanation: q.we,
        why_other_options_are_wrong: wrongEn,
      },
      bn: {
        question: q.b,
        options: optsBn,
        explanation: q.wb,
        why_other_options_are_wrong: wrongBn,
      },
    },
  }
}

export function buildBatch({ batch_id, batch_purpose, topics, knowledge }) {
  const assets = []
  const missing = []
  for (const topic of topics) {
    const k = knowledge[topic.topic_id]
    if (!k || !k.gE || !k.gB) {
      missing.push(topic.topic_id)
      continue
    }
    assets.push(makeLesson(topic, k))
    assets.push(makeLawSection(topic))
    const qs = k.q || []
    qs.forEach((q, i) => assets.push(makeMcq(topic, q, i)))
  }
  if (missing.length) {
    throw new Error(`Missing statute knowledge for: ${missing.join(', ')}`)
  }
  return {
    batch_id,
    schema_version: '1.0',
    content_version: '2026.09.13-statute-fill',
    created_at: NOW,
    source: 'official-statute-map-2026-09-13',
    operation: 'CREATE',
    status: 'PENDING_REVIEW',
    batch_purpose,
    asset_count: assets.length,
    assets,
  }
}
