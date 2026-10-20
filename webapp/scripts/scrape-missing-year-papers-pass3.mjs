/**
 * Pass 3 — hunt remaining empty years with NEW queries/hosts.
 * Skip dead pass1/pass2 URLs. Skip Ain Prokash / Live MCQ / Ainbid HTML keys.
 * Do not invent papers. Header-verified photos only.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const scraped = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'scraped')
const pass3 = join(scraped, 'pass3')
mkdirSync(pass3, { recursive: true })

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const log = []
function note(row) {
  log.push({ at: new Date().toISOString(), ...row })
  const tag = row.status || 'INFO'
  const rest = row.id || row.url || row.file || row.msg || ''
  console.log(tag, rest, row.bytes ?? '', row.error || row.n || '')
}

async function fetchText(url, { asBuffer = false, referer } = {}) {
  const started = Date.now()
  try {
    const headers = {
      'User-Agent': UA,
      Accept: asBuffer
        ? 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
        : 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
      'Accept-Language': 'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    if (referer) headers.Referer = referer
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(35000),
      redirect: 'follow',
    })
    if (asBuffer) {
      const buf = Buffer.from(await res.arrayBuffer())
      return {
        ok: res.ok,
        status: res.status,
        buf,
        bytes: buf.length,
        ms: Date.now() - started,
        headers: Object.fromEntries(res.headers),
        finalUrl: res.url,
      }
    }
    const text = await res.text()
    return {
      ok: res.ok,
      status: res.status,
      text,
      bytes: text.length,
      ms: Date.now() - started,
      headers: Object.fromEntries(res.headers),
      snippet: text.slice(0, 280).replace(/\s+/g, ' '),
      finalUrl: res.url,
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      text: '',
      buf: null,
      bytes: 0,
      ms: Date.now() - started,
      error: String(err.message || err),
      snippet: '',
    }
  }
}

function decodeUrl(s) {
  return String(s)
    .replace(/\\u0026/g, '&')
    .replace(/\\u003d/g, '=')
    .replace(/\\u002f/g, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
}

function extractImages(html = '') {
  const u = new Set()
  const patterns = [
    /https?:\/\/[^"'\\\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s>]*)?/gi,
    /https?:\/\/blogger\.googleusercontent\.com\/img\/[^"'\\\s>]+/gi,
    /https?:\/\/[0-9]\.bp\.blogspot\.com\/[^"'\\\s>]+/gi,
    /https?:\/\/lh[0-9]\.googleusercontent\.com\/[^"'\\\s>]+/gi,
    /https?:\/\/scontent[^"'\\\s>]*fbcdn\.net\/[^"'\\\s>]+/gi,
    /https?:\/\/i\.imgur\.com\/[^"'\\\s>]+/gi,
    /https?:\/\/i\.ibb\.co\/[^"'\\\s>]+/gi,
    /https?:\/\/i\.postimg\.cc\/[^"'\\\s>]+/gi,
    /https?:\/\/i\.pinimg\.com\/[^"'\\\s>]+/gi,
    /https?:\/\/images\.yandex\.net\/[^"'\\\s>]+/gi,
    /https?:\/\/avatars\.mds\.yandex\.net\/[^"'\\\s>]+/gi,
    /https?:\/\/t\.me\/[^"'\\\s>]+\/[0-9]+\/[^"'\\\s>]+\.(?:jpg|jpeg|png)/gi,
    /https?:\/\/cdn[0-9]*\.telegram-cdn\.org\/[^"'\\\s>]+/gi,
    /"murl"\s*:\s*"([^"]+)"/gi,
    /"imgurl"\s*:\s*"([^"]+)"/gi,
    /"ou"\s*:\s*"([^"]+)"/gi,
    /img_href=([^&"']+)/gi,
    /imgurl=([^&"']+)/gi,
    /murl=([^&"']+)/gi,
  ]
  for (const r of patterns) {
    let m
    while ((m = r.exec(html))) {
      let x = decodeUrl(m[1] || m[0])
      try {
        x = decodeURIComponent(x)
      } catch {
        /* keep */
      }
      x = x.replace(/\/s\d{2,5}(-[ch]\d+)?\//, '/s16000/')
      x = x.replace(/\/w\d+-h\d+[^/]*\//, '/s16000/')
      if (!/^https?:\/\//i.test(x)) continue
      if (/w72-h72|s72-c|icon|logo|avatar|favicon|emoji|ads|pixel|spinner|1x1|spacer|sprite|thumb_64/i.test(x))
        continue
      if (x.length > 1200) continue
      if (!/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(x) && !/googleusercontent|fbcdn|imgur|ibb\.co|pinimg|yandex|telegram-cdn|bp\.blogspot/i.test(x))
        continue
      u.add(x.split('#')[0])
    }
  }
  return [...u]
}

