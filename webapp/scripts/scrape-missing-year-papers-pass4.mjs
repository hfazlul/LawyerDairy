/**
 * Pass 4 — NEW channels only (not Bing image / Facebook CDN / archive.today loop).
 * CDX PDF hunt, DDG/Brave/Yandex HTML, SlideShare/Issuu/GitHub, Wayback blogs,
 * filename guessing, jina/textise readers. Header-verified photos/PDFs only.
 * Do not ingest Ain Prokash / Live MCQ / QuesBankBD typed HTML keys.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const scraped = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'scraped')
const pass4 = join(scraped, 'pass4')
mkdirSync(pass4, { recursive: true })

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const SKIP_HOST =
  /ainprokash\.com|livemcq\.com|ainbid|facebook\.com\/login|lookaside\.fbsbx|archive\.(today|ph|is)|zeroshopbd\.com/i

const log = []
function note(row) {
  log.push({ at: new Date().toISOString(), ...row })
  const tag = row.status || 'INFO'
  const rest = row.id || row.url || row.file || row.msg || ''
  console.log(tag, rest, row.bytes ?? '', row.n ?? '', row.error || '')
}

async function fetchText(url, { asBuffer = false, referer, timeout = 28000 } = {}) {
  const started = Date.now()
  try {
    const headers = {
      'User-Agent': UA,
      Accept: asBuffer
        ? '*/*'
        : 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
      'Accept-Language': 'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    if (referer) headers.Referer = referer
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(timeout),
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
        snippet: '',
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
      snippet: text.slice(0, 320).replace(/\s+/g, ' '),
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

function extractLinks(html = '') {
  const u = new Set()
  const re = /https?:\/\/[^\s"'<>\\]+/gi
  let m
  while ((m = re.exec(html))) {
    let x = decodeUrl(m[0]).replace(/[),.;]+$/, '')
    try {
      x = decodeURIComponent(x)
    } catch {
      /* keep */
    }
    if (x.length > 500) continue
    if (SKIP_HOST.test(x)) continue
    if (/google\.com\/(search|url|aclk)|bing\.com|duckduckgo\.com|yandex\.|brave\.com\/search/i.test(x)) continue
    u.add(x.split('#')[0])
  }
  return [...u]
}

