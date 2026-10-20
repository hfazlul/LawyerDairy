/**
 * Copy unique remote career JSON into webapp/data/career/packs
 * and write manifest.json (sha256 + size). Does not rewrite lesson bodies.
 */
import { createHash, type BinaryLike } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALL_BAR_BATCHES, APK_BAR_BATCHES } from '../src/lib/career-fs'

const here = dirname(fileURLToPath(import.meta.url))
const webappRoot = join(here, '..')
const repoRoot = join(webappRoot, '..')
const packsDir = join(webappRoot, 'data', 'career', 'packs')
const manifestPath = join(webappRoot, 'data', 'career', 'manifest.json')
const srcCareer = join(repoRoot, 'mobile', 'assets', 'career')

function sha256File(abs: string): string {
  return createHash('sha256').update(readFileSync(abs) as BinaryLike).digest('hex')
}

type Pack = {
  id: string
  file: string
  hash: string
  size: number
  kind: 'lesson' | 'mcq' | 'hc'
  packId: 'bar-council' | 'high-court-ad' | 'bjs'
  local: boolean
}

function copyOne(srcName: string, kind: Pack['kind'], packId: Pack['packId'], local: boolean): Pack | null {
  const src = join(srcCareer, srcName)
  if (!existsSync(src)) {
    console.warn('missing', srcName)
    return null
  }
  mkdirSync(packsDir, { recursive: true })
  const dest = join(packsDir, srcName)
  copyFileSync(src, dest)
  return {
    id: srcName.replace(/\.json$/i, ''),
    file: srcName,
    hash: sha256File(dest),
    size: statSync(dest).size,
    kind,
    packId,
    local,
  }
}

const packs: Pack[] = []

for (const n of ALL_BAR_BATCHES) {
  const local = (APK_BAR_BATCHES as readonly string[]).includes(n)
  if (local) continue
  const row = copyOne(`bar_batch_${n}.json`, 'lesson', 'bar-council', false)
  if (row) packs.push(row)
}

const hc = copyOne('hc_canonical.json', 'hc', 'high-court-ad', false)
if (hc) packs.push(hc)
const drills = copyOne('hc_permission_drills.json', 'hc', 'high-court-ad', false)
if (drills) packs.push(drills)
const drafting = copyOne('hc_drafting_syllabus_v1.json', 'hc', 'high-court-ad', false)
if (drafting) packs.push(drafting)
const hcUserWritten = copyOne('hc_user_written_2024_2025.json', 'hc', 'high-court-ad', false)
if (hcUserWritten) packs.push(hcUserWritten)
const hcWritten2016 = copyOne('hc_written_2016_2017.json', 'hc', 'high-court-ad', false)
if (hcWritten2016) packs.push(hcWritten2016)
const hcWritten2023 = copyOne('hc_written_2023.json', 'hc', 'high-court-ad', false)
if (hcWritten2023) packs.push(hcWritten2023)
for (const bjsFile of ['bjs_mcq_03_10.json', 'bjs_mcq_11_16.json', 'bjs_written_user_v1.json'] as const) {
  const kind = bjsFile.includes('mcq') ? 'mcq' : 'lesson'
  const row = copyOne(bjsFile, kind, 'bjs', false)
  if (row) packs.push(row)
}

packs.sort((a, b) => a.id.localeCompare(b.id))

const body = {
  generatedAt: '2026-09-13',
  localPct: 20,
  remotePct: 80,
  note: 'Remote ~80%. APK keeps start-here + shells + syllabus + batches 002/004/008/041 + hc_essential_v1 + hc drills/drafting + user HC written 2016/17/23/24/25. Bulky BJS MCQ/written remote. Bar MCQ 2026 + 2012–23 PDF years = bar_batch_047–053 remote. Bar written 2026 = bar_batch_046 remote.',
  apkBarBatches: [...APK_BAR_BATCHES],
  packs,
}

mkdirSync(dirname(manifestPath), { recursive: true })
writeFileSync(manifestPath, `${JSON.stringify(body, null, 2)}\n`)
console.log(`wrote ${packs.length} remote packs → ${manifestPath}`)