function extractLinks(html = '') {
  const u = new Set()
  const re = /https?:\/\/[^\s"'<>]+/gi
  let m
  while ((m = re.exec(html))) {
    let x = decodeUrl(m[0]).replace(/[),.;]+$/, '')
    if (x.length > 400) continue
    if (/ainprokash\.com|livemcq\.com|ainbid/i.test(x)) continue
    if (/google\.com\/(search|url)|bing\.com|yandex\.|duckduckgo\.com|facebook\.com\/login/i.test(x)) continue
    u.add(x)
  }
  return [...u]
}

function looksPromising(url, text = '') {
  const hay = `${url} ${text}`.toLowerCase()
  if (/ainprokash|livemcq|ainbid|prothomalo.*fake|aibe|all india bar|kerala bar council/i.test(hay)) return false
  return /bar.?council|enrollment|enrolment|হাইকোর্ট|পারমিশন|high.?court.?permission|advocateship|এনরোল|তালিকাভুক্ত|প্রশ্নপত্র|question.?paper|fb_img|written.?exam|mcq.?exam/i.test(
    hay,
  )
}

function safeName(s) {
  return String(s)
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 90)
}

const seenSha = new Set()
async function saveImage(url, destName) {
  const dest = join(pass3, destName)
  if (existsSync(dest) && readFileSync(dest).length > 8000) {
    note({ status: 'SKIP_EXISTS', url, file: destName })
    return dest
  }
  const r = await fetchText(url, { asBuffer: true, referer: 'https://www.bing.com/' })
  if (!r.ok || !r.buf || r.buf.length < 12000) {
    note({ status: 'SKIP_SMALL_OR_FAIL', url, bytes: r.buf?.length || 0, error: r.error })
    return null
  }
  const ct = String(r.headers?.['content-type'] || '')
  if (ct.includes('text/html')) {
    note({ status: 'SKIP_HTML', url })
    return null
  }
  const sha = createHash('sha1').update(r.buf).digest('hex')
  if (seenSha.has(sha)) {
    note({ status: 'SKIP_DUP_SHA', url, sha })
    return null
  }
  seenSha.add(sha)
  writeFileSync(dest, r.buf)
  note({ status: 'SAVED', url, file: destName, bytes: r.buf.length, sha })
  return dest
}

