import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addYmd, ymdInDhaka } from '@/lib/fcm/dhaka'
import { getCms } from '@/lib/cms'
import { sendSmsHybrid } from '@/lib/sms-hybrid'
import { publicSiteUrl } from '@/lib/entitlement-gates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET
  const hdr =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return Boolean(secret && hdr === secret)
}

export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const cms = await getCms()
  const today = ymdInDhaka()
  const d4 = addYmd(today, 4)
  const d3 = addYmd(today, 3)
  const url = `${publicSiteUrl()}/package`
  let sent = 0
  for (const [ymd, tpl, kind] of [
    [d4, cms.reminderD4Template, 'sub_d4'],
    [d3, cms.reminderD3Template, 'sub_d3'],
  ] as const) {
    const dayStart = new Date(`${ymd}T00:00:00+06:00`)
    const dayEnd = new Date(`${ymd}T23:59:59+06:00`)
    const rows = await prisma.workspace.findMany({
      where: { plan: { not: 'FREE' }, planExpiresAt: { gte: dayStart, lte: dayEnd } },
      include: { owner: true },
      take: 400,
    })
    for (const w of rows) {
      const text = tpl.replace('{url}', url)
      const sms = await sendSmsHybrid({ phone: w.owner.phone, message: text, kind, workspaceId: w.id })
      if (sms.ok) sent++
    }
  }
  return NextResponse.json({ ok: true, sent, ymd: today })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