function extractImages(html = '') {
  const u = new Set()
  const patterns = [
    /https?:\/\/[^"'\\\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s>]*)?/gi,
    /https?:\/\/blogger\.googleusercontent\.com\/img\/[^"'\\\s>]+/gi,
    /https?:\/\/[0-9]\.bp\.blogspot\.com\/[^"'\\\s>]+/gi,
    /https?:\/\/i\.imgur\.com\/[^"'\\\s>]+/gi,
    /https?:\/\/i\.ibb\.co\/[^"'\\\s>]+/gi,
    /https?:\/\/i\.postimg\.cc\/[^"'\\\s>]+/gi,
    /https?:\/\/cdn[0-9]*\.telegram-cdn\.org\/[^"'\\\s>]+/gi,
  ]
  for (const r of patterns) {
    let m
    while ((m = r.exec(html))) {
      let x = decodeUrl(m[0])
      try {
        x = decodeURIComponent(x)
      } catch {
        /* keep */
      }
      x = x.replace(/\/s\d{2,5}(-[ch]\d+)?\//, '/s16000/')
      if (!/^https?:\/\//i.test(x)) continue
      if (/w72-h72|s72-c|icon|logo|avatar|favicon|emoji|ads|pixel|1x1|spacer/i.test(x)) continue
      u.add(x.split('#')[0])
    }
  }
  return [...u]
}

function extractPdfs(html = '') {
  const u = new Set()
  const re = /https?:\/\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?/gi
  let m
  while ((m = re.exec(html))) {
    const x = decodeUrl(m[0]).replace(/[),.;]+$/, '')
    if (SKIP_HOST.test(x)) continue
    u.add(x.split('#')[0])
  }
  return [...u]
}

function looksPaperish(url, text = '') {
  const hay = `${url} ${text}`.toLowerCase()
  if (SKIP_HOST.test(hay)) return false
  if (/aibe|all india bar|kerala bar|punjab bar council|bar council of india/i.test(hay)) return false
  return /bar.?council|enrollment|enrolment|হাইকোর্ট|পারমিশন|high.?court.?permission|advocateship|এনরোল|তালিকাভুক্ত|প্রশ্নপত্র|question.?paper|written.?exam|mcq.?exam|fb_img|enrollment_exam|hc_ad_written/i.test(
    hay,
  )
}

function yearHint(hay) {
  const years = []
  for (const y of [
    '2011',
    '2012',
    '2013',
    '2014',
    '2015',
    '2016',
    '2018',
    '2019',
    '2020',
    '2021',
    '2022',
    '2023',
    '2024',
  ]) {
    if (hay.includes(y) || hay.includes(bnYear(y))) years.push(y)
  }
  return years
}

function bnYear(y) {
  const map = { 0: '০', 1: '১', 2: '২', 3: '৩', 4: '৪', 5: '৫', 6: '৬', 7: '৭', 8: '৮', 9: '৯' }
  return String(y)
    .split('')
    .map((d) => map[d] || d)
    .join('')
}

function safeName(s) {
  return String(s)
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 90)
}

const seenSha = new Set()
async function saveBuf(url, destName, minBytes = 8000) {
  const dest = join(pass4, destName)
  if (existsSync(dest) && readFileSync(dest).length > minBytes) {
    note({ status: 'SKIP_EXISTS', url, file: destName })
    return dest
  }
  const r = await fetchText(url, { asBuffer: true })
  if (!r.ok || !r.buf || r.buf.length < minBytes) {
    note({ status: 'SKIP_SMALL_OR_FAIL', url, bytes: r.buf?.length || 0, error: r.error, http: r.status })
    return null
  }
  const ct = String(r.headers?.['content-type'] || '')
  if (ct.includes('text/html') && !/\.pdf(\?|$)/i.test(url)) {
    note({ status: 'SKIP_HTML', url, bytes: r.buf.length })
    return null
  }
  const sha = createHash('sha1').update(r.buf).digest('hex')
  if (seenSha.has(sha)) {
    note({ status: 'SKIP_DUP_SHA', url, sha })
    return null
  }
  seenSha.add(sha)
  writeFileSync(dest, r.buf)
  note({ status: 'SAVED', url, file: destName, bytes: r.buf.length, sha, ct })
  return dest
}

function ddg(q) {
  return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`
}
function brave(q) {
  return `https://search.brave.com/search?q=${encodeURIComponent(q)}`
}
function yandex(q) {
  return `https://yandex.com/search/?text=${encodeURIComponent(q)}`
}
function iaSearch(q) {
  return `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=description&fl[]=mediatype&output=json&rows=30`
}
function cdx(url, extra = '') {
  return `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&fl=original,timestamp,statuscode,mimetype,length&collapse=urlkey&limit=120${extra}`
}
function wayback(ts, original) {
  return `https://web.archive.org/web/${ts}id_/${original}`
}
function jina(url) {
  return `https://r.jina.ai/${url}`
}
function textise(url) {
  return `https://www.textise.net/showtext.aspx?strURL=${encodeURIComponent(url)}`
}

const EMPTY_MCQ = ['2012', '2013', '2015', '2020', '2022', '2023']
const EMPTY_WRITTEN = ['2013', '2016', '2018', '2019', '2024']
const EMPTY_HC = ['2011', '2012', '2013', '2014', '2015', '2018', '2019', '2020', '2021', '2022', '2023']

const SEARCH_QUERIES = [
  ...EMPTY_MCQ.map((y) => `Bangladesh Bar Council enrollment MCQ ${y} question paper pdf`),
  ...EMPTY_MCQ.map((y) => `বার কাউন্সিল এনরোলমেন্ট MCQ ${y} প্রশ্নপত্র স্ক্যান`),
  ...EMPTY_WRITTEN.map((y) => `Bangladesh Bar Council enrollment written exam ${y} question paper scan`),
  ...EMPTY_WRITTEN.map((y) => `বার কাউন্সিল লিখিত পরীক্ষা ${y} প্রশ্নপত্র মূল`),
  ...EMPTY_HC.map((y) => `High Court Permission written exam ${y} Bangladesh Bar Council question paper`),
  ...EMPTY_HC.slice(0, 6).map((y) => `হাইকোর্ট পারমিশন লিখিত ${y} প্রশ্নপত্র Group A`),
  'site:slideshare.net bangladesh bar council mcq 2012',
  'site:issuu.com bar council enrollment question bangladesh',
  'site:github.com bangladesh bar council enrollment mcq 2012',
  'site:gist.github.com bar council mcq bangladesh',
  'site:researchgate.net bangladesh bar council exam question',
  'filetype:pdf Enrollment_Exam_2012_MCQ barcouncil',
  'filetype:pdf HC_AD_written_2018 bar council bangladesh',
]

const PAGES = []

// --- 1. Internet Archive CDX ---
const CDX_TARGETS = [
  'barcouncil.gov.bd/*',
  'www.barcouncil.gov.bd/*',
  'bangladeshbarcouncil.org/*',
  'www.bangladeshbarcouncil.org/*',
  'supremecourt.gov.bd/*',
  'www.supremecourt.gov.bd/*',
  'lawhelpbd.com/*',
  'www.lawhelpbd.com/*',
  'lawyersclubbangladesh.com/*',
  'clcbd.org/*',
  'www.clcbd.org/*',
  'bdlegalservice.com/*',
  'www.bdlegalservice.com/*',
  'judicialservicebd.com/*',
  'www.judicialservice.com.bd/*',
  'quesbankbd.blogspot.com/*',
  'lawbd0007.blogspot.com/*',
  'mcqadvocateship.blogspot.com/*',
  'bdlaws24.blogspot.com/*',
]
for (const t of CDX_TARGETS) {
  PAGES.push({ id: `cdx-${safeName(t)}`, url: cdx(t, '&filter=mimetype:application/pdf'), kind: 'cdx' })
  PAGES.push({
    id: `cdx-jpg-${safeName(t)}`,
    url: cdx(t, '&filter=mimetype:image/jpeg'),
    kind: 'cdx',
  })
}

// filename-pattern CDX (url is treated as prefix/wildcard by IA depending on *)
const FILENAME_GUESSES = []
const hosts = [
  'https://www.barcouncil.gov.bd/',
  'https://barcouncil.gov.bd/',
  'http://www.barcouncil.gov.bd/',
  'http://bangladeshbarcouncil.org/',
  'https://www.supremecourt.gov.bd/',
  'https://www.barcouncil.gov.bd/wp-content/uploads/',
  'https://www.barcouncil.gov.bd/notice/',
  'https://www.barcouncil.gov.bd/downloads/',
  'https://www.barcouncil.gov.bd/files/',
  'https://www.du.ac.bd/file/law/',
]
const names = []
for (const y of [...EMPTY_MCQ, '2014', '2016', '2017', '2018', '2019', '2021', '2024', '2025']) {
  names.push(
    `Enrollment_Exam_${y}_MCQ.pdf`,
    `Enrolment_Exam_${y}_MCQ.pdf`,
    `bar_council_mcq_${y}.pdf`,
    `bar_council_mcq_${y}.jpg`,
    `bar-council-mcq-${y}.pdf`,
    `MCQ_${y}.pdf`,
    `mcq${y}.pdf`,
    `advocates_enrollment_mcq_${y}.pdf`,
    `preliminary_mcq_${y}.pdf`,
  )
}
for (const y of [...EMPTY_WRITTEN, '2011', '2012', '2014', '2015', '2017', '2020', '2021', '2022', '2023', '2025']) {
  names.push(
    `Enrollment_Exam_${y}_Written.pdf`,
    `Enrolment_Written_${y}.pdf`,
    `bar_council_written_${y}.pdf`,
    `written_exam_${y}.pdf`,
  )
}
for (const y of [...EMPTY_HC, '2016', '2017', '2024', '2025']) {
  names.push(
    `HC_AD_written_${y}.pdf`,
    `High_Court_Permission_${y}.pdf`,
    `hc_permission_written_${y}.pdf`,
    `HC_Permission_${y}.pdf`,
    `highcourt_permission_${y}.pdf`,
  )
}
for (const h of hosts) {
  for (const n of names) FILENAME_GUESSES.push(h + n)
}

// Wayback availability for guessed files (CDX exact)
for (const u of FILENAME_GUESSES.filter((_, i) => i % 7 === 0).slice(0, 80)) {
  PAGES.push({ id: `cdx-guess-${safeName(u).slice(0, 70)}`, url: cdx(u), kind: 'cdx-guess', original: u })
}

// Direct HEAD-like GET of a smaller guess set via Wayback wildcard
const DIRECT_GUESSES = [
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2012_MCQ.pdf',
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2013_MCQ.pdf',
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2015_MCQ.pdf',
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2020_MCQ.pdf',
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2022_MCQ.pdf',
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2023_MCQ.pdf',
  'https://www.barcouncil.gov.bd/wp-content/uploads/2012/Enrollment_Exam_2012_MCQ.pdf',
  'https://www.barcouncil.gov.bd/wp-content/uploads/2013/Enrollment_Exam_2013_MCQ.pdf',
  'https://www.barcouncil.gov.bd/wp-content/uploads/2015/bar_council_mcq_2015.pdf',
  'https://www.barcouncil.gov.bd/downloads/Enrollment_Exam_2012_MCQ.pdf',
  'http://bangladeshbarcouncil.org/Enrollment_Exam_2012_MCQ.pdf',
  'http://www.bangladeshbarcouncil.org/notice/Enrollment_Exam_2012_MCQ.pdf',
  'https://www.supremecourt.gov.bd/HC_AD_written_2011.pdf',
  'https://www.supremecourt.gov.bd/HC_AD_written_2018.pdf',
  'https://www.supremecourt.gov.bd/resources/HC_Permission_2019.pdf',
  'https://www.barcouncil.gov.bd/HC_AD_written_2018.pdf',
  'https://www.barcouncil.gov.bd/HC_AD_written_2019.pdf',
  'https://www.barcouncil.gov.bd/HC_AD_written_2020.pdf',
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2013_Written.pdf',
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2016_Written.pdf',
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2018_Written.pdf',
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2019_Written.pdf',
  'https://www.barcouncil.gov.bd/Enrollment_Exam_2024_Written.pdf',
]
for (const u of DIRECT_GUESSES) {
  PAGES.push({
    id: `wayback-avail-${safeName(u).slice(0, 60)}`,
    url: `https://archive.org/wayback/available?url=${encodeURIComponent(u)}`,
    kind: 'wayback-avail',
    original: u,
  })
}

// --- 2. DDG / Brave / Yandex HTML (not Bing) ---
for (const [i, q] of SEARCH_QUERIES.entries()) {
  const slug = `q${String(i).padStart(2, '0')}`
  PAGES.push({ id: `ddg-${slug}`, url: ddg(q), query: q, kind: 'ddg' })
  if (i % 2 === 0) PAGES.push({ id: `brave-${slug}`, url: brave(q), query: q, kind: 'brave' })
  if (i % 3 === 0) PAGES.push({ id: `yandex-${slug}`, url: yandex(q), query: q, kind: 'yandex' })
}

// --- 3. SlideShare / Issuu / ResearchGate / GitHub / Telegram web ---
const HOST_SEARCHES = [
  { id: 'ia-bar-mcq', url: iaSearch('bangladesh bar council enrollment mcq question paper') },
  { id: 'ia-hc', url: iaSearch('high court permission bangladesh written question') },
  { id: 'ia-ident-bar', url: iaSearch('identifier:barcouncil OR title:"bar council" bangladesh exam') },
  { id: 'gh-code', url: 'https://github.com/search?q=bangladesh+bar+council+enrollment+mcq+2012&type=code' },
  { id: 'gh-repo', url: 'https://github.com/search?q=bar+council+mcq+bangladesh+question&type=repositories' },
  { id: 'gist', url: 'https://gist.github.com/search?q=bar+council+mcq+2012+bangladesh' },
  { id: 'slideshare', url: 'https://www.slideshare.net/search?searchfrom=header&q=bangladesh+bar+council+mcq+2012' },
  { id: 'issuu', url: 'https://issuu.com/search?q=bangladesh%20bar%20council%20enrollment%20mcq' },
  { id: 'rg', url: 'https://www.researchgate.net/search?q=Bangladesh%20Bar%20Council%20enrollment%20MCQ%202012' },
  { id: 'tg-s-lawhelp', url: 'https://t.me/s/lawhelpbd' },
  { id: 'tg-s-clcbd', url: 'https://t.me/s/clcbd' },
  { id: 'tg-s-judicialbd', url: 'https://t.me/s/judicialservicebd' },
  { id: 'tg-s-bdlegalservice', url: 'https://t.me/s/bdlegalservice' },
  { id: 'tg-s-lawyersclubbd', url: 'https://t.me/s/lawyersclubbd' },
  { id: 'tg-s-hcpermissionbd', url: 'https://t.me/s/hcpermissionbd' },
  { id: 'tg-s-barcouncilnotice', url: 'https://t.me/s/barcouncilnotice' },
  { id: 'tg-s-enrollmentbd', url: 'https://t.me/s/enrollmentbd' },
  { id: 'tg-s-advocateship', url: 'https://t.me/s/advocateship' },
]
for (const p of HOST_SEARCHES) PAGES.push({ ...p, kind: 'host' })

// --- 4. Wayback of known student blogs (specific year paths) ---
const BLOG_URLS = [
  'https://lawhelpbd.com/',
  'http://www.lawhelpbd.com/',
  'https://lawhelpbd.com/bar-council-exam/',
  'https://lawhelpbd.com/bangladesh-bar-council-mcq/',
  'https://lawyersclubbangladesh.com/',
  'https://lawyersclubbangladesh.com/category/exam/',
  'https://clcbd.org/',
  'http://www.clcbd.org/',
  'https://bdlegalservice.com/',
  'http://www.bdlegalservice.com/',
  'https://www.judicialservice.com.bd/',
  'https://quesbankbd.blogspot.com/search?q=2013',
  'https://quesbankbd.blogspot.com/search?q=2015',
  'https://quesbankbd.blogspot.com/search?q=2018',
  'https://quesbankbd.blogspot.com/search?q=2019',
  'https://quesbankbd.blogspot.com/search?q=2021',
  'https://quesbankbd.blogspot.com/search/label/High%20Court%20Permission?updated-max=2016-01-01T00:00:00%2B06:00&max-results=50',
  'http://lawbd0007.blogspot.com/search?q=2013',
  'http://lawbd0007.blogspot.com/search?q=2016',
  'http://lawbd0007.blogspot.com/search?q=2018',
  'http://mcqadvocateship.blogspot.com/search?q=2012',
  'http://bdlaws24.blogspot.com/search?q=question',
  'https://www.bdlawpost.com/search?q=2018+written',
  'https://www.bdlawpost.com/search?q=2019+written',
  'https://www.bdlawpost.com/search?q=2024+written',
  'https://www.bdlawpost.com/search?q=MCQ+2015',
  'https://www.bdlawpost.com/search?q=MCQ+2020',
  'https://www.bdlawpost.com/search?q=MCQ+2022',
  'https://bangla.bdlawpost.com/search?q=লিখিত+২০১৮',
  'https://lawyersclubbangladesh.com/?s=high+court+permission+written+question',
  'https://lawyersclubbangladesh.com/?s=enrollment+mcq+2012',
]
for (const u of BLOG_URLS) {
  PAGES.push({
    id: `wb-avail-blog-${safeName(u).slice(0, 50)}`,
    url: `https://archive.org/wayback/available?url=${encodeURIComponent(u)}`,
    kind: 'wayback-avail',
    original: u,
  })
  PAGES.push({ id: `jina-${safeName(u).slice(0, 50)}`, url: jina(u), kind: 'jina', original: u })
}

// a few textise probes
for (const u of [
  'https://lawhelpbd.com/',
  'https://clcbd.org/',
  'https://lawyersclubbangladesh.com/?s=bar+council+question+paper',
]) {
  PAGES.push({ id: `textise-${safeName(u).slice(0, 40)}`, url: textise(u), kind: 'textise', original: u })
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

function parseCdx(text) {
  const rows = []
  try {
    const j = JSON.parse(text)
    if (Array.isArray(j)) {
      const header = j[0]
      for (const row of j.slice(1)) {
        const obj = {}
        header.forEach((h, i) => {
          obj[h] = row[i]
        })
        rows.push(obj)
      }
      return rows
    }
  } catch {
    /* line format */
  }
  for (const line of text.split('\n')) {
    const p = line.trim().split(/\s+/)
    if (p.length >= 3 && /^https?:/i.test(p[0])) {
      rows.push({ original: p[0], timestamp: p[1], statuscode: p[2], mimetype: p[3], length: p[4] })
    }
  }
  return rows
}

async function main() {
  note({ status: 'START', n: PAGES.length, msg: 'pass4 pages' })
  const pageHits = await mapPool(PAGES, 8, async (page) => {
    const r = await fetchText(page.url)
    const ext = /output=json|available\?|advancedsearch/.test(page.url) ? 'json' : 'html'
    if (r.text && r.bytes > 40 && r.bytes < 3_000_000) {
      writeFileSync(join(pass4, `${safeName(page.id)}.${ext}`), r.text)
    }
    const images = r.text ? extractImages(r.text) : []
    const pdfs = r.text ? extractPdfs(r.text) : []
    const links = r.text ? extractLinks(r.text).filter((u) => looksPaperish(u, r.text.slice(0, 2500))) : []
    const cdxRows = page.kind?.startsWith('cdx') && r.text ? parseCdx(r.text) : []
    const hit = {
      id: page.id,
      url: page.url,
      kind: page.kind || 'page',
      query: page.query || null,
      original: page.original || null,
      ok: r.ok,
      status: r.status,
      error: r.error || null,
      bytes: r.bytes,
      ms: r.ms,
      snippet: r.snippet || '',
      images: images.slice(0, 40),
      pdfs: pdfs.slice(0, 40),
      links: links.slice(0, 30),
      cdxRows: cdxRows.slice(0, 80),
    }
    note({
      status: r.ok ? 'OK' : r.error ? 'FAIL' : `HTTP_${r.status}`,
      id: page.id,
      bytes: r.bytes,
      n: images.length + pdfs.length + cdxRows.length,
      error: r.error,
    })
    return hit
  })

  const follow = []
  const seenFollow = new Set()
  function enqueue(url, from, kind = 'follow') {
    if (!url || seenFollow.has(url)) return
    if (!/^https?:\/\//i.test(url)) return
    if (SKIP_HOST.test(url)) return
    if (PAGES.some((p) => p.url === url)) return
    seenFollow.add(url)
    follow.push({ id: `${kind}-${safeName(url).slice(0, 55)}`, url, from, kind })
  }

  for (const hit of pageHits) {
    for (const link of hit.links || []) enqueue(link, hit.id, 'follow')
    for (const pdf of hit.pdfs || []) enqueue(pdf, hit.id, 'pdf')
    for (const row of hit.cdxRows || []) {
      const orig = row.original
      const ts = row.timestamp
      const mime = String(row.mimetype || '')
      const status = String(row.statuscode || '')
      if (!orig || status.startsWith('4') || status.startsWith('5')) continue
      const hay = orig.toLowerCase()
      const interesting =
        /\.pdf($|\?)/i.test(orig) ||
        /enrollment|enrolment|mcq|written|permission|question|exam|hc[_-]?ad/i.test(hay)
      if (!interesting) continue
      if (ts) enqueue(wayback(ts, orig), hit.id, 'wbfile')
    }
    if (hit.kind === 'wayback-avail' && hit.bytes > 20) {
      try {
        const j = JSON.parse(readFileSync(join(pass4, `${safeName(hit.id)}.json`), 'utf8'))
        const snap = j?.archived_snapshots?.closest
        if (snap?.available && snap?.url) enqueue(snap.url, hit.id, 'wbsnap')
      } catch {
        /* ignore */
      }
    }
  }

  const followHits = await mapPool(follow.slice(0, 70), 6, async (page) => {
    const isBin = /\.pdf($|\?)/i.test(page.url) || /id_\//.test(page.url)
    if (isBin && /\.pdf($|\?)/i.test(page.url)) {
      const dest = await saveBuf(page.url, `${safeName(page.id)}.pdf`, 15000)
      return {
        id: page.id,
        url: page.url,
        from: page.from,
        ok: Boolean(dest),
        status: dest ? 200 : 0,
        bytes: dest ? readFileSync(dest).length : 0,
        images: [],
        pdfs: dest ? [page.url] : [],
        snippet: dest ? 'saved-pdf' : 'pdf-fail',
        saved: dest,
      }
    }
    const r = await fetchText(page.url)
    if (r.text && r.bytes > 400 && r.bytes < 2_000_000) {
      writeFileSync(join(pass4, `${safeName(page.id)}.html`), r.text)
    }
    const images = r.text ? extractImages(r.text) : []
    const pdfs = r.text ? extractPdfs(r.text) : []
    note({
      status: r.ok ? 'FOLLOW_OK' : 'FOLLOW_FAIL',
      id: page.id,
      bytes: r.bytes,
      n: images.length + pdfs.length,
      error: r.error,
    })
    return {
      id: page.id,
      url: page.url,
      from: page.from,
      ok: r.ok,
      status: r.status,
      error: r.error || null,
      bytes: r.bytes,
      images: images.slice(0, 30),
      pdfs: pdfs.slice(0, 20),
      snippet: r.snippet || '',
    }
  })

  const extra = []
  for (const hit of [...pageHits, ...followHits]) {
    let i = 0
    for (const img of hit.images || []) {
      if (/latte|coffee|unsplash|pexels|freepik|avatar|logo|youtube|ssc|bcs|seat.?plan|aibe/i.test(img)) continue
      i += 1
      if (i > 6) break
      extra.push({ file: `${safeName(hit.id)}-img${i}.jpg`, url: img, from: hit.id })
    }
    let p = 0
    for (const pdf of hit.pdfs || []) {
      p += 1
      if (p > 4) break
      extra.push({ file: `${safeName(hit.id)}-p${p}.pdf`, url: pdf, from: hit.id, pdf: true })
    }
  }

  const saved = []
  await mapPool(extra.slice(0, 90), 4, async (item) => {
    const dest = await saveBuf(item.url, item.file, item.pdf ? 15000 : 10000)
    saved.push({ ...item, dest, ok: Boolean(dest) })
  })

  const interestingCdx = []
  for (const hit of pageHits) {
    for (const row of hit.cdxRows || []) {
      const hay = `${row.original} ${row.mimetype}`.toLowerCase()
      if (looksPaperish(row.original || '', hay) || /\.pdf/.test(hay)) {
        interestingCdx.push({ from: hit.id, ...row, years: yearHint(hay) })
      }
    }
  }

  const report = {
    at: new Date().toISOString(),
    methods: [
      'ia-cdx-pdf-jpg',
      'filename-guess-wayback-available',
      'ddg-html',
      'brave-search',
      'yandex-html',
      'slideshare-issuu-github-gist-researchgate',
      'telegram-t.me/s',
      'wayback-student-blogs',
      'jina-reader',
      'textise',
    ],
    skipped: ['bing-images', 'facebook-cdn', 'archive.today', 'ainprokash-html', 'livemcq-html'],
    emptyStillTarget: { mcq: EMPTY_MCQ, written: EMPTY_WRITTEN, hc: EMPTY_HC },
    pages: pageHits.length,
    follow: followHits.length,
    imagesAttempted: extra.length,
    savedOk: saved.filter((s) => s.ok).length,
    interestingCdx: interestingCdx.slice(0, 200),
    pageHits: pageHits.map((p) => ({
      id: p.id,
      kind: p.kind,
      status: p.status,
      ok: p.ok,
      bytes: p.bytes,
      images: p.images.length,
      pdfs: p.pdfs.length,
      links: (p.links || []).length,
      cdx: (p.cdxRows || []).length,
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
      images: (p.images || []).length,
      pdfs: (p.pdfs || []).length,
      error: p.error,
      snippet: p.snippet,
      saved: p.saved || null,
    })),
    saved,
    log,
  }
  writeFileSync(join(scraped, '_pass4-log.json'), JSON.stringify(report, null, 2))
  console.log(
    'pass4 pages',
    pageHits.length,
    'follow',
    followHits.length,
    'saved',
    report.savedOk,
    'cdx-interesting',
    interestingCdx.length,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
