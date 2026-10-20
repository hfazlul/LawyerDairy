import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import zlib from 'node:zlib'

const inbox = 'D:/VIVI/1/LawyerDairy/docs/plan/mobile-v3/_inbox/user-pdfs-2026-09-16'
mkdirSync(inbox, { recursive: true })

const files = [
  'C:/Users/Administrator/Downloads/bar_council_exam_question_solution_pdf_2012_971135a41a.pdf',
  'C:/Users/Administrator/Downloads/bar_council_exam_question_solution_pdf_2013_de99c3320b.pdf',
  'C:/Users/Administrator/Downloads/bar_council_exam_question_solution_pdf_2015_dc6e2697ba.pdf',
  'C:/Users/Administrator/Downloads/bar_council_exam_question_solution_pdf_2020_833fe1291f.pdf',
  'C:/Users/Administrator/Downloads/bar_council_exam_question_solution_pdf_2022_e9984834a6.pdf',
  'C:/Users/Administrator/Downloads/bar_council_exam_question_solution_pdf_2023_22474e6ba9.pdf',
  'C:/Users/Administrator/Downloads/13th BJS Exam 2021 Written Question.pdf',
]

function inflatePdf(buf) {
  const latin = buf.toString('latin1')
  const texts = []
  const jpegs = []
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let m
  let i = 0
  while ((m = re.exec(latin))) {
    const raw = Buffer.from(m[1], 'latin1')
    let decoded = raw
    try {
      decoded = zlib.inflateSync(raw)
    } catch {
      try {
        decoded = zlib.inflateSync(raw.subarray(2))
      } catch {
        decoded = raw
      }
    }
    if (decoded.length > 2 && decoded[0] === 0xff && decoded[1] === 0xd8) {
      jpegs.push(decoded)
    }
    const s = decoded.toString('utf8')
    if (/[\u0980-\u09FF]/.test(s) || /Bar Council|MCQ|প্রশ্ন|উত্তর/.test(s)) {
      texts.push(s)
    } else {
      const latin2 = decoded.toString('latin1')
      if (/\((?:\\.|[^\\)])+\)\s*T[Jj]/.test(latin2) || /\[(?:[^\]]{0,200})\]\s*TJ/.test(latin2)) {
        texts.push(latin2)
      }
    }
    i += 1
  }
  return { streamCount: i, texts, jpegs }
}

for (const src of files) {
  if (!existsSync(src)) continue
  const buf = readFileSync(src)
  const r = inflatePdf(buf)
  const base = basename(src).replace(/\.pdf$/i, '')
  const text = r.texts.join('\n\n----STREAM----\n\n')
  writeFileSync(join(inbox, `${base}.inflated.txt`), text)
  r.jpegs.forEach((img, n) => {
    writeFileSync(join(inbox, `${base}-img${String(n + 1).padStart(2, '0')}.jpg`), img)
  })
  console.log(
    base,
    'streams',
    r.streamCount,
    'textStreams',
    r.texts.length,
    'jpegs',
    r.jpegs.length,
    'textChars',
    text.length,
    'sample',
    JSON.stringify(text.replace(/\s+/g, ' ').slice(0, 220)),
  )
}
