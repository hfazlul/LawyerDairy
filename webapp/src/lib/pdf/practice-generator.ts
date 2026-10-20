import PDFDocument from 'pdfkit'

export interface PracticePdfInput {
  chamberName: string
  from: string
  to: string
  byStatus: Record<string, number>
  byCourt: Record<string, number>
  hearings: number
  clientCount: number
  collected: number
  pending: { caseNo: string; due: number }[]
}

export async function generatePracticePdf(input: PracticePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } })
    doc.on('data', (chunk: Buffer) => chunks.push(Uint8Array.from(chunk)))
    doc.on('end', () => resolve(Buffer.concat(chunks as readonly Uint8Array[]) as Buffer))
    doc.on('error', reject)

    doc.fontSize(18).text('Practice report', { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(12).text(input.chamberName, { align: 'center' })
    doc.fontSize(10).text(`${input.from} – ${input.to}`, { align: 'center' })
    doc.moveDown(1.2)

    doc.fontSize(13).text('Caseload by status')
    for (const [k, v] of Object.entries(input.byStatus)) {
      doc.fontSize(11).text(`  ${k}: ${v}`)
    }
    doc.moveDown(0.6)
    doc.fontSize(13).text('Courts (top)')
    const courts = Object.entries(input.byCourt).sort((a, b) => b[1] - a[1]).slice(0, 12)
    for (const [k, v] of courts) doc.fontSize(11).text(`  ${k}: ${v}`)
    doc.moveDown(0.6)
    doc.fontSize(13).text(`Hearings in range: ${input.hearings}`)
    doc.fontSize(13).text(`Clients: ${input.clientCount}`)
    doc.fontSize(13).text(`Fees collected: BDT ${input.collected.toFixed(0)}`)
    doc.moveDown(0.6)
    doc.fontSize(13).text('Outstanding fees')
    if (input.pending.length === 0) {
      doc.fontSize(11).text('  None')
    } else {
      for (const p of input.pending.slice(0, 30)) {
        doc.fontSize(11).text(`  ${p.caseNo}: BDT ${p.due.toFixed(0)}`)
      }
    }
    doc.moveDown(1)
    doc.fontSize(8).text('Internal practice summary — not a VAT invoice.', { align: 'center' })
    doc.end()
  })
}
