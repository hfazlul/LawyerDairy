type Json = Record<string, unknown>

function asObj(v: unknown): Json {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {}
}

function locOf(payload: unknown, lang: 'bn' | 'en'): Json {
  const p = asObj(payload)
  const versions = asObj(p.language_versions)
  return asObj(versions[lang] ?? versions.bn ?? versions.en)
}

export function careerItemTitle(payload: unknown, lang: 'bn' | 'en' = 'bn'): string {
  const loc = locOf(payload, lang)
  const p = asObj(payload)
  const titleObj = asObj(p.title)
  return String(
    loc.title ||
      loc.question ||
      loc.stem ||
      titleObj[lang] ||
      titleObj.bn ||
      p.title ||
      p.content_id ||
      p.lesson_id ||
      '',
  ).trim()
}

export function flattenCareerItem(item: {
  id: string
  itemType: string
  moduleId?: string | null
  topicId?: string | null
  sectionId?: string | null
  status?: string | null
  source?: string | null
  payload: unknown
}, lang: 'bn' | 'en' = 'bn') {
  const loc = locOf(item.payload, lang)
  const p = asObj(item.payload)
  return {
    id: item.id,
    itemType: item.itemType,
    moduleId: item.moduleId,
    topicId: item.topicId,
    sectionId: item.sectionId,
    status: item.status,
    source: item.source,
    payload: item.payload,
    title: careerItemTitle(item.payload, lang) || item.id,
    shortDescription: String(loc.short_description || loc.description || ''),
    /** List/API preview. Explanation and model answers stay on payload until the player reveals them. */
    bodyText: String(loc.content || loc.question || loc.stem || loc.short_description || ''),
    answersHidden: true,
    learningObjective: String(loc.learning_objective || ''),
    keyConcepts: Array.isArray(loc.key_concepts) ? loc.key_concepts.map(String) : [],
    importantRules: Array.isArray(loc.important_rules) ? loc.important_rules.map(String) : [],
    examples: Array.isArray(loc.examples) ? loc.examples.map(String) : [],
    keyTakeaways: Array.isArray(loc.key_takeaways) ? loc.key_takeaways.map(String) : [],
    commonTraps: Array.isArray(loc.common_traps) ? loc.common_traps.map(String) : [],
    quickRevision: Array.isArray(loc.quick_revision) ? loc.quick_revision.map(String) : [],
    checklist: Array.isArray(loc.checklist) ? loc.checklist.map(String) : [],
    answerOutline: [] as string[],
    examFocus: String(loc.exam_focus || ''),
    nestedItems: Array.isArray(p.items) ? p.items : [],
  }
}

export function approxJsonBytes(value: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(value), 'utf8')
  } catch {
    return 0
  }
}
