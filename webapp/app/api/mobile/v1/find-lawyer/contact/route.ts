import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, planOf, planExpires } from '@/lib/auth-middleware'
import { z } from 'zod'
import { newId } from '@/lib/crypto-tokens'
import { isPremiumActive } from '@/lib/entitlement-gates'
import { freeCapsForMonth, freeMonthNumber } from '@/lib/free-caps'
import { dhakaYmd } from '@/lib/habit'

const schema = z.object({
  lawyerProfileId: z.string(),
  legalIssue: z.string().max(300).optional(),
  preferredContactTime: z.enum(['ANYTIME', 'MORNING', 'AFTERNOON', 'EVENING']).optional(),
  districtId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = schema.parse(await req.json())
  const lawyer = await prisma.lawyerProfile.findFirst({
    where: { id: body.lawyerProfileId, isListed: true, deletedAt: null },
    include: { user: true },
  })
  if (!lawyer) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const clientPaid = isPremiumActive(planOf(user), planExpires(user))
  if (!clientPaid) {
    const distinct = await prisma.consultationRequest.findMany({
      where: { requesterUserId: user.id },
      distinct: ['lawyerProfileId'],
      select: { lawyerProfileId: true },
    })
    const already = distinct.some((d) => d.lawyerProfileId === lawyer.id)
    if (!already && distinct.length >= 3) {
      return NextResponse.json({
        error: 'starter_required',
        messageBn: '৪র্থ আইনজীবীর সাথে যোগাযোগ করতে Starter প্যাকেজ নিন (ওয়েবসাইটে পে করুন)।',
      }, { status: 402 })
    }
  }

  const lawyerWs = await prisma.workspace.findFirst({
    where: { ownerUserId: lawyer.userId, kind: 'PERSONAL', deletedAt: null },
  })
  const lawyerPaid = lawyerWs ? isPremiumActive(lawyerWs.plan, lawyerWs.planExpiresAt) : false
  if (!lawyerPaid) {
    const monthN = freeMonthNumber(lawyer.user.createdAt)
    const cap = freeCapsForMonth(monthN).findLawyerReceive
    const ym = dhakaYmd(new Date()).slice(0, 7)
    const monthStart = new Date(`${ym}-01T00:00:00+06:00`)
    const received = await prisma.consultationRequest.count({
      where: { lawyerProfileId: lawyer.id, createdAt: { gte: monthStart } },
    })
    if (received >= cap) {
      return NextResponse.json({
        error: 'lawyer_receive_cap',
        messageBn: 'এই আইনজীবীর ফ্রি অ্যাপয়েন্টমেন্ট কোটা শেষ।',
      }, { status: 429 })
    }
  }

  const since = new Date(Date.now() - 14 * 86400000)
  const recent = await prisma.consultationRequest.count({
    where: {
      lawyerProfileId: lawyer.id,
      requesterUserId: user.id,
      createdAt: { gte: since },
    },
  })
  if (recent >= 3) {
    return NextResponse.json({ error: 'rate_limited', messageBn: '১৪ দিনে সর্বোচ্চ ৩টি অনুরোধ' }, { status: 429 })
  }

  const now = new Date()
  const lead = await prisma.consultationRequest.create({
    data: {
      id: newId(),
      lawyerProfileId: lawyer.id,
      requesterUserId: user.id,
      requesterName: user.name,
      requesterPhone: user.phone,
      requesterEmail: user.email,
      districtId: body.districtId,
      legalIssue: body.legalIssue,
      preferredContactTime: body.preferredContactTime,
      phoneRevealedAt: now,
      notifiedAt: now,
      pushStatus: 'PENDING',
      smsStatus: 'SKIPPED',
    },
  })

  try {
    const { notifyLeadIncoming } = await import('@/lib/fcm/jobs')
    await notifyLeadIncoming({ lawyerUserId: lawyer.userId, appointmentId: lead.id })
    await prisma.consultationRequest.update({
      where: { id: lead.id },
      data: { pushStatus: 'SENT' },
    })
  } catch {
    await prisma.consultationRequest.update({
      where: { id: lead.id },
      data: { pushStatus: 'SKIPPED' },
    })
  }

  const phone = (lawyer.publicPhone || '').trim()
  return NextResponse.json({
    request: { id: lead.id, status: lead.status },
    lawyerPhone: phone || null,
    messageBn: phone
      ? 'এই নম্বরে আইনজীবীর সাথে যোগাযোগ করুন আপনার সমস্যা সমাধানের জন্য'
      : 'এই আইনজীবীর প্রফেশনাল প্রোফাইলে মোবাইল নম্বর নেই।',
    lawyerNoticeBn: 'ক্লায়েন্ট আপনার সাথে যোগাযোগ করতে চাচ্ছে',
  })
}
