import { createHash, type BinaryLike } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'
import path from 'path'

export function repoRoot(): string {
  const cwd = process.cwd()
  const parent = path.resolve(cwd, '..')
  if (existsSync(path.join(cwd, 'webapp')) && existsSync(path.join(cwd, 'mobile'))) return cwd
  if (existsSync(path.join(parent, 'webapp')) && existsSync(path.join(parent, 'mobile'))) return parent
  return parent
}

function firstExisting(relPaths: string[]): string | null {
  const root = repoRoot()
  for (const rel of relPaths) {
    const abs = path.join(root, rel)
    if (existsSync(abs)) return abs
  }
  return null
}

/** Latest unique master JSON. Newest numbered folder first; older packs are fallbacks. */
export function resolveCaseMasterPath(): string {
  const found = firstExisting([
    path.join('law-dairy app case related asset10', 'bangladesh_lawyer_diary_master.json'),
    path.join('law-dairy app case related asset9', 'bangladesh_lawyer_diary_master.json'),
    path.join('law-dairy app case related asset8', 'bangladesh_lawyer_diary_master.json'),
    path.join('law-dairy app case related asset7', 'bangladesh_lawyer_diary_master.json'),
    path.join('law-dairy app case related asset6', 'bangladesh_lawyer_diary_master.json'),
    path.join('law-dairy app case related asset5', 'bangladesh_lawyer_diary_master.json'),
    path.join('law-dairy app case related asset4', 'bangladesh_lawyer_diary_master.json'),
    path.join('law-dairy app case related assets3', 'bangladesh_lawyer_diary_master.json'),
  ])
  if (!found) {
    throw new Error('No bangladesh_lawyer_diary_master.json found under case-related asset folders')
  }
  return found
}

export function resolveStandaloneCaseFile(fileName: string): string | null {
  return firstExisting([
    path.join('law-dairy app case related asset10', fileName),
    path.join('law-dairy app case related asset9', fileName),
    path.join('law-dairy app case related asset8', fileName),
    path.join('law-dairy app case related asset7', fileName),
    path.join('law-dairy app case related asset6', fileName),
    path.join('law-dairy app case related asset5', fileName),
    path.join('law-dairy app case related asset4', fileName),
    path.join('law-dairy app case related assets3', fileName),
    path.join('law-dairy app case related assets', fileName),
  ])
}

/** Nested layout — manifest file_map is relative to the folder that has data/ + batches/. */
export function resolveBarDatasetRoot(): string {
  const found = firstExisting([
    'Barcouncil assets',
    path.join('Bar-council lesson assets7', 'bar-council-dataset'),
  ])
  if (!found) throw new Error('Bar Council dataset folder not found')
  return found
}

/** Unique extra batches (024/025) that are not in the 22-file base manifest. */
export function resolveBarExtraBatchFiles(): string[] {
  const canonical = firstExisting(['Barcouncil assets'])
  const dir = canonical
    ? path.join(canonical, 'batches')
    : firstExisting(['Barcouncil assets4'])
  if (!dir || !existsSync(dir)) return []
  return readdirSync(dir)
    .filter(
      (name) =>
        name.endsWith('.json') &&
        (/^batch-2026-08-02[45]-/.test(name) || /^batch-2026-09-/.test(name)),
    )
    .sort()
    .map((name) => path.join(dir, name))
}

export function fileSha256(absPath: string): string {
  return createHash('sha256').update(readFileSync(absPath) as BinaryLike).digest('hex')
}

/** Unique JSON by SHA — duplicate folders do not add coverage. */
export function uniqueJsonFiles(absPaths: string[]): { path: string; sha256: string }[] {
  const seen = new Set<string>()
  const out: { path: string; sha256: string }[] = []
  for (const abs of absPaths) {
    if (!existsSync(abs)) continue
    const sha256 = fileSha256(abs)
    if (seen.has(sha256)) continue
    seen.add(sha256)
    out.push({ path: abs, sha256 })
  }
  return out
}

export function resolveBarShellsPath(): string | null {
  return firstExisting([
    path.join('mobile', 'assets', 'career', 'bar_topic_shells.json'),
    path.join('Barcouncil assets', 'data', 'bar_topic_shells.json'),
    path.join('Barcouncil assets3', 'data', 'bar_topic_shells.json'),
  ])
}

export function listHcDatasetCopies(): string[] {
  const root = repoRoot()
  const candidates = [
    path.join('bd-hc-ad-dataset', 'bd-hc-ad-dataset.json'),
  ]
  return candidates.map((rel) => path.join(root, rel)).filter((abs) => existsSync(abs))
}

