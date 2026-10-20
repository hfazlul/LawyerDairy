import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { basename, join } from 'node:path'

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

function decodePdfLiteral(s) {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
}

function extract(buf) {
  const latin = buf.toString('latin1')
  const chunks = []
  const lit = /\((?:\\.|[^\\)])*\)\s*T[Jj]/g
  let m
  while ((m = lit.exec(latin))) {
    const inner = m[0].slice(1, m[0].lastIndexOf(')'))
    chunks.push(decodePdfLiteral(inner))
  }
  const hex = /<([0-9A-Fa-f\s]+)>/g
  while ((m = hex.exec(latin))) {
    const hexStr = m[1].replace(/\s+/g, '')
    if (hexStr.length < 8 || hexStr.length % 2) continue
    if (hexStr.startsWith('FEFF') || hexStr.startsWith('fffe') || hexStr.startsWith('FEFF'.toLowerCase())) {
      const bytes = Buffer.from(hexStr, 'hex')
      try {
        const t = bytes.slice(2).toString(hexStr.startsWith('FFFE') || hexStr.startsWith('fffe') ? 'utf16le' : 'utf16le')
        if (/[\u0980-\u09FFA-Za-z]/.test(t)) chunks.push(t)
      } catch {
        /* skip */
      }
    }
  }
  const streamCount = (latin.match(/stream/g) || []).length
  const imageCount = (latin.match(/\/Subtype\s*\/Image/g) || []).length
  const fontCount = (latin.match(/\/Type\s*\/Font/g) || []).length
  return { chunks, streamCount, imageCount, fontCount, bytes: buf.length }
}

for (const src of files) {
  if (!existsSync(src)) {
    console.log('MISSING', src)
    continue
  }
  const dest = join(inbox, basename(src))
  copyFileSync(src, dest)
  const buf = readFileSync(src)
  const r = extract(buf)
  const outTxt = dest.replace(/\.pdf$/i, '.extracted.txt')
  const text = r.chunks.join('\n')
  writeFileSync(outTxt, text)
  console.log(
    basename(src),
    'bytes',
    r.bytes,
    'streams',
    r.streamCount,
    'images',
    r.imageCount,
    'fonts',
    r.fontCount,
    'chunks',
    r.chunks.length,
    'textChars',
    text.length,
    'sample',
    JSON.stringify(text.slice(0, 180)),
  )
}
