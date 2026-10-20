import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

const patchSchema = z.object({
  lawyerNote: z.string().max(2000).optional(),
  legalIssue: z.string().max(300).optional(),
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'NOT_INTERESTED', 'SPAM_REPORTED']).optional(),
  read: z.boolean().optional(),
  readAt: z.string().datetime().optional().nullable(),
})

async function loadOwnedLead(userId: string, id: string) {
  const profile = await prisma.lawyerProfile.findUnique({ where: { userId } })
  if (!profile) return null
  return prisma.consultationRequest.findFirst({
    where: { id, lawyerProfileId: profile.id, deletedAt: null },
  })
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const lead = await loadOwnedLead(user.id, id)
  if (!lead) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  let body: z.infer<typeof patchSchema>
  try {
    body = patchSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const readAt =
    body.read === true
      ? new Date()
      : body.read === false
        ? null
        : body.readAt
          ? new Date(body.readAt)
          : undefined

  const updated = await prisma.consultationRequest.update({
    where: { id: lead.id },
    data: {
      lawyerNote: body.lawyerNote,
      legalIssue: body.legalIssue,
      status: body.status,
      readAt,
      firstContactedAt:
        body.status === 'CONTACTED' && !lead.firstContactedAt ? new Date() : undefined,
    },
  })
  return NextResponse.json({ ok: true, request: updated })
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const lead = await loadOwnedLead(user.id, id)
  if (!lead) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  await prisma.consultationRequest.update({
    where: { id: lead.id },
    data: { deletedAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}
