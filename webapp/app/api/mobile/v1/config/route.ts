import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicSiteUrl } from '@/lib/entitlement-gates'

function envUrl(key: string): string {
  const v = process.env[key]?.trim() ?? ''
  if (!v) return ''
  try {
    const u = new URL(v)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return ''
    return v
  } catch {
    return ''
  }
}

type GuideVideo = { id: string; url: string; titleBn: string; titleEn: string }

function envGuideVideos(): GuideVideo[] {
  const parts: GuideVideo[] = []
  const urls = [envUrl('GUIDE_PART_1_URL'), envUrl('GUIDE_PART_2_URL'), envUrl('GUIDE_PART_3_URL')]
  urls.forEach((url, i) => {
    if (!url) return
    parts.push({
      id: `part_${i + 1}`,
      url,
      titleBn: `গাইড ${i + 1}`,
      titleEn: `Guide ${i + 1}`,
    })
  })
  return parts
}

function envGuideCard(): { textBn: string; textEn: string; link: string; enabled: boolean } | null {
  const raw = process.env.GUIDE_CARD_JSON?.trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      textBn: String(parsed.textBn || ''),
      textEn: String(parsed.textEn || ''),
      link: String(parsed.link || ''),
      enabled: parsed.enabled !== false,
    }
  } catch {
    return null
  }
}

export async function GET() {
  let config: { configVersion: number; minAppVersion: string; killSwitches: unknown; limits: unknown; guideVideos: unknown; guideCard: unknown } | null = null
  try {
    config = await prisma.appConfig.findUnique({ where: { id: 'current' } })
  } catch {
    config = null
  }
  const dbVideos = Array.isArray(config?.guideVideos) ? (config?.guideVideos as GuideVideo[]) : []
  const dbCard = config?.guideCard && typeof config.guideCard === 'object'
    ? (config.guideCard as { textBn?: string; textEn?: string; link?: string; enabled?: boolean })
    : null
  let cms: { playStoreUrl?: string; supportWhatsapp?: string; shareUrl?: string; contactEmail?: string } | null = null
  try {
    cms = await prisma.cmsSettings.findUnique({ where: { id: 'current' } })
  } catch {
    cms = null
  }
  const payOnWeb = `${publicSiteUrl()}/package`

  return NextResponse.json({
    configVersion: config?.configVersion ?? 2,
    minAppVersion: config?.minAppVersion ?? '1.0.0',
    killSwitches: config?.killSwitches ?? [],
    limits: config?.limits ?? {},
    privacyPolicyUrl: envUrl('PRIVACY_POLICY_URL'),
    termsUrl: envUrl('TERMS_URL'),
    contactUrl: envUrl('CONTACT_URL'),
    guideBdUrl: envUrl('GUIDE_BD_URL'),
    guideVideos: dbVideos.length ? dbVideos : envGuideVideos(),
    guideCard: dbCard
      ? {
          textBn: dbCard.textBn || '',
          textEn: dbCard.textEn || '',
          link: dbCard.link || '',
          enabled: dbCard.enabled !== false,
        }
      : envGuideCard(),
    playStoreUrl: cms?.playStoreUrl || envUrl('NEXT_PUBLIC_PLAY_STORE_URL') ||
      'https://play.google.com/store/apps/details?id=com.mamlaq.app',
    shareUrl: (cms?.shareUrl || '').trim(),
    contactEmail: (cms?.contactEmail || '').trim(),
    payOnWebUrl: payOnWeb,
    supportWhatsapp: cms?.supportWhatsapp || '',
    paymentHelp: {
      visitWeb: true,
      noInAppWalletNumbers: true,
    },
  })
}
