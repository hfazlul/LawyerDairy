import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const dir = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'scraped', 'pass3')
const out = join(dir, 'fb-thumbs')
mkdirSync(out, { recursive: true })

function decodeEntities(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
}

const items = []
const seen = new Set()
for (const f of readdirSync(dir).filter((x) => /^(bing-async|bing-page)-/.test(x) && x.endsWith('.html'))) {
  const html = decodeEntities(readFileSync(join(dir, f), 'utf8'))
  const blockRe = /m="\{[^"]*"murl"\s*:\s*"([^"]+)"[\s\S]{0,800}?"turl"\s*:\s*"([^"]+)"[\s\S]{0,400}?"t"\s*:\s*"([^"]{0,220})"/g
  let m
  while ((m = blockRe.exec(html))) {
    const murl = m[1]
    const turl = m[2].replace(/&amp;/g, '&')
    const title = m[3]
    const key = murl
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ murl, turl, title, from: f })
  }
}

const fb = items.filter((x) => /lookaside|facebook|fbcdn|লিখিত|প্রশ্নপত্র|permission|পারমিশন|FB_IMG|2018|2019|2011|2014|2015/i.test(`${x.murl} ${x.title}`))
console.log('parsed items', items.length, 'fb-ish', fb.length)
for (const x of fb.slice(0, 40)) {
  console.log((x.title || '').slice(0, 90), '|', x.murl.slice(0, 100), '| turl', x.turl.slice(0, 80))
}
writeFileSync(join(dir, '_fb-candidates.json'), JSON.stringify(fb.slice(0, 80), null, 2))

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const saved = []
for (const [i, t] of fb.slice(0, 25).entries()) {
  const dest = join(out, `thumb-${String(i).padStart(2, '0')}.jpg`)
  if (existsSync(dest)) continue
  try {
    const res = await fetch(t.turl, {
      headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8', Referer: 'https://www.bing.com/' },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      console.log('HTTP', res.status, t.title.slice(0, 40))
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 4000) continue
    writeFileSync(dest, buf)
    saved.push({ dest: `thumb-${String(i).padStart(2, '0')}.jpg`, bytes: buf.length, title: t.title, murl: t.murl })
    console.log('THUMB', i, buf.length, t.title.slice(0, 60))
  } catch (err) {
    console.log('FAIL', String(err.message || err).slice(0, 60))
  }
}

const extraPages = [
  { id: 'wayback-fb-695', url: 'https://web.archive.org/web/2020/https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=695236622399518' },
  { id: 'wayback-fb-688', url: 'https://web.archive.org/web/2020/https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=688280546428435' },
  { id: 'mbasic-photo-695', url: 'https://mbasic.facebook.com/photo.php?fbid=695236622399518' },
  { id: 'mbasic-photo-688', url: 'https://mbasic.facebook.com/photo.php?fbid=688280546428435' },
  { id: 'fb-photo-695', url: 'https://www.facebook.com/photo/?fbid=695236622399518' },
  { id: 'prosnosomadhan-home', url: 'https://prosnosomadhan.com/?s=bar+council+2012' },
  { id: 'chakribangla-2012', url: 'https://www.chakribangla.com/bar-council-question-solution/2012-bar-council-question-solution.html' },
  { id: 'educationsinbd-mcq', url: 'https://educationsinbd.com/bar-council-mcq-exam/' },
  { id: 'barprepbd', url: 'https://barprepbd.com/bar-council-mcq-exam.html' },
  { id: 'legalstudy24', url: 'https://legalstudy24.com/bar-council-mcq-model-tests-since-2012/' },
  { id: 'wayback-hc-2018', url: 'https://web.archive.org/web/*/quesbankbd.blogspot.com/*2018*' },
  { id: 'cdx-quesbank-2018', url: 'https://web.archive.org/cdx/search/cdx?url=quesbankbd.blogspot.com/*2018*&output=json&limit=20' },
  { id: 'tg-lawyersbd', url: 'https://t.me/s/lawyersbd' },
  { id: 'tg-bdlawpost', url: 'https://t.me/s/bdlawpost' },
  { id: 'tg-barcouncilexam', url: 'https://t.me/s/barcouncil_exam' },
]

const pageLog = []
for (const p of extraPages) {
  try {
    const res = await fetch(p.url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.8', 'Accept-Language': 'bn,en;q=0.8' },
      signal: AbortSignal.timeout(25000),
      redirect: 'follow',
    })
    const text = await res.text()
    const snippet = text.slice(0, 220).replace(/\s+/g, ' ')
    const hasImg = /blogger\.googleusercontent|fbcdn|FB_IMG|\.jpg/i.test(text)
    writeFileSync(join(dir, `extra-${p.id}.${p.url.includes('output=json') ? 'json' : 'html'}`), text.slice(0, 800000))
    pageLog.push({ id: p.id, status: res.status, bytes: text.length, hasImg, snippet })
    console.log(res.status, p.id, text.length, hasImg)
  } catch (err) {
    pageLog.push({ id: p.id, status: 0, error: String(err.message || err) })
    console.log('FAIL', p.id, String(err.message || err).slice(0, 80))
  }
}

writeFileSync(join(dir, '_pass3b-log.json'), JSON.stringify({ saved, pageLog, fbCount: fb.length }, null, 2))
console.log('thumbs', saved.length)
