import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAppRole } from '@/lib/auth-middleware'
import { originAllowed } from '@/lib/csrf'

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const admin = await requireAppRole(req, ['ADMIN'])
  if (!admin) return NextResponse.redirect(new URL('/hfazlul/login', req.url), 303)
  const fd = await req.formData()
  const num = (k: string, d = 0) => {
    const n = Number(fd.get(k) ?? d)
    return Number.isFinite(n) ? n : d
  }
  await prisma.cmsSettings.upsert({
    where: { id: 'current' },
    create: { id: 'current' },
    update: {
      playStoreUrl: String(fd.get('playStoreUrl') || ''),
      shareUrl: String(fd.get('shareUrl') || ''),
      homeVideoUrl: String(fd.get('homeVideoUrl') || ''),
      homeVideoTitle: String(fd.get('homeVideoTitle') || ''),
      homeBlogHtml: String(fd.get('homeBlogHtml') || ''),
      contactIntro: String(fd.get('contactIntro') || ''),
      contactEmail: String(fd.get('contactEmail') || ''),
      contactPhone: String(fd.get('contactPhone') || ''),
      contactWhatsapp: String(fd.get('contactWhatsapp') || ''),
      contactTelegram: String(fd.get('contactTelegram') || ''),
      footerBlurb: String(fd.get('footerBlurb') || ''),
      reminderD4Template: String(fd.get('reminderD4Template') || ''),
      reminderD3Template: String(fd.get('reminderD3Template') || ''),
      supportWhatsapp: String(fd.get('supportWhatsapp') || ''),
      smsRatePaisa: num('smsRatePaisa', 40),
      waRatePaisa: num('waRatePaisa', 0),
    },
  })
  return NextResponse.redirect(new URL('/hfazlul/cms', req.url), 303)
}
