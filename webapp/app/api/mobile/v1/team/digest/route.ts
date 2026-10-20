import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireWorkspace } from '@/lib/auth-middleware'
import { sendEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const user = await requireWorkspace(req, 'audit.view')
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const wsId = user.activeMembership.workspaceId
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [audit, changes, members] = await Promise.all([
    prisma.auditLog.count({ where: { workspaceId: wsId, occurredAt: { gte: from } } }),
    prisma.changeLog.groupBy({
      by: ['entity'],
      where: { workspaceId: wsId, committedAt: { gte: from } },
      _count: true,
    }),
    prisma.workspaceMember.count({
      where: { workspaceId: wsId, deletedAt: null, status: { not: 'REMOVED' } },
    }),
  ])

  const byEntity = Object.fromEntries(changes.map((c) => [c.entity, c._count]))
  const summaryBn = `গত ৭ দিনে ${audit}টি অডিট ইভেন্ট, সিঙ্ক পরিবর্তন: ${
    Object.entries(byEntity).map(([k, v]) => `${k}=${v}`).join(', ') || 'নেই'
  }। সদস্য: ${members}।`

  const wantEmail = req.nextUrl.searchParams.get('email') === '1'
  let emailed = false
  if (wantEmail && user.email) {
    const result = await sendEmail({
      to: user.email,
      subject: `Weekly workspace digest — ${user.activeMembership.workspace.name}`,
      html: `<p>${summaryBn}</p>`,
    })
    emailed = result.ok && !result.dryRun
  }

  return NextResponse.json({
    from: from.toISOString(),
    to: new Date().toISOString(),
    auditCount: audit,
    changeCountByEntity: byEntity,
    memberCount: members,
    summaryBn,
    emailed,
    emailNote: user.email
      ? emailed
        ? 'sent'
        : 'mail provider dry-run or skipped'
      : 'no email on file — in-app only',
  })
}
