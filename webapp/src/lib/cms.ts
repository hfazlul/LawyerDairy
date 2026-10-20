import { prisma } from './prisma'

export const CMS_DEFAULTS = {
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.mamlaq.app',
  shareUrl: '',
  homeVideoUrl: '',
  homeVideoTitle: 'MAMLAQ গাইড',
  homeBlogHtml:
    '<p>MAMLAQ বাংলাদেশি আইনজীবীদের জন্য ডায়েরি, আইনজীবী খোঁজা এবং লিগ্যাল ক্যারিয়ার এক জায়গায়। মামলা যোগ করুন মোবাইল অ্যাপে। প্যাকেজ নিন এই ওয়েবসাইট থেকে।</p>',
  contactIntro: 'প্রশ্ন, পেমেন্ট সাহায্য বা প্যাকেজ চালু করতে যোগাযোগ করুন।',
  contactEmail: '',
  contactPhone: '',
  contactWhatsapp: '',
  contactTelegram: '',
  footerBlurb: 'MAMLAQ Legal Management · MAMLAQ – Lawyer Diary',
  reminderD4Template: 'আপনার MAMLAQ প্যাকেজ ৪ দিন পর শেষ হবে। নবায়ন: {url}',
  reminderD3Template: 'আপনার MAMLAQ প্যাকেজ ৩ দিন পর শেষ হবে। নবায়ন: {url}',
  supportWhatsapp: '',
  smsRatePaisa: 40,
  waRatePaisa: 0,
}

export async function getCms() {
  try {
    const row = await prisma.cmsSettings.findUnique({ where: { id: 'current' } })
    if (row) return row
    return await prisma.cmsSettings.create({
      data: { id: 'current', ...CMS_DEFAULTS },
    })
  } catch {
    return { id: 'current', ...CMS_DEFAULTS, updatedAt: new Date() }
  }
}

export function youtubeOrDirectEmbed(url: string): { kind: 'youtube' | 'file' | 'none'; src: string } {
  const trimmed = url.trim()
  if (!trimmed) return { kind: 'none', src: '' }
  try {
    const u = new URL(trimmed)
    const host = u.hostname.replace(/^www\./, '')
    let id = ''
    if (host === 'youtu.be') id = u.pathname.replace(/^\//, '').split('/')[0] ?? ''
    else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2] ?? ''
      else id = u.searchParams.get('v') ?? ''
    }
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return { kind: 'youtube', src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1` }
    }
  } catch {
    /* ignore */
  }
  if (/^https?:\/\//i.test(trimmed)) return { kind: 'file', src: trimmed }
  return { kind: 'none', src: '' }
}