const QUERIES = [
  'বার কাউন্সিল MCQ ২০১২ প্রশ্নপত্র স্ক্যান FB_IMG',
  'বার কাউন্সিল MCQ ২০১৩ প্রশ্নপত্র ছবি',
  'বার কাউন্সিল MCQ ২০১৫ ওএমআর প্রশ্নপত্র',
  'বার কাউন্সিল MCQ ২০২০ প্রশ্নপত্র ছবি enrollment',
  'বার কাউন্সিল MCQ ২০২২ প্রশ্নপত্র scan',
  'বার কাউন্সিল MCQ ২০২৩ প্রশ্নপত্র original paper',
  'বার কাউন্সিল লিখিত ২০১৩ প্রশ্নপত্র ছবি',
  'বার কাউন্সিল লিখিত ২০১৬ প্রশ্নপত্র scan',
  'বার কাউন্সিল লিখিত ২০১৮ প্রশ্নপত্র FB_IMG',
  'বার কাউন্সিল লিখিত ২০১৯ প্রশ্নপত্র ছবি',
  'বার কাউন্সিল লিখিত ২০২৪ প্রশ্নপত্র ১৯ ডিসেম্বর',
  'হাইকোর্ট পারমিশন লিখিত ২০১১ প্রশ্নপত্র',
  'হাইকোর্ট পারমিশন লিখিত ২০১২ প্রশ্নপত্র',
  'হাইকোর্ট পারমিশন লিখিত ২০১৩ প্রশ্নপত্র',
  'হাইকোর্ট পারমিশন লিখিত ২০১৪ ৯ আগস্ট প্রশ্নপত্র',
  'হাইকোর্ট পারমিশন লিখিত ২০১৫ প্রশ্নপত্র',
  'হাইকোর্ট পারমিশন লিখিত ২০১৮ প্রশ্নপত্র ছবি',
  'হাইকোর্ট পারমিশন লিখিত ২০১৯ প্রশ্নপত্র',
  'হাইকোর্ট পারমিশন লিখিত ২০২০ প্রশ্নপত্র',
  'হাইকোর্ট পারমিশন লিখিত ২০২১ প্রশ্নপত্র',
  'হাইকোর্ট পারমিশন লিখিত ২০২২ প্রশ্নপত্র',
  'হাইকোর্ট পারমিশন লিখিত ২০২৩ প্রশ্নপত্র Group A',
  'Bangladesh Bar Council MCQ 30 March 2012 question paper photo',
  'Bangladesh Bar Council MCQ 6 September 2013 OMR paper scan',
  'advocates enrollment written exam 19 December 2023 question paper photo',
  'High Court Permission written 15 July 2011 Bangladesh question paper',
  'High Court Permission written 9 August 2014 Bangladesh original paper',
]

