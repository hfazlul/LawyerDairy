import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/session'
import { isWithinDeletionGrace, purgeAtFrom } from '@/lib/auth/account-deletion'
import { normalizeBdPhone } from '@/lib/identity'

const schema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
})

/** Restore a soft-deleted account within the 30-day grace window. */
export async function POST(req: NextRequest) {
  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const ident = body.identifier.trim()
  const phone = normalizeBdPhone(ident)
  const user = await prisma.user.findFirst({
    where: {
      deletedAt: { not: null },
      OR: [{ username: ident.toLowerCase() }, ...(phone ? [{ phone }] : [])],
    },
  })
  if (!user?.deletedAt) {
    return NextResponse.json({ error: 'not_pending', messageBn: 'পুনরুদ্ধারযোগ্য অ্যাকাউন্ট নেই' }, { status: 404 })
  }
  if (!isWithinDeletionGrace(user.deletedAt)) {
    return NextResponse.json(
      { error: 'grace_expired', messageBn: '৩০ দিনের গ্রেস শেষ — পুনরুদ্ধার সম্ভব নয়' },
      { status: 410 },
    )
  }
  const ok = await verifyPassword(body.password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'invalid_password', messageBn: 'পাসওয়ার্ড ভুল' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: null },
  })
  return NextResponse.json({
    ok: true,
    messageBn: 'অ্যাকাউন্ট পুনরুদ্ধার হয়েছে — আবার লগইন করুন',
    purgeWouldHaveBeen: purgeAtFrom(user.deletedAt).toISOString(),
  })
}
