import { createHash, type BinaryLike } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export type CareerPackKind = 'lesson' | 'mcq' | 'hc'

export type CareerFsPack = {
  id: string
  file: string
  hash: string
  size: number
  kind: CareerPackKind
  packId: 'bar-council' | 'high-court-ad' | 'bjs'
  local: boolean
}

const ROOT = join(process.cwd())
const DATA_DIR = join(ROOT, 'data', 'career')
const PACKS_DIR = join(DATA_DIR, 'packs')
const PUBLIC_DIR = join(ROOT, 'public', 'career')

const SAFE_FILE = /^[a-zA-Z0-9._-]+$/

export const APK_BAR_BATCHES = ['002', '004', '008', '041'] as const
export const ALL_BAR_BATCHES = [
  '002', '003', '004', '005', '006', '007', '008', '009', '010',
  '011', '012', '013', '014', '015', '016', '017', '018', '019',
  '020', '021', '022', '023', '024', '025', '026', '027', '028',
  '029', '030', '031', '032', '033', '034', '035', '036', '037', '038', '039', '040',
  '041', '042', '043', '044', '045', '046',
  '047', '048', '049', '050', '051', '052', '053',
] as const

export function remoteBarBatches(): string[] {
  return ALL_BAR_BATCHES.filter((n) => !APK_BAR_BATCHES.includes(n as (typeof APK_BAR_BATCHES)[number]))
}

export function careerDataDir(): string {
  return DATA_DIR
}

export function careerPacksDir(): string {
  return PACKS_DIR
}

function kindOf(file: string): CareerPackKind {
  const f = file.toLowerCase()
  if (f.startsWith('hc_') || f.includes('high-court') || f.includes('hc-')) return 'hc'
  if (f.includes('mcq')) return 'mcq'
  return 'lesson'
}

function packIdOf(file: string): CareerFsPack['packId'] {
  const f = file.toLowerCase()
  if (f.includes('bjs')) return 'bjs'
  return kindOf(file) === 'hc' ? 'high-court-ad' : 'bar-council'
}

export function sha256OfBuffer(buf: Buffer): string {
  return createHash('sha256').update(buf as BinaryLike).digest('hex')
}

function readPackFile(abs: string, file: string, local: boolean): CareerFsPack | null {
  if (!existsSync(abs)) return null
  const buf = readFileSync(abs)
  const st = statSync(abs)
  return {
    id: file.replace(/\.json$/i, ''),
    file,
    hash: sha256OfBuffer(buf),
    size: st.size,
    kind: kindOf(file),
    packId: packIdOf(file),
    local,
  }
}

/** Resolve a pack filename from data/career/packs then public/career. */
export function resolveCareerFile(fileId: string): { abs: string; file: string } | null {
  const raw = fileId.endsWith('.json') ? fileId : `${fileId}.json`
  if (!SAFE_FILE.test(raw)) return null
  const dataAbs = join(PACKS_DIR, raw)
  if (existsSync(dataAbs)) return { abs: dataAbs, file: raw }
  const publicAbs = join(PUBLIC_DIR, raw)
  if (existsSync(publicAbs)) return { abs: publicAbs, file: raw }
  return null
}

export function readCareerFileBytes(fileId: string): { bytes: Buffer; file: string; hash: string } | null {
  const hit = resolveCareerFile(fileId)
  if (!hit) return null
  const bytes = readFileSync(hit.abs)
  return { bytes, file: hit.file, hash: sha256OfBuffer(bytes) }
}

function listDirJson(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => f.endsWith('.json') && SAFE_FILE.test(f))
}

/**
 * Manifest from filesystem. Does not touch Postgres.
 * Prefer data/career/manifest.json when present; else scan packs dirs.
 */
export function filesystemCareerManifest(): {
  source: 'filesystem'
  localPct: 20
  remotePct: 80
  packs: CareerFsPack[]
} {
  const manifestPath = join(DATA_DIR, 'manifest.json')
  if (existsSync(manifestPath)) {
    try {
      const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as { packs?: CareerFsPack[] }
      if (Array.isArray(parsed.packs) && parsed.packs.length) {
        return {
          source: 'filesystem',
          localPct: 20,
          remotePct: 80,
          packs: parsed.packs,
        }
      }
    } catch {
      /* fall through to scan */
    }
  }

  const seen = new Set<string>()
  const packs: CareerFsPack[] = []
  for (const dir of [PACKS_DIR, PUBLIC_DIR]) {
    for (const file of listDirJson(dir)) {
      if (seen.has(file)) continue
      const row = readPackFile(join(dir, file), file, false)
      if (!row) continue
      seen.add(file)
      packs.push(row)
    }
  }
  packs.sort((a, b) => a.id.localeCompare(b.id))
  return { source: 'filesystem', localPct: 20, remotePct: 80, packs }
}
