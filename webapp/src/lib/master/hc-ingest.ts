import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { uniqueHcDataset, repoRoot } from '@/lib/master/pack-paths'

type Json = Record<string, unknown>

function sectionStatus(raw: Json, sectionId: string): string {
  const build = (raw.build_status || {}) as Json
  const populated = Array.isArray(build.sections_populated) ? build.sections_populated.map(String) : []
  const partial = Array.isArray(build.sections_partial) ? build.sections_partial.map(String) : []
  const pilot = Array.isArray(build.sections_pilot_only) ? build.sections_pilot_only.map(String) : []
  const empty = Array.isArray(build.sections_not_started) ? build.sections_not_started.map(String) : []
  if (empty.includes(sectionId)) return 'NOT_STARTED'
  if (pilot.includes(sectionId)) return 'PILOT_ONLY'
  if (partial.includes(sectionId)) return 'PARTIAL'
  if (populated.includes(sectionId)) return 'POPULATED_PENDING_REVIEW'
  return 'draft'
}

export async function ingestHighCourtContent() {
  const unique = uniqueHcDataset()
  const file = unique.path
  let raw: Json
  try {
    raw = JSON.parse(readFileSync(file, 'utf8')) as Json
  } catch {
    return { skipped: true }
  }

  const assets: Json[] = [...((raw.assets as Json[]) ?? [])]
  const extraHc = [
    join(repoRoot(), 'mobile', 'assets', 'career', 'hc_permission_drills.json'),
    join(repoRoot(), 'mobile', 'assets', 'career', 'hc_drafting_syllabus_v1.json'),
    join(repoRoot(), 'mobile', 'assets', 'career', 'hc_user_written_2024_2025.json'),
    join(repoRoot(), 'mobile', 'assets', 'career', 'hc_written_2016_2017.json'),
    join(repoRoot(), 'mobile', 'assets', 'career', 'hc_written_2023.json'),
  ]
  for (const extraPath of extraHc) {
    if (!existsSync(extraPath)) continue
    try {
      const extra = JSON.parse(readFileSync(extraPath, 'utf8')) as Json
      for (const a of (extra.assets as Json[]) ?? []) {
        const id = String(a.content_id || a.id || '')
        if (!id || assets.some((x) => String(x.content_id || x.id) === id)) continue
        assets.push(a)
      }
    } catch {
      /* keep unique dataset */
    }
  }
  const packVersion = `hc-2026.09.15-${assets.length}`

  await prisma.contentPack.upsert({
    where: { id: 'high-court-ad' },
    create: {
      id: 'high-court-ad',
      hub: 'high_court_ad',
      titleBn: 'হাইকোর্ট ও আপিল বিভাগ',
      titleEn: 'High Court & Appellate Division',
      version: packVersion,
      publishedAt: null,
      isCurrent: true,
      checksum: unique.sha256,
    },
    update: { isCurrent: true, version: packVersion, publishedAt: null, checksum: unique.sha256 },
  })

  await prisma.contentItem.deleteMany({ where: { packId: 'high-court-ad' } })

  const sections = (raw.sections as Json[]) ?? []
  const modules = (raw.modules as Json[]) ?? []
  const cases = (raw.cases as Json[]) ?? []
  const questions = (raw.questions as Json[]) ?? []

  let order = 0
  for (const sec of sections) {
    const id = String(sec.id || sec.section_id || `hc-sec-${order}`)
    await prisma.contentItem.create({
      data: {
        id: `hc-section-${id}`,
        packId: 'high-court-ad',
        itemType: 'SECTION',
        sectionId: id,
        sortOrder: order++,
        status: String(sec.content_status || sec.status || sectionStatus(raw, id)),
        payload: sec as object,
      },
    })
  }

  for (const mod of modules) {
    const id = String(mod.id || mod.module_id || `hc-mod-${order}`)
    await prisma.contentItem.create({
      data: {
        id: `hc-module-${id}`,
        packId: 'high-court-ad',
        itemType: 'MODULE',
        moduleId: id,
        sectionId: String(mod.section_id || ''),
        sortOrder: order++,
        status: String(mod.status || 'PENDING_REVIEW'),
        payload: mod as object,
      },
    })
  }

  for (const asset of assets) {
    const id = String(asset.content_id || asset.id || `hc-asset-${order}`)
    await prisma.contentItem.create({
      data: {
        id,
        packId: 'high-court-ad',
        itemType: String(asset.asset_type || asset.type || 'ASSET'),
        sectionId: String(asset.section_id || ''),
        moduleId: String(asset.module_id || ''),
        topicId: String(asset.topic_id || ''),
        sortOrder: order++,
        status: String(asset.status || 'PENDING_REVIEW'),
        payload: asset as object,
        source: String(asset.source || ''),
      },
    })
  }

  for (const c of cases) {
    const id = String(c.case_id || c.id || `hc-case-${order}`)
    await prisma.contentItem.create({
      data: {
        id,
        packId: 'high-court-ad',
        itemType: 'CASE_LAW',
        sectionId: 'SEC-CASE',
        sortOrder: order++,
        status: String(c.status || 'PENDING_REVIEW'),
        payload: c as object,
        source: String(c.citation || c.source || ''),
      },
    })
  }

  for (const q of questions) {
    const id = String(q.question_id || q.content_id || q.id || `hc-q-${order}`)
    await prisma.contentItem.create({
      data: {
        id,
        packId: 'high-court-ad',
        itemType: String(q.asset_type || q.type || 'QUESTION'),
        sectionId: String(q.section_id || 'SEC-PREVQ'),
        sortOrder: order++,
        status: String(q.status || 'NOT_VERIFIED'),
        payload: q as object,
      },
    })
  }

  return {
    sections: sections.length,
    modules: modules.length,
    assets: assets.length,
    cases: cases.length,
    questions: questions.length,
    checksum: unique.sha256,
    copiesOnDisk: unique.copies,
    uniqueHashes: unique.uniqueHashes,
  }
}
