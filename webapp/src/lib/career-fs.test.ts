import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  APK_BAR_BATCHES,
  filesystemCareerManifest,
  readCareerFileBytes,
  remoteBarBatches,
  resolveCareerFile,
} from './career-fs'

test('remote bar batches are the 80% slice (not APK 002/004/008)', () => {
  const remote = remoteBarBatches()
  assert.equal(remote.includes('002'), false)
  assert.equal(remote.includes('004'), false)
  assert.equal(remote.includes('008'), false)
  assert.ok(remote.includes('003'))
  assert.ok(remote.includes('025'))
  assert.ok(remote.includes('039'))
  assert.ok(remote.includes('040'))
  assert.ok(remote.includes('042'))
  assert.ok(remote.includes('044'))
  assert.ok(remote.includes('045'))
  assert.ok(remote.includes('046'))
  assert.ok(remote.includes('047'))
  assert.ok(remote.includes('053'))
  assert.equal(remote.includes('041'), false)
  assert.equal(remote.length, 48)
  assert.deepEqual([...APK_BAR_BATCHES], ['002', '004', '008', '041'])
})

test('filesystem manifest lists remote packs with hash size kind', () => {
  const fs = filesystemCareerManifest()
  assert.equal(fs.localPct, 20)
  assert.equal(fs.remotePct, 80)
  assert.ok(fs.packs.length >= 21, `expected remote packs, got ${fs.packs.length}`)
  for (const p of fs.packs) {
    assert.ok(p.id)
    assert.ok(p.file.endsWith('.json'))
    assert.equal(p.hash.length, 64)
    assert.ok(p.size > 0)
    assert.ok(['lesson', 'mcq', 'hc'].includes(p.kind))
    assert.equal(p.local, false)
  }
  assert.ok(fs.packs.some((p) => p.id === 'hc_canonical' && p.kind === 'hc'))
  assert.equal(fs.packs.some((p) => p.id === 'bar_batch_002'), false)
})

test('career file bytes resolve without postgres', () => {
  const hit = readCareerFileBytes('bar_batch_003')
  assert.ok(hit)
  assert.equal(hit!.hash.length, 64)
  const resolved = resolveCareerFile('bar_batch_003.json')
  assert.ok(resolved && existsSync(resolved.abs))
  const manifestPath = join(process.cwd(), 'data', 'career', 'manifest.json')
  assert.equal(existsSync(manifestPath), true)
  const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as { packs: { id: string }[] }
  assert.ok(parsed.packs.length >= 21)
})

test('unique Bar syllabus topics have non-shell LESSON bodies (134/134)', () => {
  const careerDir = join(process.cwd(), '..', 'mobile', 'assets', 'career')
  const syllabus = JSON.parse(readFileSync(join(careerDir, 'bar_syllabus_compact.json'), 'utf8')) as {
    subjects: { topic_id: string }[]
  }
  const syllabusIds = new Set(syllabus.subjects.map((s) => s.topic_id).filter(Boolean))
  assert.equal(syllabusIds.size, 134)

  const filled = new Set<string>()
  const files = readdirSync(careerDir).filter(
    (f) => f.startsWith('bar_batch_') || f === 'bar_start_here.json' || f === 'bar_essential_v1.json',
  )
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(careerDir, file), 'utf8')) as {
      assets?: { asset_type?: string; is_shell?: boolean; topic_id?: string }[]
    }
    for (const asset of data.assets ?? []) {
      if (String(asset.asset_type || '').toUpperCase() !== 'LESSON') continue
      if (asset.is_shell === true) continue
      const tid = String(asset.topic_id || '')
      if (syllabusIds.has(tid)) filled.add(tid)
    }
  }
  const missing = [...syllabusIds].filter((id) => !filled.has(id))
  assert.deepEqual(missing, [])
  assert.equal(filled.size, 134)
  assert.ok(filled.has('T-ETH-02'))
})

test('HC user-supplied written 2024/2025 exists as reported questions, not official PDF', () => {
  const file = join(
    process.cwd(),
    '..',
    'mobile',
    'assets',
    'career',
    'hc_user_written_2024_2025.json',
  )
  assert.equal(existsSync(file), true)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
    official_past_papers?: number
    hc_mcq_invented?: boolean
    assets?: { content_id?: string; exam_year?: string; question_origin?: string; section_id?: string }[]
  }
  assert.equal(parsed.official_past_papers, 0)
  assert.equal(parsed.hc_mcq_invented, false)
  assert.equal((parsed.assets ?? []).length, 12)
  assert.ok((parsed.assets ?? []).every((a) => a.section_id === 'SEC-PREVQ'))
  assert.ok((parsed.assets ?? []).every((a) => a.question_origin === 'AUTHENTIC_REPORTED_QUESTION'))
  assert.ok((parsed.assets ?? []).some((a) => a.content_id === 'HC-WQ-US-2024-01' && a.exam_year === '2024'))
  assert.ok((parsed.assets ?? []).some((a) => a.content_id === 'HC-WQ-US-2025-06' && a.exam_year === '2025'))
})

