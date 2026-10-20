/**
 * Quote official English section text already cached from bdlaws HTML
 * into Law Daily TOC addenda. No invented statute. Not a full BN dump.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const cacheDir = join(here, 'official-cache')
const outPath = join(here, '..', '..', 'mobile', 'lib', 'core', 'law', 'practice_official_en.dart')

const ACTS: Record<string, { file: string; url: string; nums: string[] }> = {
  penal: {
    file: 'bdlaws.minlaw.gov.bd_act-details-11.html_lang_en.txt',
    url: 'https://bdlaws.minlaw.gov.bd/act-details-11.html',
    nums: [
      '96', '99', '100', '107', '108', '148', '299', '300', '304', '304A',
      '324', '326', '341', '352', '364', '365', '378', '411', '384', '392',
      '409', '447', '448', '452', '468', '471', '509',
    ],
  },
  crpc: {
    file: 'bdlaws.minlaw.gov.bd_act-details-75.html_lang_en.txt',
    url: 'https://bdlaws.minlaw.gov.bd/act-details-75.html',
    nums: [
      '54', '54A', '162', '241', '242', '265A', '339C', '345', '410', '417',
      '435', '436', '439', '439A', '561A',
    ],
  },
  cpc: {
    file: 'bdlaws.minlaw.gov.bd_act-details-86.html_lang_en.txt',
    url: 'https://bdlaws.minlaw.gov.bd/act-details-86.html',
    nums: ['9', '20', '26', '33', '80', '89A', '104', '107', '148', '149', '152'],
  },
  evid: {
    file: 'bdlaws.minlaw.gov.bd_act-details-24.html_lang_en.txt',
    url: 'https://bdlaws.minlaw.gov.bd/act-details-24.html',
    nums: [
      '26', '45A', '62', '63', '64', '65B', '79', '90', '103', '104', '105',
      '115', '135', '136', '141', '142',
    ],
  },
}

function stripHtml(html: string): string {
  const parts: string[] = []
  let inTag = false
  const max = Math.min(html.length, 2_000_000)
  for (let i = 0; i < max; i++) {
    const c = html[i]
    if (c === '<') inTag = true
    else if (c === '>') inTag = false
    else if (!inTag) parts.push(c)
  }
  return parts
    .join('')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function extractOneSection(text: string, num: string): string {
  const needles = [
    new RegExp(`(^|[^0-9A-Za-z])${num}\\.(?!\\d)`, 'm'),
    new RegExp(`(^|[^0-9A-Za-z])\\[${num}\\.`, 'm'),
  ]
  for (const re of needles) {
    const m = re.exec(text)
    if (!m || m.index == null) continue
    const start = m.index + (m[1] ? m[1].length : 0)
    let slice = text.slice(start, start + 2500)
    const next = slice.slice(Math.min(50, slice.length)).search(/ (?<![0-9])[1-9]\d{1,2}[A-C]?\.(?!\d)/)
    if (next >= 0) slice = slice.slice(0, 50 + next)
    slice = slice
      .replace(/&nbsp;/gi, ' ')
      .replace(/&rsquo;/gi, "'")
      .replace(/&lsquo;/gi, "'")
      .replace(/&ldquo;/gi, '"')
      .replace(/&rdquo;/gi, '"')
      .replace(/&ndash;/gi, '–')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
    if (slice.length > 1400) slice = `${slice.slice(0, 1400).trim()}…`
    if (slice.length >= 80) return slice
  }
  return ''
}

function dartRaw(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/'''/g, "'''")
}

function dartKey(num: string): string {
  return num.replace(/A$/i, 'A').replace(/B$/i, 'B').replace(/C$/i, 'C')
}

const found: Record<string, Record<string, string>> = {}
const summary: Record<string, { found: number; missing: string[] }> = {}

for (const [act, spec] of Object.entries(ACTS)) {
  const p = join(cacheDir, spec.file)
  found[act] = {}
  const missing: string[] = []
  if (!existsSync(p)) {
    summary[act] = { found: 0, missing: spec.nums }
    continue
  }
  const text = stripHtml(readFileSync(p, 'utf8'))
  for (const num of spec.nums) {
    const body = extractOneSection(text, num)
    if (body.length >= 80) found[act][dartKey(num)] = body
    else missing.push(num)
  }
  summary[act] = { found: Object.keys(found[act]).length, missing }
}

let dart = `/// Official English extracts from cached bdlaws act-details HTML (14 Sep 2026).
/// Not a full Bangla dump. Not lawyer-verified. Do not edit by hand — regenerate
/// with webapp/scripts/fill-law-daily-official-en.ts
library;

`

function emitMap(name: string, rows: Record<string, string>) {
  dart += `const ${name} = <String, String>{\n`
  for (const [k, v] of Object.entries(rows)) {
    dart += `  ${JSON.stringify(k)}: r'''${dartRaw(v)}''',\n`
  }
  dart += '};\n\n'
}

emitMap('kOfficialEnPenal', found.penal)
emitMap('kOfficialEnCrpc', found.crpc)
emitMap('kOfficialEnCpc', found.cpc)
emitMap('kOfficialEnEvid', found.evid)

writeFileSync(outPath, dart, 'utf8')
console.error(JSON.stringify({ outPath, summary }, null, 2))
