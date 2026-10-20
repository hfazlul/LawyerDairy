import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAppRole } from '@/lib/auth-middleware'
import { originAllowed } from '@/lib/csrf'
import { activatePlanForWorkspace } from '@/lib/billing'
import { planFromPackageCode } from '@/lib/plans'
import { normalizeBdPhone } from '@/lib/identity'

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  const admin = await requireAppRole(req, ['ADMIN'])
  if (!admin) return NextResponse.redirect(new URL('/hfazlul/login', req.url), 303)
  const fd = await req.formData()
  const identifier = String(fd.get('identifier') || '').trim()
  const packageCode = String(fd.get('packageCode') || 'STARTER')
  const months = Math.max(1, Number(fd.get('months') || 1))
  const note = String(fd.get('note') || '')
  const plan = planFromPackageCode(packageCode)
  if (!plan) return NextResponse.redirect(new URL('/hfazlul/activate?err=pkg', req.url), 303)
  const phone = normalizeBdPhone(identifier)
  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
        ...(phone ? [{ phone }] : []),
      ],
    },
  })
  if (!user) return NextResponse.redirect(new URL('/hfazlul/activate?err=user', req.url), 303)
  const ws = await prisma.workspace.findFirst({
    where: { ownerUserId: user.id, kind: 'PERSONAL', deletedAt: null },
  })
  if (!ws) return NextResponse.redirect(new URL('/hfazlul/activate?err=ws', req.url), 303)
  await prisma.$transaction(async (tx) => {
    await activatePlanForWorkspace(tx, {
      workspaceId: ws.id,
      plan,
      months,
      gateway: 'admin_manual',
      gatewayRef: `admin:${admin.id}:${Date.now()}`,
      packageCode,
    })
    await tx.paymentClaim.create({
      data: {
        userId: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        packageCode,
        months,
        note,
        status: 'APPROVED',
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    })
    await tx.auditLog.create({
      data: {
        workspaceId: ws.id,
        actorUserId: admin.id,
        action: 'subscription.manual_activate',
        entity: 'Subscription',
        entityId: ws.id,
        summaryBn: `${packageCode} ${months} মাস — ম্যানুয়াল`,
        changesJson: { packageCode, months, note },
      },
    }).catch(() => {})
  })
  return NextResponse.redirect(new URL('/hfazlul/users', req.url), 303)
}