test('web-photo HC written 2016/2017 exists as reported questions, not official PDF', () => {
  const file = join(
    process.cwd(),
    '..',
    'mobile',
    'assets',
    'career',
    'hc_written_2016_2017.json',
  )
  assert.equal(existsSync(file), true)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
    official_past_papers?: number
    hc_mcq_invented?: boolean
    assets?: { content_id?: string; exam_year?: string; question_origin?: string; section_id?: string; content_source?: string }[]
  }
  assert.equal(parsed.official_past_papers, 0)
  assert.equal(parsed.hc_mcq_invented, false)
  assert.equal((parsed.assets ?? []).length, 12)
  assert.ok((parsed.assets ?? []).every((a) => a.section_id === 'SEC-PREVQ'))
  assert.ok((parsed.assets ?? []).every((a) => a.question_origin === 'AUTHENTIC_REPORTED_QUESTION'))
  assert.ok((parsed.assets ?? []).every((a) => a.content_source === 'web-photo-ocr'))
  assert.ok((parsed.assets ?? []).some((a) => a.content_id === 'HC-WQ-WEB-2016-01' && a.exam_year === '2016'))
  assert.ok((parsed.assets ?? []).some((a) => a.content_id === 'HC-WQ-WEB-2017-06' && a.exam_year === '2017'))
})

test('BJS hub stays APK-local; bulky user MCQ/written are remote 80%', () => {
  const fs = filesystemCareerManifest()
  assert.equal(fs.packs.some((p) => p.id === 'bjs_hub_v1'), false)
  assert.ok(fs.packs.some((p) => p.id === 'bjs_mcq_03_10' && p.packId === 'bjs'))
  assert.ok(fs.packs.some((p) => p.id === 'bjs_mcq_11_16' && p.packId === 'bjs'))
  assert.ok(fs.packs.some((p) => p.id === 'bjs_written_user_v1' && p.packId === 'bjs'))
  const file = join(process.cwd(), '..', 'mobile', 'assets', 'career', 'bjs_hub_v1.json')
  assert.equal(existsSync(file), true)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
    official_past_papers?: number
    ain_prokash_copied?: boolean
    assets?: { asset_type?: string; content_id?: string; question_origin?: string }[]
  }
  assert.equal(parsed.official_past_papers, 0)
  assert.equal(parsed.ain_prokash_copied, false)
  const assets = parsed.assets ?? []
  assert.equal(assets.filter((a) => a.asset_type === 'MCQ').length, 5)
  assert.ok(assets.some((a) => a.asset_type === 'SHARED_LESSON'))
  assert.ok(assets.some((a) => a.content_id === 'BJS-WQ-PRACTICE-001'))
  assert.ok(
    assets
      .filter((a) => a.asset_type === 'MCQ' || a.asset_type === 'WRITTEN_QUESTION')
      .every((a) => a.question_origin === 'ORIGINAL_PRACTICE'),
  )
})

test('user-supplied HC written 2023 is PREVQ with no invented MCQ', () => {
  const file = join(process.cwd(), '..', 'mobile', 'assets', 'career', 'hc_written_2023.json')
  assert.equal(existsSync(file), true)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
    official_past_papers?: number
    hc_mcq_invented?: boolean
    assets?: { content_id?: string; exam_year?: string; question_origin?: string; section_id?: string; asset_type?: string }[]
  }
  assert.equal(parsed.official_past_papers, 0)
  assert.equal(parsed.hc_mcq_invented, false)
  assert.equal((parsed.assets ?? []).length, 6)
  assert.ok((parsed.assets ?? []).every((a) => a.section_id === 'SEC-PREVQ'))
  assert.ok((parsed.assets ?? []).every((a) => a.question_origin === 'AUTHENTIC_REPORTED_QUESTION'))
  assert.ok((parsed.assets ?? []).every((a) => a.asset_type === 'WRITTEN_QUESTION'))
  assert.ok((parsed.assets ?? []).every((a) => a.exam_year === '2023'))
  assert.ok((parsed.assets ?? []).some((a) => a.content_id === 'HC-WQ-US-2023-01'))
})

test('HC permission drills file is practice-only PREVQ, not fake past papers', () => {
  const file = join(process.cwd(), '..', 'mobile', 'assets', 'career', 'hc_permission_drills.json')
  assert.equal(existsSync(file), true)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
    official_past_papers?: number
    assets?: { question_origin?: string; section_id?: string }[]
  }
  assert.equal(parsed.official_past_papers, 0)
  assert.ok((parsed.assets ?? []).some((a) => a.section_id === 'SEC-PREVQ'))
  assert.equal(
    (parsed.assets ?? []).some((a) => a.question_origin === 'AUTHENTIC_PREVIOUS'),
    false,
  )
})
