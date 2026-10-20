/**
 * Apply Bangla/English model answers onto existing written assets.
 * Does not add years or invent missing question numbers.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const mobileDir = join(repo, 'mobile', 'assets', 'career')
const fillsDir = join(here, 'written-fills')

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))]
}

function applyWritten(asset, fill) {
  if (fill.skip) {
    asset.flags = uniq([...(asset.flags || []), fill.flag || 'stem_unrecoverable'])
    asset.answer_note = fill.note || asset.answer_note
    asset.flag_note = [asset.flag_note, fill.note].filter(Boolean).join(' | ')
    return 'skip'
  }
  const bn = asset.language_versions?.bn
  const en = asset.language_versions?.en
  if (!bn) return 'missing-loc'
  const outline = fill.outline || []
  if (fill.english) {
    bn.model_answer = fill.en || fill.bn
    if (en) en.model_answer = fill.en || fill.bn
    bn.answer_outline = outline
    bn.prep_outline = outline
    if (en) en.answer_outline = fill.outlineEn || outline
  } else {
    bn.model_answer = fill.bn
    if (en) en.model_answer = fill.en || fill.bn
    if (outline.length) {
      bn.answer_outline = outline
      bn.prep_outline = outline
      if (en) {
        en.answer_outline = fill.outlineEn || outline
      }
    }
  }
  asset.answer_type = 'MODEL'
  asset.flags = uniq([...(asset.flags || []), 'statute_fill'])
  if (fill.note) {
    asset.answer_note = fill.note
    asset.flag_note = [asset.flag_note, fill.note].filter(Boolean).join(' | ')
  }
  return 'fill'
}

const FILLS = {}
if (existsSync(fillsDir)) {
  for (const name of readdirSync(fillsDir).filter((f) => f.endsWith('.mjs'))) {
    const mod = await import(`./written-fills/${name}`)
    Object.assign(FILLS, mod.FILLS || mod.default || {})
  }
}

const fileFor = {}
const packs = [
  'bar_batch_043.json',
  'bar_batch_044.json',
  'bar_batch_045.json',
  'bar_batch_046.json',
  'hc_written_2016_2017.json',
  'hc_written_2023.json',
  'hc_user_written_2024_2025.json',
  'bjs_written_user_v1.json',
]

const stats = { fill: 0, skip: 0, missingLoc: 0, unused: [] }

for (const file of packs) {
  const abs = join(mobileDir, file)
  const data = JSON.parse(readFileSync(abs, 'utf8'))
  let n = 0
  for (const asset of data.assets || []) {
    fileFor[asset.content_id] = file
    const fill = FILLS[asset.content_id]
    if (!fill) continue
    const r = applyWritten(asset, fill)
    if (r === 'fill') stats.fill++
    else if (r === 'skip') stats.skip++
    else stats.missingLoc++
    n++
  }
  writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`)
  console.log('wrote', file, 'applied', n)
}

for (const id of Object.keys(FILLS)) {
  if (!fileFor[id]) stats.unused.push(id)
}

const emptyAfter = []
for (const file of packs) {
  const data = JSON.parse(readFileSync(join(mobileDir, file), 'utf8'))
  for (const a of data.assets || []) {
    const ma = a.language_versions?.bn?.model_answer
    if (!String(ma || '').trim()) emptyAfter.push(a.content_id)
  }
}
console.log(JSON.stringify({ ...stats, stillEmpty: emptyAfter.length, fillsLoaded: Object.keys(FILLS).length }, null, 2))
