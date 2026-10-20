import { NextRequest, NextResponse } from 'next/server'
import { requireAppRole } from '@/lib/auth-middleware'
import { originAllowed } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { sendSmsHybrid } from '@/lib/sms-hybrid'

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const admin = await requireAppRole(req, ['ADMIN'])
  if (!admin) return NextResponse.redirect(new URL('/hfazlul/login', req.url), 303)
  const fd = await req.formData()
  const limit = Math.min(1000, Math.max(1, Number(fd.get('limit') || 100)))
  const message = String(fd.get('message') || 'MAMLAQ প্যাকেজ নিন: ওয়েবসাইটে পে করুন।')
  const freeOwners = await prisma.workspace.findMany({
    where: { plan: 'FREE', kind: 'PERSONAL' },
    include: { owner: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
  let sent = 0
  for (const w of freeOwners) {
    const r = await sendSmsHybrid({ phone: w.owner.phone, message, kind: 'upsell_bulk' })
    if (r.ok) sent += 1
  }
  return NextResponse.redirect(new URL(`/hfazlul/messaging?sent=${sent}`, req.url), 303)
}
