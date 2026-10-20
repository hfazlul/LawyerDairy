import { readFileSync, writeFileSync } from 'node:fs'

const p =
  'D:/VIVI/1/LawyerDairy/docs/plan/mobile-v3/_inbox/user-2026-09-16-docx/unzipped/word/document.xml'
const xml = readFileSync(p, 'utf8')
console.log('xml length', xml.length)

let i = 0
const text = xml
  .replace(/<w:tab[^/]*\/>/g, '\t')
  .replace(/<w:br[^/]*\/>/g, '\n')
  .replace(/<\/w:p>/g, '\n')
  .replace(/<w:drawing[\s\S]*?<\/w:drawing>/g, () => `\n[[IMAGE-${++i}]]\n`)
  .replace(/<a:blip[^>]*r:embed="([^"]+)"[^/]*\/>/g, '\n[[BLIP:$1]]\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/[ \t]+\n/g, '\n')
  .replace(/[ \t]{2,}/g, ' ')
  .replace(/\n{3,}/g, '\n\n')

const out =
  'D:/VIVI/1/LawyerDairy/docs/plan/mobile-v3/_inbox/user-2026-09-16-docx/document-text.txt'
writeFileSync(out, text)
console.log('text length', text.length)
console.log('image markers', i)
console.log('--- FIRST 6000 ---')
console.log(text.slice(0, 6000))
console.log('--- HEADERS ---')
const lines = text.split('\n')
for (const line of lines) {
  const t = line.trim()
  if (!t) continue
  if (
    /BJS|বার|হাইকোর্ট|High Court|MCQ|লিখিত|written|২০|201|Exam|প্রিলি|বিজেএস|Permission|তম/i.test(
      t,
    ) &&
    t.length < 180
  ) {
    console.log(t)
  }
}
