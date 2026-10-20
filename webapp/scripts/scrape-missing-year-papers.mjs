/**
 * Hunt photographs of original Bar Council / HC Permission papers.
 * Downloads images under docs/plan/mobile-v3/_inbox/scraped/
 * Does not ingest Ain Prokash / Live MCQ HTML answer keys.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const scraped = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'scraped')
mkdirSync(scraped, { recursive: true })

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const log = []
function note(row) {
  log.push({ at: new Date().toISOString(), ...row })
  console.log(row.status || 'INFO', row.url || row.file || row.msg || JSON.stringify(row))
}

async function fetchText(url, { asBuffer = false } = {}) {
  const ctrl = AbortSignal.timeout(45000)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: asBuffer
          ? 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
          : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
      },
      signal: ctrl,
      redirect: 'follow',
    })
    const status = res.status
    if (asBuffer) {
      const buf = Buffer.from(await res.arrayBuffer())
      note({ status: res.ok ? 'OK' : `HTTP_${status}`, url, bytes: buf.length })
      return { ok: res.ok, status, buf, headers: Object.fromEntries(res.headers) }
    }
    const text = await res.text()
    note({ status: res.ok ? 'OK' : `HTTP_${status}`, url, bytes: text.length })
    return { ok: res.ok, status, text, headers: Object.fromEntries(res.headers) }
  } catch (err) {
    note({ status: 'FAIL', url, error: String(err.message || err) })
    return { ok: false, status: 0, error: String(err.message || err) }
  }
}

function extractImages(html = '') {
  const u = new Set()
  const patterns = [
    /https?:\/\/[^"'\\\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s>]*)?/gi,
    /https?:\/\/blogger\.googleusercontent\.com\/img\/[^"'\\\s>]+/gi,
    /https?:\/\/[0-9]\.bp\.blogspot\.com\/[^"'\\\s>]+/gi,
    /https?:\/\/lh[0-9]\.googleusercontent\.com\/[^"'\\\s>]+/gi,
    /https?:\/\/scontent[^.]*\.xx\.fbcdn\.net\/[^"'\\\s>]+/gi,
    /https?:\/\/external[^.]*\.xx\.fbcdn\.net\/[^"'\\\s>]+/gi,
  ]
  for (const r of patterns) {
    let m
    while ((m = r.exec(html))) {
      let x = m[0]
        .replace(/\\u003d/g, '=')
        .replace(/&amp;/g, '&')
        .replace(/\\\//g, '/')
      x = x.replace(/\/s\d{2,5}(-[ch]\d+)?\//, '/s16000/')
      x = x.replace(/\/w\d+-h\d+[^/]*\//, '/s16000/')
      if (/w72-h72|s72-c|icon|logo|avatar|favicon|emoji|ads|pixel|spinner|1x1|spacer/i.test(x)) continue
      if (x.length > 900) continue
      u.add(x)
    }
  }
  return [...u]
}

function safeName(s) {
  return String(s)
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
}

async function saveImage(url, destName) {
  const dest = join(scraped, destName)
  if (existsSync(dest) && readFileSync(dest).length > 8000) {
    note({ status: 'SKIP_EXISTS', url, file: destName })
    return dest
  }
  const r = await fetchText(url, { asBuffer: true })
  if (!r.ok || !r.buf || r.buf.length < 4000) {
    note({ status: 'SKIP_SMALL_OR_FAIL', url, bytes: r.buf?.length || 0 })
    return null
  }
  const ct = String(r.headers['content-type'] || '')
  if (ct.includes('text/html')) {
    note({ status: 'SKIP_HTML', url })
    return null
  }
  writeFileSync(dest, r.buf)
  note({ status: 'SAVED', url, file: destName, bytes: r.buf.length })
  return dest
}

const PAGES = [
  {
    id: 'hc-2016',
    url: 'https://quesbankbd.blogspot.com/2021/08/bangladesh-bar-council-high-court.html',
  },
  {
    id: 'hc-2017',
    url: 'https://quesbankbd.blogspot.com/2021/08/bangladesh-bar-council-high-court_28.html',
  },
  {
    id: 'bar-written-2022-qb',
    url: 'https://quesbankbd.blogspot.com/2022/09/bar-council-enrollment-written-exam.html',
  },
  {
    id: 'bar-written-2020-qb',
    url: 'https://quesbankbd.blogspot.com/2021/02/bar-council-enrollment-written-exam.html',
  },
  {
    id: 'bar-written-2023-bdlp',
    url: 'https://www.bdlawpost.com/2023/12/bangladesh-bar-councils-advocates.html',
  },
  {
    id: 'bar-written-2025-bdlp',
    url: 'https://www.bdlawpost.com/2025/07/advocates-enrollment-written.html',
  },
  {
    id: 'bar-written-2022-bdlp',
    url: 'https://www.bdlawpost.com/2022/09/bangladesh-bar-councils-advocates.html',
  },
  {
    id: 'bar-mcq-2023-bdlp',
    url: 'https://www.bdlawpost.com/2023/11/question-solution-of-advocateship.html',
  },
  {
    id: 'bar-mcq-2025-bdlp',
    url: 'https://www.bdlawpost.com/2025/04/question-solution-of-advocateship.html',
  },
  {
    id: 'bar-written-2026-bdlp',
    url: 'https://bangla.bdlawpost.com/2026/08/question-of-enrolement-written-exam-2026.html',
  },
  {
    id: 'quesbankbd-hc-label',
    url: 'https://quesbankbd.blogspot.com/search/label/High%20Court%20Permission?max-results=50',
  },
  {
    id: 'quesbankbd-bar-label',
    url: 'https://quesbankbd.blogspot.com/search/label/Bar%20Council%20Enrollment?max-results=50',
  },
  {
    id: 'barcouncil-home',
    url: 'https://www.barcouncil.gov.bd/',
  },
  {
    id: 'barcouncil-wayback-2023',
    url: 'https://web.archive.org/web/20231201000000/https://www.barcouncil.gov.bd/',
  },
  {
    id: 'archive-today-barcouncil',
    url: 'https://archive.today/https://www.barcouncil.gov.bd/',
  },
  {
    id: 'facebook-nullb-2022',
    url: 'https://www.facebook.com/nullb.bd/posts/332023325789485',
  },
  {
    id: 'facebook-bdbarcouncil',
    url: 'https://www.facebook.com/BdBarCouncil',
  },
  {
    id: 'facebook-bdlegalsolution',
    url: 'https://www.facebook.com/BDLEGALSOLUTION',
  },
  {
    id: 'lawyersclub-hc-2019',
    url: 'https://lawyersclubbangladesh.com/2019/12/30/%E0%A6%8F%E0%A6%AC%E0%A6%BE%E0%A6%B0-%E0%A6%B9%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%8B%E0%A6%B0%E0%A7%8D%E0%A6%9F%E0%A7%87-%E0%A6%A4%E0%A6%BE%E0%A6%B2%E0%A6%BF%E0%A6%95%E0%A6%BE%E0%A6%AD%E0%A7%81%E0%A6%95/',
  },
  {
    id: 'prothomalo-fake-2025',
    url: 'https://www.prothomalo.com/bangladesh/capital/7l6q0x5n7x',
  },
  {
    id: 'cdx-bdlawpost-jpg',
    url: 'https://web.archive.org/cdx/search/cdx?url=bdlawpost.com&matchType=domain&output=json&filter=mimetype:image/jpeg&limit=40&fl=original,timestamp,statuscode,mimetype,length',
  },
  {
    id: 'cdx-quesbankbd-jpg',
    url: 'https://web.archive.org/cdx/search/cdx?url=quesbankbd.blogspot.com&matchType=domain&output=json&filter=mimetype:image/jpeg&limit=40',
  },
  {
    id: 'bing-img-mcq-2012',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+mcq+2012+question+paper+photo&form=HDRSC2',
  },
  {
    id: 'bing-img-mcq-2013',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+mcq+2013+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-mcq-2015',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+mcq+2015+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-mcq-2020',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+mcq+2020+question+paper+photo&form=HDRSC2',
  },
  {
    id: 'bing-img-mcq-2022',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+mcq+2022+question+paper+photo&form=HDRSC2',
  },
  {
    id: 'bing-img-mcq-2023',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+mcq+2023+question+paper+photo&form=HDRSC2',
  },
  {
    id: 'bing-img-written-2013',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+written+exam+2013+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-written-2016',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+written+exam+2016+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-written-2018',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+written+exam+2018+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-written-2019',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+written+exam+2019+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-written-2023',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+written+exam+2023+question+paper+photo&form=HDRSC2',
  },
  {
    id: 'bing-img-written-2024',
    url: 'https://www.bing.com/images/search?q=bangladesh+bar+council+written+exam+2024+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-hc-2018',
    url: 'https://www.bing.com/images/search?q=high+court+permission+written+2018+bangladesh+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-hc-2019',
    url: 'https://www.bing.com/images/search?q=high+court+permission+written+2019+bangladesh+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-hc-2021',
    url: 'https://www.bing.com/images/search?q=high+court+permission+written+2021+bangladesh+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-hc-2022',
    url: 'https://www.bing.com/images/search?q=high+court+permission+written+2022+bangladesh+question+paper&form=HDRSC2',
  },
  {
    id: 'bing-img-hc-2023',
    url: 'https://www.bing.com/images/search?q=high+court+permission+written+2023+bangladesh+question+paper&form=HDRSC2',
  },
  {
    id: 'google-img-mcq-2012',
    url: 'https://www.google.com/search?tbm=isch&q=bangladesh+bar+council+mcq+2012+question+paper',
  },
  {
    id: 'ddg-mcq-2012',
    url: 'https://duckduckgo.com/?q=bangladesh+bar+council+mcq+2012+question+paper&iax=images&ia=images',
  },
  {
    id: 'huggingface-skip',
    url: 'https://huggingface.co/datasets/momahadi/bangladesh-bar-council-exam-dataset',
  },
]

const KNOWN_IMAGES = [
  {
    file: 'hc-2016-p1.jpg',
    url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh4UfBGT3YqLN8xAMiuauevdqulQKwaqAgQUcN2kp542JBWNLFoew2BqK_FZoU6eLtOlT4jh0aaOPeTJC9YcI9yavn3vh-Wdf2cxxIY9IvWX_aWgetPQ0pgXjzo0sDLUfLr-9bKn_X6UoA/s16000/1.jpg',
  },
  {
    file: 'hc-2016-p2.jpg',
    url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiC8YSoqIEDmkzBSWkTjG8Atqez8AlBm6zXOswoK_XE64fBw6GkP056XiLGqMiMpWp2fSoF0r4NANAjjJWfbHTe_se6rD24cbFbU_4oh_fuT13pjMLAWVyYq_BECV9F_841rRvOFwP00vs/s16000/2.jpg',
  },
  {
    file: 'hc-2016-p3.jpg',
    url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhAWJk8eQm84y4V9jNSDbqBjGigFDJruB2oKgH_lfqjaK5_F3j_JkRomAeFPhzHC3YIxTcz5tv3IiNVbKrrcgeU3aqEpY1VPrGDK7l7pRuolzctmz5li5bwYW6GQaiQqtmc_Hp_iFoJ-kY/s16000/3.jpg',
  },
  {
    file: 'hc-2017-p1.jpg',
    url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEimgxZT4NYbSQiWVMqHmuMEXiAXAQFNTDJj5-jNCWQNzJiIpD4XVTOB3zxSDP0Kpv9zvX-lqD636ZdiuKzvHlMINfE61NnxVfv4uu9l5i4qzfzTScIernYs612pQEbpTXhig5-_xwNycBs/s16000/11.jpg',
  },
  {
    file: 'hc-2017-p2.jpg',
    url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj56r_A3UJ56W1JK46F5eieEJTvFr5cS7Q20wHtujd5WoisdtIEagObFCakjrfVvCf12O05jmdinWsfh3lSSxlxQP7gVxBW-Qc3FUcaybdtXufwzNXbCMlnbj97bb39bfKCa9jMD4YxMg0/s16000/22.jpg',
  },
  {
    file: 'bar-written-2022-p1.jpg',
    url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiFeEr_2m0zLq5elD-kegVqj9Vdtv8DrO4vxgbjMhTA4tZIUjWC7usvBSdPee68gIN_8qdkgDdVpPeozqPKkW4aFCyHBp7JjuNar2lTPqKiz0WXGVtkwPs62ar8dbZfR2BddYB-paOBMZdtQOUtq-fWlLGxcB-MESw3FVGpF6h5Ur5cxQyI07nO5p4j/s16000/BBC-Written-Exam-2022-01.jpg',
  },
  {
    file: 'bar-written-2022-p2.jpg',
    url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEisOPhdIpj0TRTc0wdLYYv8OgMFgRrRsv4n9yMJM3MMP5qSeibw52fdMpG6hSc965nfRmNCRzykWdmBWmxVAdbLHtQiZHijsAul5fxI9i-Wd8X4MrlOE6xO9K2J0RlWAG1-K2bRdErYnLS8RJ4SQuca3cYE8F2dLv8G5gPEL5VsCfVFQXx9EG5_I91_/s16000/BBC-Written-Exam-2022-02.jpg',
  },
  {
    file: 'bar-written-2020-p1.jpg',
    url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhbJAujZyUjUdsRBGGuf0379XO2VudbHq5UI009X65lPIiek7YVQ312CnGL2IiDPjzjkEFKU0lCDs7SxK-idh3JKB8cGGTQ9YrbGR5fdxciGxu4uyArkXJFZvqsvSUm_BcJew31t8dfdLU/s16000/bar-council-exam-ques-01.jpg',
  },
  {
    file: 'bar-written-2020-p2.jpg',
    url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiJ_vkNggHNsWTSUSUJ89060apdlnJi82lfYo4oIbLahU6IeGTBBnN-FmJKNLTF55j4o9AmNouSZtudOQ7MozUxC_w02J2x89rW53owRgtFRh9TqWRi3hZU02oTynyD0jJ9qamLFSssCPs/s16000/bar-council-exam-ques-02.jpg',
  },
]

async function main() {
  const pageHits = []
  for (const page of PAGES) {
    const r = await fetchText(page.url)
    const htmlPath = join(scraped, `${page.id}.html`)
    if (r.text) writeFileSync(htmlPath, r.text)
    const images = r.text ? extractImages(r.text) : []
    pageHits.push({
      id: page.id,
      url: page.url,
      ok: r.ok,
      status: r.status,
      error: r.error || null,
      bytes: r.text?.length || 0,
      images,
    })
  }

  const extra = []
  for (const hit of pageHits) {
    let i = 0
    for (const img of hit.images) {
      if (/latte|coffee|unsplash|pexels|freepik|avatar|logo|cover\.jpg|linen/i.test(img)) continue
      i += 1
      extra.push({ file: `${hit.id}-img${i}.jpg`, url: img, from: hit.id })
    }
  }

  const saved = []
  for (const img of [...KNOWN_IMAGES, ...extra]) {
    const dest = await saveImage(img.url, img.file)
    saved.push({ ...img, dest, ok: Boolean(dest) })
  }

  const report = { pages: pageHits, saved, log }
  writeFileSync(join(scraped, '_scrape-log.json'), JSON.stringify(report, null, 2))
  console.log('pages', pageHits.length, 'images attempted', saved.length)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
void dirname
void readFileSync
void safeName
