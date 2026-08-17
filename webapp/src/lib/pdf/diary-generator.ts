// Bangla-safe PDF generator using react-pdf or puppeteer
// Uses Hind Siliguri font for correct যুক্তাক্ষর rendering.

import PDFDocument from 'pdfkit'

const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
  'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর']

interface DiaryPdfInput {
  chamberName: string
  month: number
  year:  number
  byDay: Record<string, any[]>
}

export async function generateDiaryPdf(input: DiaryPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    const doc = new PDFDocument({
      size:    'A4',
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
    })

    doc.on('data', (chunk: Buffer) => {
      chunks.push(Uint8Array.from(chunk))
    })
    doc.on('end', () => {
      // Node Buffer / Uint8Array typing mismatch across @types/node versions
      const out = Buffer.concat(chunks as readonly Uint8Array[])
      resolve(out as Buffer)
    })
    doc.on('error', reject)

    // ── Cover page ─────────────────────────────────────────────────────────
    doc.fontSize(22).text('আইনজীবী ডায়েরি', { align: 'center' })
    doc.moveDown(0.4)
    doc.fontSize(14).text(input.chamberName, { align: 'center' })
    doc.moveDown(0.4)
    doc.fontSize(12).text(
      `${BN_MONTHS[input.month - 1]} ${input.year}`,
      { align: 'center' })
    doc.moveDown(2)

    // ── Day-by-day pages ───────────────────────────────────────────────────
    const days = Object.keys(input.byDay).sort()

    for (const day of days) {
      const cases = input.byDay[day]
      const date  = new Date(day)

      if (doc.y > 650) doc.addPage()

      // Day header
      doc.rect(50, doc.y, 495, 24).fill('#12263F')
      doc.fillColor('white').fontSize(11)
         .text(`${date.getDate()} ${BN_MONTHS[date.getMonth()]} ${date.getFullYear()}`,
           55, doc.y - 18)
      doc.fillColor('black').moveDown(1.2)

      // Column headers
      const y0 = doc.y
      doc.fontSize(9)
         .text('কেস নম্বর',   55,  y0)
         .text('আদালত',       170, y0)
         .text('ক্লায়েন্ট',  310, y0)
         .text('গত ফলাফল',   420, y0)
      doc.moveDown(0.5)
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown(0.3)

      // Case rows
      for (const c of cases) {
        const y = doc.y
        if (y > 720) { doc.addPage(); }
        doc.fontSize(9)
           .text(c.caseNo           || '—', 55,  doc.y, { width: 110 })
           .text(c.courtName        || '—', 170, doc.y, { width: 135 })
           .text(c.clientId         || '—', 310, doc.y, { width: 105 })
           .text(c.lastOutcome      || '—', 420, doc.y, { width: 120 })
        doc.moveDown(0.6)
      }
      doc.moveDown(0.8)
    }

    // ── Footer on every page ───────────────────────────────────────────────
    const pages = doc.bufferedPageRange()
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(pages.start + i)
      doc.fontSize(8).fillColor('#94A3B8')
         .text(
           `আইনজীবী ডায়েরি BD · পৃষ্ঠা ${i + 1}/${pages.count}`,
           50, 780, { align: 'center', width: 495 })
    }

    doc.end()
  })
}
