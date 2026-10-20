import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { chamberAccessKeys } from '@/lib/team/chamber-access'
import { personalWorkspace, readWebUser } from '@/lib/web-session'

const schema = z.object({
  clients: z.enum(['read', 'write']),
  cases: z.enum(['read', 'write']),
  causeList: z.enum(['read', 'write']),
})

/** Same chamber grant the mobile app sends: clients, cases, cause list, each read or write. */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await readWebUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const ws = personalWorkspace(user)
  if (!ws) return NextResponse.json({ message: 'No workspace' }, { status: 400 })
  const mine = user.memberships.find((m) => m.workspaceId === ws.id)
  if (!mine || (mine.role !== 'OWNER' && mine.role !== 'ADMIN')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params
  const member = await prisma.workspaceMember.findFirst({
    where: { id, workspaceId: ws.id, deletedAt: null },
  })
  if (!member) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (member.role === 'OWNER') {
    return NextResponse.json({ message: 'মালিক পরিবর্তন করা যায় না' }, { status: 400 })
  }

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const keys = chamberAccessKeys(body)
  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.update({
      where: { id },
      data: { role: 'STAFF', permissionsVersion: { increment: 1 } },
    })
    await tx.memberPermission.deleteMany({ where: { workspaceMemberId: id } })
    await tx.memberPermission.createMany({
      data: keys.map((k) => ({
        workspaceMemberId: id,
        permissionKey: k.permissionKey,
        effect: k.effect,
        grantedByUserId: user.id,
      })),
    })
    await tx.auditLog.create({
      data: {
        workspaceId: ws.id,
        actorUserId: user.id,
        action: 'team.chamber',
        entity: 'member',
        entityId: id,
        summaryBn: 'চেম্বার অনুমতি: মক্কেল, মামলা, কজলিস্ট',
      },
    })
  })

  return NextResponse.json({ ok: true })
}
