/**
 * Parse BJS prelim MCQs from the user Word dump (document-text.txt).
 * Does not invent keys. Missing উত্তর → unanswered + flag.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const textPath = join(
  repo,
  'docs',
  'plan',
  'mobile-v3',
  '_inbox',
  'user-2026-09-16-docx',
  'document-text.txt',
)

const BN = '০১২৩৪৫৬৭৮৯'
const KEY = { ক: 'A', খ: 'B', গ: 'C', ঘ: 'D', A: 'A', B: 'B', C: 'C', D: 'D' }

function bnInt(s) {
  const n = [...String(s)]
    .map((c) => {
      const i = BN.indexOf(c)
      return i >= 0 ? String(i) : c
    })
    .join('')
    .replace(/\D/g, '')
  return parseInt(n, 10)
}

function clean(s) {
  return String(s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .trim()
}

const SITTING = [
  {
    sitting: 16,
    year: '2023',
    re: /১৬ তম বিজেএস[^\n]*প্রাথমিক পরীক্ষা[^\n]*/,
    date: '18-03-2023',
  },
  {
    sitting: 15,
    year: '2022',
    re: /১৫ তম বিজেএস[^\n]*প্রাথমিক পরীক্ষা[^\n]*/,
    date: '30-07-2022',
  },
  {
    sitting: 14,
    year: '2021',
    re: /১৪ তম বিজেএস[^\n]*প্রাথমিক পরীক্ষা[^\n]*/,
    date: '25-09-2021',
  },
  {
    sitting: 13,
    year: '2019',
    re: /১৩ তম বিজেএস[^\n]*প্রাথমিক পরীক্ষা[^\n]*/,
    date: '08-11-2019',
  },
  {
    sitting: 12,
    year: null,
    re: /১২ তম বিজেএস[^\n]*প্রাথমিক পরীক্ষা/,
    date: null,
    flags: ['header_year_missing'],
  },
  {
    sitting: 11,
    year: '2017',
    re: /বাংলাদেশ জুডিসিয়াল সার্ভিস \( প্রিলিমিনারী \) পরীক্ষা - ২০১৭/,
    date: null,
  },
  {
    sitting: 10,
    year: '2016',
    re: /১০ম বাংলাদেশ জুডিসিয়াল সার্ভিস \( প্রিলিমিনারী \) পরীক্ষা - ২০১৬/,
    date: null,
  },
  {
    sitting: 9,
    year: '2014',
    re: /৯ম জুডিসিয়াল সার্ভিস প্রিলিমিনারী পরীক্ষা - ২০১৪/,
    date: null,
  },
  {
    sitting: 8,
    year: '2013',
    re: /বাংলাদেশ জুডিসিয়াল সার্ভিস \( প্রিলিমিনারী \) পরীক্ষা - ২০১৩/,
    date: null,
  },
  {
    sitting: 7,
    year: '2012',
    re: /বাংলাদেশ জুডিসিয়াল সার্ভিস \( প্রিলিমিনারী \) পরীক্ষা - ২০১২/,
    date: null,
  },
  {
    sitting: 6,
    year: '2011',
    re: /বাংলাদেশ জুডিসিয়াল সার্ভিস \( প্রিলিমিনারী \) পরীক্ষা - ২০১১/,
    date: null,
  },
  {
    sitting: 5,
    year: '2009',
    re: /বাংলাদেশ জুডিসিয়াল সার্ভিস \( প্রিলিমিনারী \) পরীক্ষা - ২০০৯/,
    date: null,
  },
  {
    sitting: 4,
    year: '2008',
    re: /বাংলাদেশ জুডিসিয়াল সার্ভিস \( প্রিলিমিনারী \) পরীক্ষা - ২০০৮/,
    date: null,
  },
  {
    sitting: 3,
    year: '2007',
    re: /বাংলাদেশ জুডিসিয়াল সার্ভিস \( প্রিলিমিনারী \) পরীক্ষা - ২০০৭/,
    date: null,
  },
]

function splitPapers(text) {
  const hits = []
  for (const spec of SITTING) {
    const re = new RegExp(spec.re.source, spec.re.flags.includes('g') ? spec.re.flags : `${spec.re.flags}g`)
    let m
    while ((m = re.exec(text))) {
      hits.push({ ...spec, at: m.index, header: m[0] })
    }
  }
  hits.sort((a, b) => a.at - b.at)
  const papers = []
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i]
    const key = `${h.sitting}-${h.year || 'x'}`
    const nextDifferent = hits.findIndex((x, j) => j > i && `${x.sitting}-${x.year || 'x'}` !== key)
    const end =
      nextDifferent >= 0
        ? hits[nextDifferent].at
        : text.indexOf('BJS written exam paper 2025 sesh')
    const prev = papers.find((p) => `${p.sitting}-${p.year || 'x'}` === key)
    const body = text.slice(h.at, end > h.at ? end : text.length)
    if (prev) {
      if (body.length > prev.body.length) {
        prev.at = h.at
        prev.header = h.header
        prev.body = body
      }
      continue
    }
    papers.push({ ...h, body })
  }
  return papers
}

