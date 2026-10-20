/**
 * Second-pass hunt for remaining missing years.
 * Does not ingest Ain Prokash / Live MCQ / Ainbid HTML keys.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const scraped = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'scraped')
mkdirSync(scraped, { recursive: true })

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function fetchText(url) {
  const started = Date.now()
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'bn,en-US;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(40000),
      redirect: 'follow',
    })
    const text = await res.text()
    return {
      url,
      ok: res.ok,
      status: res.status,
      bytes: text.length,
      ms: Date.now() - started,
      snippet: text.slice(0, 240).replace(/\s+/g, ' '),
      text,
    }
  } catch (err) {
    return {
      url,
      ok: false,
      status: 0,
      bytes: 0,
      ms: Date.now() - started,
      error: String(err.message || err),
      snippet: '',
      text: '',
    }
  }
}

const PAGES = [
  {
    id: 'qb-feed-hc',
    url: 'https://quesbankbd.blogspot.com/feeds/posts/default/-/High%20Court%20Permission?alt=json&max-results=50',
  },
  {
    id: 'qb-feed-bar',
    url: 'https://quesbankbd.blogspot.com/feeds/posts/default/-/Bar%20Council%20Enrollment?alt=json&max-results=50',
  },
  {
    id: 'qb-feed-law',
    url: 'https://quesbankbd.blogspot.com/feeds/posts/default/-/Law%20Exam%20Questions?alt=json&max-results=50',
  },
  {
    id: 'qb-hc-older',
    url: 'https://quesbankbd.blogspot.com/search/label/High%20Court%20Permission?updated-max=2021-08-28T18:32:00%2B06:00&max-results=50&start=50&by-date=false',
  },
  {
    id: 'bdlp-feed-legal',
    url: 'https://www.bdlawpost.com/feeds/posts/default/-/Legal%20Question%20Bank?alt=json&max-results=80',
  },
  {
    id: 'bdlp-label-legal',
    url: 'https://www.bdlawpost.com/search/label/Legal%20Question%20Bank?max-results=50',
  },
  {
    id: 'jina-bdlp-legal',
    url: 'https://r.jina.ai/http://www.bdlawpost.com/search/label/Legal%20Question%20Bank',
  },
  {
    id: 'jina-qb-hc',
    url: 'https://r.jina.ai/http://quesbankbd.blogspot.com/search/label/High%20Court%20Permission',
  },
  {
    id: 'jina-barcouncil',
    url: 'https://r.jina.ai/http://www.barcouncil.gov.bd/',
  },
  {
    id: 'archive-ph-barcouncil',
    url: 'https://archive.ph/https://www.barcouncil.gov.bd/',
  },
  {
    id: 'wayback-barcouncil-notices',
    url: 'https://web.archive.org/web/20240115000000/https://www.barcouncil.gov.bd/category/notice-board/',
  },
  {
    id: 'supremecourt-home',
    url: 'https://www.supremecourt.gov.bd/',
  },
  {
    id: 'bing-bn-mcq-2012',
    url: 'https://www.bing.com/images/search?q=%E0%A6%AC%E0%A6%BE%E0%A6%B0+%E0%A6%95%E0%A6%BE%E0%A6%89%E0%A6%A8%E0%A7%8D%E0%A6%B8%E0%A6%BF%E0%A6%B2+MCQ+2012+%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A6%B6%E0%A7%8D%E0%A6%A8%E0%A6%AA%E0%A6%A4%E0%A7%8D%E0%A6%B0&form=HDRSC2',
  },
  {
    id: 'bing-bn-mcq-2013',
    url: 'https://www.bing.com/images/search?q=bar+council+mcq+2013+bangladesh+question+paper+scan&form=HDRSC2',
  },
  {
    id: 'google-img-bn-mcq-2012',
    url: 'https://www.google.com/search?tbm=isch&q=%E0%A6%AC%E0%A6%BE%E0%A6%B0+%E0%A6%95%E0%A6%BE%E0%A6%89%E0%A6%A8%E0%A7%8D%E0%A6%B8%E0%A6%BF%E0%A6%B2+MCQ+2012',
  },
  {
    id: 'google-img-hc-2019',
    url: 'https://www.google.com/search?tbm=isch&q=high+court+permission+written+2019+bangladesh+question+paper',
  },
  {
    id: 'ddg-hc-2018',
    url: 'https://duckduckgo.com/?q=high+court+permission+written+2018+bangladesh+question+paper&iax=images&ia=images',
  },
  {
    id: 'cdx-bdlawpost-html',
    url: 'https://web.archive.org/cdx/search/cdx?url=bdlawpost.com/*&output=json&filter=mimetype:text/html&limit=30&fl=original,timestamp,statuscode',
  },
  {
    id: 'ainprokash-mcq-2012-skip-html',
    url: 'https://ainprokash.com/bangladesh-bar-council-preliminary-mcq-exam-2012/',
  },
  {
    id: 'livemcq-skip-html',
    url: 'https://web.livemcq.com/',
  },
]

function feedTitles(text) {
  const titles = []
  const re = /"title":\s*\{[^}]*"\$t":\s*"([^"]+)"/g
  let m
  while ((m = re.exec(text))) titles.push(m[1])
  return titles.slice(0, 40)
}

const rows = []
for (const page of PAGES) {
  const r = await fetchText(page.url)
  const out = {
    id: page.id,
    url: page.url,
    ok: r.ok,
    status: r.status,
    bytes: r.bytes,
    ms: r.ms,
    error: r.error || null,
    snippet: r.snippet,
    titles: feedTitles(r.text || ''),
  }
  rows.push(out)
  if (r.text && r.bytes > 200 && r.bytes < 2_000_000) {
    const ext = page.url.includes('alt=json') ? 'json' : 'html'
    writeFileSync(join(scraped, `pass2-${page.id}.${ext}`), r.text)
  }
  console.log(out.status || 'FAIL', page.id, r.bytes, r.error || '')
}

writeFileSync(join(scraped, '_pass2-log.json'), JSON.stringify({ at: new Date().toISOString(), rows }, null, 2))
console.log('pass2 pages', rows.length)