export function uniqueHcDataset(): { path: string; sha256: string; copies: number; uniqueHashes: number } {
  const copies = listHcDatasetCopies()
  const unique = uniqueJsonFiles(copies.length ? copies : [resolveHcDatasetPath()])
  const canonical = resolveHcDatasetPath()
  return {
    path: canonical,
    sha256: fileSha256(canonical),
    copies: Math.max(copies.length, 1),
    uniqueHashes: unique.length,
  }
}

export function resolveHcDatasetPath(): string {
  const found = firstExisting([
    path.join('bd-hc-ad-dataset', 'bd-hc-ad-dataset.json'),
    'bd-hc-ad-dataset11.json',
    'bd-hc-ad-dataset 12.json',
    'bd-hc-ad-dataset13.json',
    path.join('bd-hc-ad-dataset10', 'bd-hc-ad-dataset.json'),
    path.join('bd-hc-ad-dataset9', 'bd-hc-ad-dataset.json'),
    path.join('bd-hc-ad-dataset8', 'bd-hc-ad-dataset.json'),
    path.join('bd-hc-ad-dataset7', 'bd-hc-ad-dataset.json'),
    path.join('bd-hc-ad-dataset6', 'bd-hc-ad-dataset.json'),
    path.join('bd-hc-ad-dataset5', 'bd-hc-ad-dataset.json'),
    path.join('bd-hc-ad-dataset4', 'bd-hc-ad-dataset.json'),
    path.join('bd-hc-ad-dataset3', 'bd-hc-ad-dataset.json'),
    path.join('bd-hc-ad-dataset2', 'bd-hc-ad-dataset.json'),
    path.join('high-court lesson assets11', 'bd-hc-ad-dataset.json'),
    path.join('high-court lesson assets10', 'bd-hc-ad-dataset.json'),
    path.join('high-court lesson assets9', 'bd-hc-ad-dataset.json'),
    path.join('high-court lesson assets8', 'bd-hc-ad-dataset.json'),
    path.join('high-court lesson assets7', 'bd-hc-ad-dataset.json'),
    path.join('high-court lesson assets6', 'bd-hc-ad-dataset.json'),
    path.join('high-court lesson assets5', 'bd-hc-ad-dataset.json'),
    path.join('high-court lesson assets4', 'bd-hc-ad-dataset.json'),
  ])
  if (!found) throw new Error('High Court dataset JSON not found')
  return found
}

export function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function asRows(raw: unknown, keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    for (const k of keys) {
      if (Array.isArray(o[k])) return o[k] as Record<string, unknown>[]
    }
  }
  return []
}

function mergeById(
  existing: Record<string, unknown>[],
  extra: Record<string, unknown>[],
  idOf: (row: Record<string, unknown>) => string,
): Record<string, unknown>[] {
  const map = new Map<string, Record<string, unknown>>()
  for (const row of existing) {
    const id = idOf(row)
    if (id) map.set(id, row)
  }
  for (const row of extra) {
    const id = idOf(row)
    if (!id) continue
    const prev = map.get(id)
    map.set(id, prev ? { ...prev, ...row } : row)
  }
  return [...map.values()]
}

/**
 * Load canonical master JSON and merge any extra ids from later standalone
 * court_types / acts_laws dumps (split deliveries). Never concatenates courts
 * from older folders — court identity is court_uid, not positional court_id.
 */
export function loadCanonicalMaster(): Record<string, unknown> {
  const data = readJsonFile(resolveCaseMasterPath()) as Record<string, unknown>
  const typesPath = resolveStandaloneCaseFile('court_types.json')
  if (typesPath) {
    const extra = asRows(readJsonFile(typesPath), ['court_types', 'items', 'records'])
    const current = asRows(data.court_types, ['court_types'])
    if (extra.length) data.court_types = mergeById(current.length ? current : asRows(data.court_types, []), extra, (r) => String(r.id || ''))
  }
  const actsPath = resolveStandaloneCaseFile('acts_laws.json')
  if (actsPath) {
    const extra = asRows(readJsonFile(actsPath), ['acts', 'acts_laws', 'items', 'records'])
    const current = asRows(data.acts, ['acts'])
    if (extra.length) {
      data.acts = mergeById(current.length ? current : asRows(data.acts, []), extra, (r) => String(r.act_id || r.id || ''))
    }
  }
  return data
}
