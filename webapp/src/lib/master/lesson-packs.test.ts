import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { courtUid, uniqueCourtUid } from '../court-uid'
import {
  loadCanonicalMaster,
  resolveBarDatasetRoot,
  resolveBarExtraBatchFiles,
  resolveCaseMasterPath,
  resolveHcDatasetPath,
  uniqueHcDataset,
} from './pack-paths'
import { ethicsSraLabel, LOCKED_BAR_SECTIONS, LOCKED_HC_SECTIONS } from './career-coverage'

function load(p: string) {
  return JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>
}

function tryResolve(fn: () => string): string | null {
  try {
    return fn()
  } catch {
    return null
  }
}

const masterPath = tryResolve(resolveCaseMasterPath)
const barRoot = tryResolve(resolveBarDatasetRoot)
const hcPath = tryResolve(resolveHcDatasetPath)

describe('case master pack v1.2.3', { skip: !masterPath }, () => {
  it('resolves asset10 (no-s) master, not the older assets3 path', () => {
    assert.match(masterPath!.replace(/\\/g, '/'), /asset10[\\/].*bangladesh_lawyer_diary_master\.json/)
  })

  it('never uses positional court_id as uid and keeps 254 unique benches', () => {
    const data = loadCanonicalMaster()
    const meta = data.metadata as Record<string, unknown>
    assert.equal(meta.dataset_version, '1.2.3')
    const courts = data.courts as Record<string, unknown>[]
    assert.equal(courts.length, 254)
    assert.equal((data.court_types as unknown[]).length, 34)
    assert.equal((data.acts as unknown[]).length, 63)
    const seen = new Set<string>()
    for (const row of courts) {
      const uid = uniqueCourtUid(
        {
          court_type_id: String(row.court_type_id),
          metropolitan_id: (row.metropolitan_id as string) || null,
          district_id: (row.district_id as string) || null,
          division_id: (row.division_id as string) || null,
          official_name: (row.official_name as string) || null,
          court_name_en: (row.court_name_en as string) || null,
        },
        seen,
      )
      assert.ok(uid, `missing uid for ${row.court_name_en}`)
      assert.equal(uid.includes('court_00'), false)
      assert.equal(seen.has(uid), false)
      seen.add(uid)
    }
    assert.equal(seen.size, 254)
    assert.ok(
      [...seen].some((u) => u.endsWith('::2')),
      'numbered Labour/Nari benches must get a suffix, not be dropped',
    )
  })

  it('base courtUid stays type::place without court_id', () => {
    assert.equal(
      courtUid({ court_type_id: 'ct_district_sessions_judge', district_id: 'dist_barguna' }),
      'ct_district_sessions_judge::dist_barguna',
    )
  })
})

