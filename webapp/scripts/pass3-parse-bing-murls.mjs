import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const dir = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'scraped', 'pass3')
const out = join(dir, 'bing-dl')
mkdirSync(out, { recursive: true })

function decodeEntities(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/')
}

const rows = []
for (const f of readdirSync(dir).filter((x) => /^(bing-async|bing-page)-/.test(x) && x.endsWith('.html'))) {
  const html = decodeEntities(readFileSync(join(dir, f), 'utf8'))
  const re = /"murl"\s*:\s*"([^"]+)"[\s\S]{0,400}?"purl"\s*:\s*"([^"]+)"|"purl"\s*:\s*"([^"]+)"[\s\S]{0,400}?"murl"\s*:\s*"([^"]+)"|"murl"\s*:\s*"([^"]+)"|"t"\s*:\s*"([^"]{0,180})"/g
  let m
  const seenInFile = new Set()
  const murlRe = /"murl"\s*:\s*"([^"]+)"/g
  const tRe = /"t"\s*:\s*"([^"]{0,200})"/g
  const titles = []
  while ((m = tRe.exec(html))) titles.push(m[1])
  let i = 0
  while ((m = murlRe.exec(html))) {
    const u = m[1]
    if (seenInFile.has(u)) continue
    seenInFile.add(u)
    rows.push({ u, from: f, title: titles[i] || '', purl: '' })
    i++
  }
}

function score(row) {
  const hay = `${row.u} ${row.title}`.toLowerCase()
  let s = 0
  if (/fb_img|whatsapp|question paper|প্রশ্নপত্র|omr|scan|original|written exam|mcq exam 20(12|13|15|18|19|20|22|23|24)/i.test(hay)) s += 6
  if (/blogger|googleusercontent|fbcdn|imgur|ibb\.co|postimg/i.test(hay)) s += 3
  if (/lookaside\.fbsbx|facebook\.com/i.test(hay)) s += 1
  if (/ainprokash|livemcq|notice|বিজ্ঞপ্তি|form.?fill|suggestion|সাজেশন|banner|logo|app_|shopify|tarahuralife|legalfist|duaa-news|educationsinbdcom\.jpg/i.test(hay))
    s -= 8
  if (/2025|2026/.test(hay) && !/2012|2013|2015|2018|2019|2020|2022|2023|2024/.test(hay)) s -= 3
  if (/ssc|bcs|bjs|aibe|latte|coffee/i.test(hay)) s -= 6
  return s
}

const scored = rows
  .map((r) => ({ ...r, score: score(r) }))
  .sort((a, b) => b.score - a.score)

console.log('murls', scored.length)
console.log('--- top 40 ---')
for (const x of scored.slice(0, 40)) {
  console.log(x.score, x.from, (x.title || '').slice(0, 70), '|', x.u.slice(0, 140))
}

writeFileSync(join(dir, '_bing-murls.json'), JSON.stringify(scored.slice(0, 120), null, 2))

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const seen = new Set()
const saved = []
const targets = scored.filter((x) => x.score >= 2).slice(0, 35)

for (const [i, t] of targets.entries()) {
  const destName = `murl-${String(i).padStart(2, '0')}.jpg`
  const dest = join(out, destName)
  if (existsSync(dest) && readFileSync(dest).length > 12000) continue
  try {
    const res = await fetch(t.u, {
      headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8', Referer: 'https://www.bing.com/' },
      signal: AbortSignal.timeout(25000),
      redirect: 'follow',
    })
    if (!res.ok) {
      console.log('HTTP', res.status, t.u.slice(0, 90))
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 15000) {
      console.log('SMALL', buf.length, t.u.slice(0, 90))
      continue
    }
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('text/html')) {
      console.log('HTML', t.u.slice(0, 90))
      continue
    }
    const sha = createHash('sha1').update(buf).digest('hex')
    if (seen.has(sha)) continue
    seen.add(sha)
    writeFileSync(dest, buf)
    saved.push({ dest: destName, bytes: buf.length, title: t.title, u: t.u, from: t.from, score: t.score })
    console.log('SAVED', destName, buf.length, (t.title || '').slice(0, 50))
  } catch (err) {
    console.log('FAIL', String(err.message || err).slice(0, 70))
  }
}

writeFileSync(join(dir, '_bing-dl-log.json'), JSON.stringify(saved, null, 2))
console.log('downloaded', saved.length)
