import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const dir = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'scraped', 'pass3')
const out = join(dir, 'bing-dl')
mkdirSync(out, { recursive: true })

function decode(s) {
  return String(s)
    .replace(/\\u0026/g, '&')
    .replace(/\\u003d/g, '=')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
}

const urls = new Map()
for (const f of readdirSync(dir).filter((x) => /^(bing-async|bing-page|yandex)-/.test(x) && x.endsWith('.html'))) {
  const html = readFileSync(join(dir, f), 'utf8')
  const re =
    /"murl"\s*:\s*"([^"]+)"|"imgurl"\s*:\s*"([^"]+)"|murl=([^&"']+)|img_href=([^&"']+)|"origUrl":"([^"]+)"|"url":"(https?:[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi
  let m
  while ((m = re.exec(html))) {
    let u = decode(m[1] || m[2] || m[3] || m[4] || m[5] || m[6] || '')
    try {
      u = decodeURIComponent(u)
    } catch {
      /* keep */
    }
    if (!/^https?:/i.test(u)) continue
    if (/logo|avatar|icon|sprite|unsplash|pexels|freepik|youtube|w72|s72|favicon/i.test(u)) continue
    if (!urls.has(u)) urls.set(u, [])
    urls.get(u).push(f)
  }
}

function scoreUrl(u) {
  const hay = u.toLowerCase()
  let score = 0
  if (/fb_img|whatsapp|question|ques|exam|mcq|written|bar.?council|enrollment|enrolment|permission|omr|scan|paper|প্রশ্ন|bbc-written|high.?court/i.test(hay))
    score += 5
  if (/blogger|googleusercontent|fbcdn|imgur|ibb\.co|postimg|pinimg|telegram-cdn/i.test(hay)) score += 2
  if (/ssc|bcs|bjs|aibe|latte|coffee|seat.?plan|accounting|hindu|muslim|degree-ques|international-law/i.test(hay))
    score -= 4
  return score
}

const scored = [...urls.entries()]
  .map(([u, fs]) => ({ u, fs, score: scoreUrl(u), from: fs[0] }))
  .sort((a, b) => b.score - a.score)

console.log('unique urls', scored.length, 'score>=3', scored.filter((x) => x.score >= 3).length)
for (const x of scored.slice(0, 50)) console.log(x.score, x.from, x.u.slice(0, 180))

writeFileSync(join(dir, '_bing-urls.json'), JSON.stringify(scored.filter((x) => x.score >= 2).slice(0, 100), null, 2))

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const seen = new Set()
const saved = []
const targets = scored.filter((x) => x.score >= 3).slice(0, 40)

for (const [i, t] of targets.entries()) {
  const destName = `bing-${String(i).padStart(2, '0')}-${t.from.replace('.html', '')}.jpg`
  const dest = join(out, destName)
  if (existsSync(dest)) {
    saved.push({ ...t, dest: destName, ok: true, skip: true })
    continue
  }
  try {
    const res = await fetch(t.u, {
      headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8', Referer: 'https://www.bing.com/' },
      signal: AbortSignal.timeout(25000),
      redirect: 'follow',
    })
    if (!res.ok) {
      console.log('HTTP', res.status, t.u.slice(0, 100))
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 15000) {
      console.log('SMALL', buf.length, t.u.slice(0, 100))
      continue
    }
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('text/html')) {
      console.log('HTML', t.u.slice(0, 100))
      continue
    }
    const sha = createHash('sha1').update(buf).digest('hex')
    if (seen.has(sha)) {
      console.log('DUP', t.u.slice(0, 80))
      continue
    }
    seen.add(sha)
    writeFileSync(dest, buf)
    saved.push({ u: t.u, from: t.from, score: t.score, dest: destName, bytes: buf.length, sha })
    console.log('SAVED', destName, buf.length)
  } catch (err) {
    console.log('FAIL', String(err.message || err).slice(0, 80), t.u.slice(0, 80))
  }
}

writeFileSync(join(dir, '_bing-dl-log.json'), JSON.stringify(saved, null, 2))
console.log('downloaded', saved.length)
