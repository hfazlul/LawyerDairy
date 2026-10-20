/** Derived court identity. Dataset `court_id` is a positional index — never use as FK. */

export function courtPlaceId(input: {
  metropolitan_id?: string | null
  district_id?: string | null
  division_id?: string | null
}): string {
  return input.metropolitan_id || input.district_id || input.division_id || 'national'
}

/**
 * Optional third segment when the dataset itself distinguishes numbered benches
 * or district-vs-metro instances at the same type+place. Never uses court_id.
 */
export function courtInstanceKey(name: string): string | null {
  const text = name.trim()
  if (!text) return null
  if (/\(\s*district\s*\)/i.test(text)) return 'district'
  if (/\(\s*metropolitan\s*\)/i.test(text)) return 'metropolitan'
  const numbered = text.match(/[-–](\d+)(?=\s*,|\s*$)/) || text.match(/\bNo[.\s-]*(\d+)\b/i)
  if (numbered?.[1]) return numbered[1]
  return null
}

export function courtUid(input: {
  court_type_id: string
  metropolitan_id?: string | null
  district_id?: string | null
  division_id?: string | null
  instanceKey?: string | null
}): string {
  const base = `${input.court_type_id}::${courtPlaceId(input)}`
  const extra = (input.instanceKey || '').trim()
  return extra ? `${base}::${extra}` : base
}

function slugInstance(name: string): string | null {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return slug || null
}

/** First instance at a place keeps type::place (stable FK). Extra benches get a name-derived suffix. */
export function uniqueCourtUid(
  row: {
    court_type_id: string
    metropolitan_id?: string | null
    district_id?: string | null
    division_id?: string | null
    official_name?: string | null
    court_name_en?: string | null
  },
  seen: Set<string>,
): string | null {
  const base = courtUid(row)
  if (!seen.has(base)) return base
  const label = row.official_name || row.court_name_en || ''
  const key = courtInstanceKey(label) || slugInstance(label)
  if (!key) return null
  const uid = courtUid({ ...row, instanceKey: key })
  if (seen.has(uid) || uid === base) return null
  return uid
}