function bingAsync(q) {
  return `https://www.bing.com/images/async?q=${encodeURIComponent(q)}&first=1&count=35&mmasync=1`
}
function bingPage(q) {
  return `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&qft=+filterui:imagesize-large&form=HDRSC2`
}
function yandex(q) {
  return `https://yandex.com/images/search?text=${encodeURIComponent(q)}`
}
function ddgHtml(q) {
  return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`
}

const PAGES = [
  { id: 'teletalk-bar', url: 'https://bar.teletalk.com.bd/' },
  { id: 'lawacademy-home', url: 'https://lawacademybd.com/' },
  { id: 'lawacademy-hc', url: 'https://lawacademybd.com/?s=high+court+permission+question' },
  { id: 'lawacademy-bar', url: 'https://lawacademybd.com/?s=bar+council+written+question' },
  { id: 'lawbd0007-home', url: 'http://lawbd0007.blogspot.com/' },
  { id: 'lawbd0007-feed', url: 'http://lawbd0007.blogspot.com/feeds/posts/default?alt=json&max-results=50' },
  { id: 'bdlaws24-home', url: 'http://bdlaws24.blogspot.com/' },
  { id: 'mcqadvocateship', url: 'http://mcqadvocateship.blogspot.com/' },
  { id: 'gracelaw', url: 'https://gracelawacademy.com/' },
  { id: 'lawyersnjurists-search', url: 'https://www.lawyersnjurists.com/?s=bar+council+enrollment+question' },
  { id: 'lawyersclub-search', url: 'https://lawyersclubbangladesh.com/?s=question+paper+bar+council' },
  { id: 'bdlawhub-cpc', url: 'https://bdlawhub.com/bar-council-exam-question-cpc/' },
  { id: 'bdlp-search-2018', url: 'https://www.bdlawpost.com/search?q=written+2018' },
  { id: 'bdlp-search-2019', url: 'https://www.bdlawpost.com/search?q=written+2019' },
  { id: 'bdlp-search-2024', url: 'https://www.bdlawpost.com/search?q=written+2024' },
  { id: 'bdlp-search-mcq2012', url: 'https://www.bdlawpost.com/search?q=MCQ+2012' },
  { id: 'bdlp-bn-feed', url: 'https://bangla.bdlawpost.com/feeds/posts/default?alt=json&max-results=50' },
  { id: 'qb-search-2018', url: 'https://quesbankbd.blogspot.com/search?q=2018' },
  { id: 'qb-search-2015', url: 'https://quesbankbd.blogspot.com/search?q=2015' },
  { id: 'qb-search-hc-2014', url: 'https://quesbankbd.blogspot.com/search?q=high+court+2014' },
  { id: 'archive-ia-search', url: 'https://archive.org/advancedsearch.php?q=bangladesh%20bar%20council%20question%20paper&fl[]=identifier&fl[]=title&fl[]=description&output=json&rows=25' },
  { id: 'reddit-search', url: 'https://www.reddit.com/search.json?q=bangladesh%20bar%20council%20question%20paper%20MCQ&limit=25&sort=new' },
  { id: 'imgur-search', url: 'https://imgur.com/search?q=bangladesh%20bar%20council%20mcq' },
  { id: 'mbasic-bdbarcouncil', url: 'https://mbasic.facebook.com/BdBarCouncil' },
  { id: 'mbasic-bdlegal', url: 'https://mbasic.facebook.com/BDLEGALSOLUTION' },
  { id: 'mbasic-nullb', url: 'https://mbasic.facebook.com/nullb.bd' },
  { id: 'mbasic-search-mcq2012', url: 'https://mbasic.facebook.com/search/posts/?q=bar%20council%20mcq%202012%20question' },
  { id: 'tg-bdlaw', url: 'https://t.me/s/bdlaw' },
  { id: 'tg-barcouncilbd', url: 'https://t.me/s/barcouncilbd' },
  { id: 'tg-lawbd', url: 'https://t.me/s/lawbd' },
  { id: 'tg-advocatesbd', url: 'https://t.me/s/advocatesbd' },
  { id: 'tg-lawyersclub', url: 'https://t.me/s/lawyersclubbangladesh' },
  { id: 'tg-ainprokash-skip', url: 'https://t.me/s/ainprokash' },
  { id: 'tg-bdlegal', url: 'https://t.me/s/bdlegalsolution' },
  { id: 'tg-highcourtbd', url: 'https://t.me/s/highcourtpermission' },
  { id: 'tg-enrollment', url: 'https://t.me/s/barcouncilenrollment' },
  { id: 'du-law', url: 'https://www.du.ac.bd/body/LAW' },
  { id: 'wordpress-tag', url: 'https://en.search.wordpress.com/?q=bangladesh+bar+council+enrollment+question+paper' },
  { id: 'wayback-cdx-lawbd0007', url: 'https://web.archive.org/cdx/search/cdx?url=lawbd0007.blogspot.com/*&output=json&limit=20&fl=original,timestamp,statuscode,mimetype' },
  { id: 'wayback-cdx-mcqadv', url: 'https://web.archive.org/cdx/search/cdx?url=mcqadvocateship.blogspot.com/*&output=json&limit=20&fl=original,timestamp,statuscode,mimetype' },
]

for (const [i, q] of QUERIES.entries()) {
  const slug = `q${String(i).padStart(2, '0')}`
  PAGES.push({ id: `bing-async-${slug}`, url: bingAsync(q), query: q })
  if (i % 3 === 0) PAGES.push({ id: `bing-page-${slug}`, url: bingPage(q), query: q })
  if (i % 4 === 0) PAGES.push({ id: `yandex-${slug}`, url: yandex(q), query: q })
  if (i % 2 === 0) PAGES.push({ id: `ddg-html-${slug}`, url: ddgHtml(q), query: q })
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return out
}

async function main() {
  const pageHits = await mapPool(PAGES, 6, async (page) => {
    const r = await fetchText(page.url)
    const ext = /alt=json|output=json|search\.json/.test(page.url) ? 'json' : 'html'
    if (r.text && r.bytes > 80 && r.bytes < 2_500_000) {
      writeFileSync(join(pass3, `${safeName(page.id)}.${ext}`), r.text)
    }
    const images = r.text ? extractImages(r.text) : []
    const links = r.text ? extractLinks(r.text).filter((u) => looksPromising(u, r.text.slice(0, 2000))) : []
    const hit = {
      id: page.id,
      url: page.url,
      query: page.query || null,
      ok: r.ok,
      status: r.status,
      error: r.error || null,
      bytes: r.bytes,
      ms: r.ms,
      snippet: r.snippet || '',
      images: images.slice(0, 40),
      links: links.slice(0, 25),
    }
    note({ status: r.ok ? 'OK' : r.error ? 'FAIL' : `HTTP_${r.status}`, id: page.id, bytes: r.bytes, n: images.length, error: r.error })
    return hit
  })

  const follow = []
  const seenFollow = new Set()
  for (const hit of pageHits) {
    for (const link of hit.links || []) {
      if (seenFollow.has(link)) continue
      if (!/^https?:\/\//i.test(link)) continue
      if (PAGES.some((p) => p.url === link)) continue
      if (/\/feeds\/|\/search\?|tbm=isch|images\/search|images\/async/i.test(link)) continue
      if (!looksPromising(link)) continue
      seenFollow.add(link)
      follow.push({ id: `follow-${safeName(link).slice(0, 60)}`, url: link, from: hit.id })
    }
  }

  const followHits = await mapPool(follow.slice(0, 40), 5, async (page) => {
    const r = await fetchText(page.url)
    if (r.text && r.bytes > 400 && r.bytes < 2_000_000) {
      writeFileSync(join(pass3, `${safeName(page.id)}.html`), r.text)
    }
    const images = r.text ? extractImages(r.text) : []
    note({ status: r.ok ? 'FOLLOW_OK' : 'FOLLOW_FAIL', id: page.id, bytes: r.bytes, n: images.length, error: r.error })
    return {
      id: page.id,
      url: page.url,
      from: page.from,
      ok: r.ok,
      status: r.status,
      error: r.error || null,
      bytes: r.bytes,
      images: images.slice(0, 30),
      snippet: r.snippet || '',
    }
  })

  const extra = []
  for (const hit of [...pageHits, ...followHits]) {
    let i = 0
    for (const img of hit.images || []) {
      if (/latte|coffee|unsplash|pexels|freepik|avatar|logo|cover\.jpg|linen|youtube|ssc|bcs.?pre|seat.?plan|aibe|calcutta/i.test(img))
        continue
      i += 1
      if (i > 8) break
      extra.push({ file: `${safeName(hit.id)}-img${i}.jpg`, url: img, from: hit.id })
    }
  }

  const saved = []
  await mapPool(extra.slice(0, 80), 4, async (img) => {
    const dest = await saveImage(img.url, img.file)
    saved.push({ ...img, dest, ok: Boolean(dest) })
  })

  const report = {
    at: new Date().toISOString(),
    pages: pageHits.length,
    follow: followHits.length,
    imagesAttempted: extra.length,
    savedOk: saved.filter((s) => s.ok).length,
    pageHits: pageHits.map((p) => ({
      id: p.id,
      status: p.status,
      ok: p.ok,
      bytes: p.bytes,
      images: p.images.length,
      links: (p.links || []).length,
      error: p.error,
      snippet: p.snippet,
      query: p.query,
    })),
    followHits: followHits.map((p) => ({
      id: p.id,
      url: p.url,
      status: p.status,
      ok: p.ok,
      bytes: p.bytes,
      images: p.images.length,
      error: p.error,
      snippet: p.snippet,
    })),
    saved,
    log,
  }
  writeFileSync(join(scraped, '_pass3-log.json'), JSON.stringify(report, null, 2))
  console.log('pass3 pages', pageHits.length, 'follow', followHits.length, 'saved', report.savedOk)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
