import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { applyReferralCode, ensureReferralCode } from '@/lib/referral'
import { publicSiteUrl } from '@/lib/entitlement-gates'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const code = await prisma.$transaction((tx) => ensureReferralCode(tx, user.id, user.username))
  const n = await prisma.referralAttribution.count({
    where: { referrerId: user.id, qualifiedAt: { not: null } },
  })
  const play = (await prisma.cmsSettings.findUnique({ where: { id: 'current' } }))?.playStoreUrl
    || 'https://play.google.com/store/apps/details?id=com.mamlaq.app'
  const share = `${play}\nMAMLAQ – Lawyer Diary ইনস্টল করুন, তারপর ড্রয়ার → Referral-এ এই কোড পেস্ট করুন: ${code}`
  return NextResponse.json({ code, qualified: n, shareText: share, web: publicSiteUrl() })
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { code?: string; fingerprint?: string }
  if (!body.code) return NextResponse.json({ message: 'code required' }, { status: 400 })
  const applied = await prisma.$transaction((tx) =>
    applyReferralCode(tx, {
      referredUserId: user.id,
      code: body.code!,
      installFingerprint: body.fingerprint || user.jwtDeviceId || user.installFingerprint,
    }),
  )
  if (!applied.ok) return NextResponse.json({ ok: false, reason: applied.reason }, { status: 400 })
  return NextResponse.json({
    ok: true,
    qualified: false,
    messageBn: 'রেফারেল গণনা হবে যখন নতুন ব্যবহারকারী অন্তত এক সপ্তাহ অ্যাপ ব্যবহার করবেন।',
  })
}
