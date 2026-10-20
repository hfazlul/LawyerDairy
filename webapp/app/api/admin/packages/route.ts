import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAppRole } from '@/lib/auth-middleware'
import { originAllowed } from '@/lib/csrf'

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const admin = await requireAppRole(req, ['ADMIN'])
  if (!admin) return NextResponse.redirect(new URL('/hfazlul/login', req.url), 303)
  const fd = await req.formData()
  const id = String(fd.get('id') || '')
  const yearly = Number(fd.get('yearlyBdt') || 0)
  await prisma.subscriptionPackage.update({
    where: { id },
    data: {
      nameBn: String(fd.get('nameBn') || ''),
      nameEn: String(fd.get('nameEn') || ''),
      priceBdt: Number(fd.get('priceBdt') || 0),
      yearlyBdt: yearly > 0 ? yearly : null,
      smsMonthly: Number(fd.get('smsMonthly') || 0),
      teamSeats: Number(fd.get('teamSeats') || 0),
      active: fd.get('active') === 'on',
    },
  })
  return NextResponse.redirect(new URL('/hfazlul/packages', req.url), 303)
}
