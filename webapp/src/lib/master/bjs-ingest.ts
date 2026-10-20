import { createHash, type BinaryLike } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { repoRoot } from '@/lib/master/pack-paths'

type Json = Record<string, unknown>

export async function ingestBjsContent() {
  const files = [
    join(repoRoot(), 'mobile', 'assets', 'career', 'bjs_hub_v1.json'),
    join(repoRoot(), 'mobile', 'assets', 'career', 'bjs_mcq_03_10.json'),
    join(repoRoot(), 'mobile', 'assets', 'career', 'bjs_mcq_11_16.json'),
    join(repoRoot(), 'mobile', 'assets', 'career', 'bjs_written_user_v1.json'),
  ]
  const assets: Json[] = []
  const shas: string[] = []
  for (const file of files) {
    if (!existsSync(file)) continue
    const raw = JSON.parse(readFileSync(file, 'utf8')) as Json
    shas.push(createHash('sha256').update(readFileSync(file) as BinaryLike).digest('hex'))
    for (const a of (raw.assets as Json[]) ?? []) {
      const id = String(a.content_id || a.id || '')
      if (!id || assets.some((x) => String(x.content_id || x.id) === id)) continue
      assets.push(a)
    }
  }
  if (!assets.length) return { skipped: true as const, assets: 0 }

  const checksum = createHash('sha256').update(shas.sort().join('|')).digest('hex')
  const packVersion = `bjs-2026.09.16-${assets.length}`

  await prisma.contentPack.upsert({
    where: { id: 'bjs' },
    create: {
      id: 'bjs',
      hub: 'bjs',
      titleBn: 'বিজেএস / জুডিশিয়াল সার্ভিস',
      titleEn: 'BJS / Judicial Service',
      version: packVersion,
      publishedAt: null,
      isCurrent: true,
      checksum,
    },
    update: { isCurrent: true, version: packVersion, publishedAt: null, checksum },
  })

  await prisma.contentItem.deleteMany({ where: { packId: 'bjs' } })

  let order = 0
  for (const asset of assets) {
    const id = String(asset.content_id || asset.id || `bjs-asset-${order}`)
    if (!id) continue
    await prisma.contentItem.create({
      data: {
        id,
        packId: 'bjs',
        itemType: String(asset.asset_type || asset.type || 'LESSON'),
        moduleId: String(asset.module_id || ''),
        topicId: String(asset.topic_id || ''),
        sortOrder: order++,
        status: String(asset.status || 'PENDING_REVIEW'),
        payload: asset as object,
        source: String(asset.official_url || asset.source || ''),
      },
    })
  }

  return {
    assets: assets.length,
    checksum,
    officialPastPapers: 0,
    ainProkashCopied: false,
  }
}
