import { createHash } from 'crypto'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import {
  fileSha256,
  resolveBarDatasetRoot,
  resolveBarExtraBatchFiles,
  resolveBarShellsPath,
  uniqueJsonFiles,
} from '@/lib/master/pack-paths'

type Json = Record<string, unknown>

function loadJson(filePath: string): Json {
  return JSON.parse(readFileSync(filePath, 'utf8')) as Json
}

function combinedChecksum(shas: string[]): string {
  return createHash('sha256').update(shas.sort().join('|')).digest('hex')
}

function isShellAsset(asset: Json): boolean {
  return asset.is_shell === true || String(asset.content_id || '').includes('-SHELL-')
}

export async function ingestBarCouncilContent() {
  const root = resolveBarDatasetRoot()
  const manifest = loadJson(path.join(root, 'dataset-manifest.json'))
  const syllabus = loadJson(path.join(root, 'data', 'syllabus.json'))
  const startHere = loadJson(path.join(root, 'data', 'start-here.json'))
  const fileMap = (manifest.file_map || {}) as Json
  const batchRels = (fileMap.content_batches as string[]) ?? []
  const uniqueBatches = uniqueJsonFiles([
    ...batchRels.map((rel) => path.join(root, rel)),
    ...resolveBarExtraBatchFiles(),
  ])
  const shellsPath = resolveBarShellsPath()
  const shas = uniqueBatches.map((b) => b.sha256)
  if (shellsPath) shas.push(fileSha256(shellsPath))
  const checksum = combinedChecksum(shas)
  const packVersion = `bar-2026.09.13-${String(manifest.compiled_date || 'pending-review')}`

  await prisma.contentPack.upsert({
    where: { id: 'bar-council' },
    create: {
      id: 'bar-council',
      hub: 'bar_council',
      titleBn: 'বার কাউন্সিল',
      titleEn: 'Bar Council',
      version: packVersion,
      publishedAt: null,
      isCurrent: true,
      checksum,
    },
    update: { isCurrent: true, version: packVersion, publishedAt: null, checksum },
  })

  await prisma.contentItem.deleteMany({ where: { packId: 'bar-council' } })

  await prisma.contentItem.create({
    data: {
      id: 'bc-start-here',
      packId: 'bar-council',
      itemType: 'START_HERE',
      sectionId: 'SEC-START-HERE',
      sortOrder: 0,
      status: 'DELIVERED',
      payload: startHere as object,
    },
  })

  const modules = (syllabus.modules as Json[]) ?? (syllabus.subjects as Json[]) ?? []
  let topicOrder = 0
  let drafted = 0
  let pending = 0
  for (const mod of modules) {
    const moduleId = String(mod.id || mod.module_id || '')
    const topics = (mod.topics as Json[]) ?? []
    for (const t of topics) {
      const topicId = String(t.id || t.topic_id)
      const status = String(t.content_status || t.status || 'PENDING_CONTENT')
      if (/DRAFTED/i.test(status)) drafted++
      if (/PENDING/i.test(status)) pending++
      await prisma.contentItem.create({
        data: {
          id: `bc-topic-${topicId}`,
          packId: 'bar-council',
          itemType: 'TOPIC',
          moduleId,
          topicId,
          sortOrder: topicOrder++,
          status,
          payload: t as object,
        },
      })
    }
  }

  const seenIds = new Set<string>(['bc-start-here'])
  let assetCount = 0
  let fullLessons = 0
  let mcq = 0
  let skippedDupes = 0
  const topicHasFullLesson = new Set<string>()

  for (const batch of uniqueBatches) {
    if (!existsSync(batch.path)) continue
    const data = loadJson(batch.path)
    const batchStatus = String(data.status || 'PENDING_REVIEW')
    const assets = (data.assets as Json[]) ?? []
    for (const asset of assets) {
      const id = String(asset.content_id || asset.lesson_id || asset.id)
      if (!id || seenIds.has(id)) {
        skippedDupes++
        continue
      }
      seenIds.add(id)
      const itemType = String(asset.asset_type || 'LESSON')
      const shell = isShellAsset(asset)
      if (itemType === 'LESSON' && !shell) {
        fullLessons++
        const topicId = String(asset.topic_id || '')
        if (topicId) topicHasFullLesson.add(topicId)
      }
      if (itemType === 'MCQ') mcq++
      await prisma.contentItem.create({
        data: {
          id,
          packId: 'bar-council',
          itemType,
          moduleId: String(asset.module_id || asset.subject_module_id || ''),
          topicId: String(asset.topic_id || ''),
          sortOrder: assetCount++,
          status: String(asset.status || batchStatus || 'PENDING_REVIEW'),
          payload: asset as object,
          source: String(asset.source || batch.path),
        },
      })
    }
  }

  let shells = 0
  if (shellsPath) {
    const shellBatch = loadJson(shellsPath)
    const assets = (shellBatch.assets as Json[]) ?? []
    for (const asset of assets) {
      const topicId = String(asset.topic_id || '')
      if (topicId && topicHasFullLesson.has(topicId)) continue
      const id = String(asset.content_id || asset.id)
      if (!id || seenIds.has(id)) continue
      seenIds.add(id)
      shells++
      await prisma.contentItem.create({
        data: {
          id,
          packId: 'bar-council',
          itemType: 'TOPIC_SHELL',
          moduleId: String(asset.module_id || ''),
          topicId,
          sortOrder: assetCount++,
          status: String(asset.status || 'PENDING_REVIEW'),
          payload: asset as object,
          source: String(asset.official_url || shellsPath),
          sourceUrl: String(asset.official_url || ''),
        },
      })
    }
  }

  return {
    topics: topicOrder,
    drafted,
    pending,
    uniqueBatches: uniqueBatches.length,
    assets: assetCount,
    fullLessons,
    mcq,
    shells,
    skippedDuplicateFiles: skippedDupes,
    checksum,
    coveragePct: topicOrder ? Math.round((fullLessons / topicOrder) * 1000) / 10 : 0,
  }
}