function parseInlineOptions(block) {
  const compact = block.replace(/\s+/g, ' ')
  const parts = compact.split(/\(\s*([কখগঘABCD])\s*\)/)
  if (parts.length >= 9) {
    const question = clean(parts[0]).replace(/^[।.\s]+/, '')
    const options = {}
    const keys = ['A', 'B', 'C', 'D']
    let ki = 0
    for (let i = 1; i < parts.length && ki < 4; i += 2) {
      options[keys[ki]] = clean(parts[i + 1] || '')
        .replace(/^[।.\s]+/, '')
        .replace(/[।.\s]+$/, '')
      ki += 1
    }
    if (options.A && options.B && options.C && options.D) {
      return { question, options, style: 'paren' }
    }
  }
  const spaced = compact.split(/(?:^|\s)([কখগঘ])\s*[.।]\s*/)
  if (spaced.length >= 9) {
    const question = clean(spaced[0])
    const options = {}
    const keys = ['A', 'B', 'C', 'D']
    let ki = 0
    for (let i = 1; i < spaced.length && ki < 4; i += 2) {
      options[keys[ki]] = clean(spaced[i + 1] || '').replace(/[।.\s]+$/, '')
      ki += 1
    }
    if (options.A && options.B && options.C && options.D) {
      return { question, options, style: 'dotted' }
    }
  }
  return null
}

function extractAnswer(block) {
  const m =
    block.match(/উত্তরঃ?\s*[-:]?\s*\(?\s*([কখগঘABCD])\s*\)?/) ||
    block.match(/Answer\s*[:：]?\s*\(?\s*([কখগঘABCD])\s*\)?/i)
  if (!m) return { key: null, cite: '' }
  const after = block.slice(m.index + m[0].length)
  const cite = clean(after).slice(0, 400)
  return { key: KEY[m[1]] || null, cite }
}

function questionHits(body) {
  const re =
    /(?:^|\n)\s*(?:০?([০-৯]{1,3})|0?(\d{1,3}))\s*[.।'"″|]\s+/g
  const hits = []
  let m
  while ((m = re.exec(body))) {
    const n = m[1] ? bnInt(m[1]) : parseInt(m[2], 10)
    if (!Number.isFinite(n) || n < 1 || n > 100) continue
    hits.push({ n, start: m.index + (m[0][0] === '\n' ? 1 : 0), endPrefix: m.index + m[0].length })
  }
  return hits
}

function parseLineOptions(text) {
  const options = {}
  const map = { ক: 'A', খ: 'B', গ: 'C', ঘ: 'D' }
  const re = /(?:^|\n)\s*([কখগঘ])(?:\s*[.।:]|\s+)([^\n]+)/g
  let m
  while ((m = re.exec(text))) {
    const k = map[m[1]]
    if (!k || options[k]) continue
    const val = clean(m[2]).replace(/^[।.\s]+/, '').replace(/[।.\s]+$/, '')
    if (val && !/^উত্তর/.test(val)) options[k] = val
  }
  if (options.A && options.B && options.C && options.D) {
    return { options, style: 'lines' }
  }
  return null
}

function parsePaper(paper) {
  const hits = questionHits(paper.body)
  const items = []
  const seenN = new Set()
  for (let i = 0; i < hits.length; i++) {
    const { n, endPrefix } = hits[i]
    if (seenN.has(n)) continue
    const end = i + 1 < hits.length ? hits[i + 1].start : paper.body.length
    const block = paper.body.slice(endPrefix, end).trim()
    if (block.length < 8) continue
    seenN.add(n)
    const ans = extractAnswer(block)
    const ansAt = block.search(/উত্তরঃ?|Answer\s*[:：]/i)
    const before = ansAt >= 0 ? block.slice(0, ansAt).trim() : block
    const after = ansAt >= 0 ? block.slice(ansAt).trim() : ''
    const parsed =
      parseInlineOptions(before) ||
      parseInlineOptions(block) ||
      (parseLineOptions(after) ? { question: clean(before), ...parseLineOptions(after) } : null) ||
      (parseLineOptions(before) ? { question: clean(before.replace(/(?:^|\n)\s*[কখগঘ](?:\s*[.।:]|\s+).*/s, '')), ...parseLineOptions(before) } : null)
    const flags = [...(paper.flags || [])]
    if (!parsed || !parsed.options?.A) flags.push('options_unparsed')
    if (!ans.key) flags.push('answer_unreadable')
    if (parsed && /ক\s*\.\s*ক|ঘ\s*\.\s*ক/.test(block)) flags.push('messy_option_labels')
    const question = parsed?.question ? parsed.question : clean(before).slice(0, 800)
    items.push({
      n,
      sitting: paper.sitting,
      year: paper.year,
      date: paper.date,
      question,
      options: parsed?.options || { A: '', B: '', C: '', D: '' },
      correctKey: ans.key,
      cite: ans.cite.replace(/^[-–—.]\s*/, '').replace(/^\[/, '').slice(0, 500),
      flags,
      rawPreview: clean(block).slice(0, 160),
    })
  }
  return items
}

const text = readFileSync(textPath, 'utf8')
const papers = splitPapers(text)
const report = []
const all = []
for (const p of papers) {
  const items = parsePaper(p)
  report.push({
    sitting: p.sitting,
    year: p.year,
    date: p.date,
    header: p.header,
    count: items.length,
    withKey: items.filter((x) => x.correctKey).length,
    unanswered: items.filter((x) => !x.correctKey).length,
    unparsedOptions: items.filter((x) => x.flags.includes('options_unparsed')).length,
  })
  all.push({ sitting: p.sitting, year: p.year, date: p.date, flags: p.flags || [], items })
}

const outDir = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'user-2026-09-16-docx')
writeFileSync(join(outDir, 'bjs-mcq-parsed.json'), JSON.stringify({ report, papers: all }, null, 2))
console.log(JSON.stringify(report, null, 2))
console.log('total', all.reduce((s, p) => s + p.items.length, 0))
