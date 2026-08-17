// GET /api/mobile/v1/reports/diary-pdf?month=8&year=2026
// Generates monthly cause list PDF server-side.
//
// WHY SERVER-SIDE: dart_pdf has known Bangla যুক্তাক্ষর shaping bugs.
// Server uses puppeteer/react-pdf with a proper Bangla font (Hind Siliguri).

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { generateDiaryPdf } from '@/lib/pdf/diary-generator'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') ?? '0')
  const year  = parseInt(searchParams.get('year')  ?? '0')

  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ message: 'Invalid month/year' }, { status: 400 })
  }

  const startDate = new Date(year, month - 1, 1)
  const endDate   = new Date(year, month, 0, 23, 59, 59)

  // Fetch all cases with hearings in this month
  const cases = await prisma.case.findMany({
    where: {
      chamberId: user.chamberId,
      deletedAt: null,
      nextDate:  { gte: startDate, lte: endDate },
    },
    include: {
      hearings: {
        where: { date: { gte: startDate, lte: endDate }, deletedAt: null },
        orderBy: { date: 'asc' },
      },
    },
    orderBy: [{ courtName: 'asc' }, { nextDate: 'asc' }],
  })

  // Group by day for the diary layout
  const byDay: Record<string, typeof cases> = {}
  for (const c of cases) {
    if (!c.nextDate) continue
    const key = c.nextDate.toISOString().substring(0, 10)
    ;(byDay[key] ??= []).push(c)
  }

  const pdfBuffer = await generateDiaryPdf({
    chamberName: `${user.name}-এর চেম্বার`,
    month, year, byDay,
  })

  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="diary-${months[month-1]}-${year}.pdf"`,
      'Cache-Control':       'no-store',
    },
  })
}
