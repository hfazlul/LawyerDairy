type Json = Record<string, unknown>

function asObj(v: unknown): Json {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {}
}

/** Flatten Bar Council batch MCQ payload (language_versions.bn/en) for the trainer UI. */
export function flattenMcqPayload(
  payload: unknown,
  lang: 'bn' | 'en' = 'bn',
  opts: { includeAnswers?: boolean } = {},
) {
  const includeAnswers = opts.includeAnswers !== false
  const p = asObj(payload)
  const versions = asObj(p.language_versions)
  const loc = asObj(versions[lang] ?? versions.bn ?? versions.en)
  const question =
    String(loc.question || p.stem || p.question || p.title || '').trim()
  const rawOpts = loc.options ?? p.options
  let options: { key: string; text: string }[] = []
  if (Array.isArray(rawOpts)) {
    options = rawOpts.map((t, i) => ({
      key: String.fromCharCode(65 + i),
      text: String(t),
    }))
  } else {
    const o = asObj(rawOpts)
    options = Object.entries(o).map(([key, text]) => ({ key, text: String(text) }))
    options.sort((a, b) => a.key.localeCompare(b.key))
  }
  const correct = String(p.correct_answer || p.correctKey || p.answer || '').trim()
  const flags = Array.isArray(p.flags) ? p.flags.map((f) => String(f)) : []
  const noneOfPrinted =
    flags.includes('answer_none_of_printed') || correct.toUpperCase() === 'NONE'
  return {
    stem: question,
    options,
    correctKey: includeAnswers ? correct : '',
    explanation: includeAnswers ? String(loc.explanation || p.explanation || '') : '',
    answersHidden: !includeAnswers,
    flags,
    flagNote: String(p.flag_note || p.answer_note || ''),
    noneOfPrinted: includeAnswers ? noneOfPrinted : false,
  }
}

export function isCpcOrCrpcModule(moduleId: string | null | undefined): boolean {
  const m = (moduleId || '').toUpperCase()
  return m.includes('CPC') || m.includes('CRPC')
}