describe('Bar Council user folders', { skip: !barRoot }, () => {
  it('resolves Barcouncil assets* with data/batches, not Bar-council lesson assets7', () => {
    const root = barRoot!
    assert.match(root.replace(/\\/g, '/'), /Barcouncil assets/)
    assert.equal(root.includes('Bar-council lesson'), false)
    const manifest = load(path.join(root, 'dataset-manifest.json'))
    const syllabus = load(path.join(root, 'data', 'syllabus.json'))
    const sections = (manifest.sections as Record<string, unknown>[]).map((s) => String(s.section_id))
    assert.deepEqual(sections, [...LOCKED_BAR_SECTIONS])
    const batches = (manifest.file_map as Record<string, unknown>).content_batches as string[]
    assert.equal(batches.length, 22)
    for (const rel of batches) {
      assert.equal(existsSync(path.join(root, rel)), true)
    }
    const subjects = (syllabus.subjects as Record<string, unknown>[]) ?? []
    const topics: { moduleId: string; status: string }[] = []
    for (const mod of subjects) {
      for (const t of (mod.topics as Record<string, unknown>[]) ?? []) {
        topics.push({
          moduleId: String(mod.id || mod.module_id),
          status: String(t.content_status || ''),
        })
      }
    }
    assert.equal(topics.length, 134)
    const drafted = topics.filter((t) => t.status === 'LESSON_DRAFTED')
    const pending = topics.filter((t) => t.status === 'PENDING_CONTENT')
    assert.equal(drafted.length, 22)
    assert.equal(pending.length, 112)
    assert.match(ethicsSraLabel(topics), /partial_in_source/)
    let assets = 0
    let pendingReview = 0
    let mcq = 0
    for (const rel of batches) {
      const batch = load(path.join(root, rel))
      assert.equal(batch.status, 'PENDING_REVIEW')
      for (const a of (batch.assets as Record<string, unknown>[]) ?? []) {
        assets++
        if (a.status === 'PENDING_REVIEW') pendingReview++
        if (a.asset_type === 'MCQ') mcq++
      }
    }
    assert.equal(assets, 164)
    assert.equal(pendingReview, 164)
    assert.equal(mcq, 92)
    const extra = resolveBarExtraBatchFiles()
    assert.ok(extra.length >= 2)
    const flagshipExtra = extra.filter((f) => /08-02[45]/.test(f.replace(/\\/g, '/')))
    assert.equal(flagshipExtra.length, 2)
    let extraAssets = 0
    for (const file of flagshipExtra) {
      extraAssets += ((load(file).assets as unknown[]) ?? []).length
    }
    assert.equal(extraAssets, 13)
    assert.ok(extra.some((f) => /2026-09-/.test(f)))
  })
})

describe('High Court unique dataset', { skip: !hcPath }, () => {
  it('keeps locked 12 sections, Permission vs AD split, 95 unique assets, 0 questions, 1 case', () => {
    const file = hcPath!
    assert.match(file.replace(/\\/g, '/'), /bd-hc-ad-dataset/)
    assert.equal(file.includes('high-court lesson assets'), false)
    const raw = load(file)
    const sections = (raw.sections as Record<string, unknown>[]).map((s) => String(s.id || s.section_id))
    assert.deepEqual(sections, [...LOCKED_HC_SECTIONS])
    assert.equal((raw.assets as unknown[]).length, 95)
    assert.equal((raw.questions as unknown[]).length, 0)
    assert.equal((raw.cases as unknown[]).length, 1)
    assert.equal(raw.bar_council_exam_included, false)
    const bySec: Record<string, number> = {}
    for (const a of raw.assets as Record<string, unknown>[]) {
      const sid = String(a.section_id || '')
      bySec[sid] = (bySec[sid] || 0) + 1
      assert.equal(a.status, 'PENDING_REVIEW')
    }
    assert.ok((bySec['SEC-ELIG'] || 0) >= 1)
    assert.ok((bySec['SEC-AD'] || 0) >= 1)
    assert.equal(bySec['SEC-ELIG'] === bySec['SEC-AD'] && sections.indexOf('SEC-ELIG') === sections.indexOf('SEC-AD'), false)
    assert.ok(sections.indexOf('SEC-ELIG') < sections.indexOf('SEC-AD'))
    assert.equal(bySec['SEC-PREVQ'] || 0, 0)
    const unique = uniqueHcDataset()
    assert.equal(unique.uniqueHashes, 1)
    assert.ok(unique.copies >= 1)
  })
})

it('courtUid formula never uses positional court_id', () => {
  assert.equal(
    courtUid({ court_type_id: 'ct_district_sessions_judge', district_id: 'dist_barguna' }),
    'ct_district_sessions_judge::dist_barguna',
  )
  assert.equal(
    courtUid({
      court_type_id: 'ct_labour_court',
      metropolitan_id: 'metro_dhaka',
      instanceKey: '2',
    }).includes('court_'),
    false,
  )
})

it('ethicsSraLabel is empty until a drafted topic exists', () => {
  assert.equal(
    ethicsSraLabel([
      { moduleId: 'BC-MOD-SRA', status: 'PENDING_CONTENT' },
      { moduleId: 'BC-MOD-ETHICS', status: 'PENDING_CONTENT' },
    ]),
    'empty_in_source',
  )
})
