import { readFileSync, writeFileSync } from 'node:fs'

const xml = readFileSync(
  'D:/VIVI/1/LawyerDairy/docs/plan/mobile-v3/_inbox/user-2026-09-16-docx/unzipped/word/document.xml',
  'utf8',
)
const rels = readFileSync(
  'D:/VIVI/1/LawyerDairy/docs/plan/mobile-v3/_inbox/user-2026-09-16-docx/unzipped/word/_rels/document.xml.rels',
  'utf8',
)
const text = readFileSync(
  'D:/VIVI/1/LawyerDairy/docs/plan/mobile-v3/_inbox/user-2026-09-16-docx/document-text.txt',
  'utf8',
)

const idToFile = {}
for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) {
  idToFile[m[1]] = m[2]
}

const embeds = []
for (const m of xml.matchAll(/r:embed="(rId\d+)"/g)) {
  embeds.push({ rId: m[1], file: idToFile[m[1]] || '?' })
}

console.log('embed count', embeds.length)
embeds.forEach((e, i) => console.log(String(i + 1).padStart(2), e.rId, e.file))

const headerRe =
  /((?:\d{1,2}|[০-৯]{1,2})\s*তম\s*বিজেএস[^\n]{0,80}|[০-৯\d]+\s*তম বিজেএস[^\n]{0,80}|প্রাথমিক পরীক্ষা[^\n]{0,60}|লিখিত পরীক্ষা[^\n]{0,80}|BJS written[^\n]{0,80}|bar council[^\n]{0,80}|high court[^\n]{0,80}|High court[^\n]{0,80}|১[০-৮] তম[^\n]{0,80}|একাদশ|দ্বাদশ|দশম বিজেএস|নবম বিজেএস|অষ্টম বিজেএস|সপ্তম বিজেএস|ষষ্ঠ বিজেএস|পঞ্চম বিজেএস|চতুর্থ বিজেএস|তৃতী[য়য] বিজেএস)/gi

const hits = []
let m
while ((m = headerRe.exec(text))) {
  const lineStart = text.lastIndexOf('\n', m.index) + 1
  const line = text.slice(lineStart, text.indexOf('\n', m.index)).trim()
  if (line.length < 8) continue
  hits.push({ at: m.index, line: line.slice(0, 160) })
}

console.log('\n=== header-ish lines ===')
const seen = new Set()
for (const h of hits) {
  if (seen.has(h.line)) continue
  seen.add(h.line)
  console.log(h.at, '|', h.line)
}

const lines = text.split('\n')
console.log('\n=== lines matching exam title ===')
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim()
  if (
    /তম বিজেএস|বিজেএস \( সহকারী|লিখিত পরীক্ষা|BJS written|bar council written|high court|High court written|Nicher|projonto|sesh/i.test(
      t,
    )
  ) {
    console.log(`${i + 1}: ${t}`)
  }
}

writeFileSync(
  'D:/VIVI/1/LawyerDairy/docs/plan/mobile-v3/_inbox/user-2026-09-16-docx/image-embed-order.json',
  JSON.stringify(embeds, null, 2),
)
