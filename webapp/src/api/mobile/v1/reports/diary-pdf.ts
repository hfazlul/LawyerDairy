import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { generateDiaryPdf } from '@/lib/pdf/diary-generator'
import { withWorkspaceTx } from '@/lib/rls'
import { weekRangeFromStart } from '@/lib/dhaka-hours'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user?.activeMembership) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const day = searchParams.get('day')
  const weekStart = searchParams.get('weekStart')
  const variant = searchParams.get('variant')
  const includeRaw = searchParams.get('include') || ''
  const include = new Set(includeRaw.split(',').map((s) => s.trim()).filter(Boolean))
  const month = parseInt(searchParams.get('month') ?? '0')
  const year = parseInt(searchParams.get('year') ?? '0')

  let startDate: Date
  let endDate: Date
  let labelMonth: number
  let labelYear: number
  let filename: string

  if (weekStart && /^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    const range = weekRangeFromStart(weekStart)
    startDate = range.start
    endDate = range.end
    labelMonth = Number(weekStart.slice(5, 7))
    labelYear = Number(weekStart.slice(0, 4))
    filename = `diary-week-${weekStart}.pdf`
  } else if (variant === 'week' && day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const range = weekRangeFromStart(day)
    startDate = range.start
    endDate = range.end
    labelMonth = Number(day.slice(5, 7))
    labelYear = Number(day.slice(0, 4))
    filename = `diary-week-${day}.pdf`
  } else if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
    startDate = new Date(`${day}T00:00:00`)
    endDate = new Date(`${day}T23:59:59`)
    labelMonth = startDate.getMonth() + 1
    labelYear = startDate.getFullYear()
    filename = `diary-${day}.pdf`
  } else {
    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ message: 'Invalid month/year' }, { status: 400 })
    }
    startDate = new Date(year, month - 1, 1)
    endDate = new Date(year, month, 0, 23, 59, 59)
    labelMonth = month
    labelYear = year
    filename = `diary-${fileYearSafe(year)}-${month}.pdf`
  }

  const wsId = user.activeMembership.workspaceId
  const cases = await withWorkspaceTx(wsId, (tx) =>
    tx.case.findMany({
      where: {
        workspaceId: wsId,
        deletedAt: null,
        nextDate: { gte: startDate, lte: endDate },
      },
      include: {
        hearings: {
          where: { date: { gte: startDate, lte: endDate }, deletedAt: null },
          orderBy: { date: 'asc' },
        },
        parties: include.has('clients')
          ? { where: { deletedAt: null }, take: 8 }
          : false,
      },
      orderBy: [{ nextDate: 'asc' }],
    }),
  )

  const byDay: Record<string, typeof cases> = {}
  for (const c of cases) {
    if (!c.nextDate) continue
    const key = c.nextDate.toISOString().substring(0, 10)
    ;(byDay[key] ??= []).push(c)
  }

  const pdf = await generateDiaryPdf({
    chamberName: user.activeMembership.workspace.name,
    month: labelMonth,
    year: labelYear,
    byDay,
  })
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function fileYearSafe(year: number): number {
  return year
}
