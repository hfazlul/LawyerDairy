import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { verifyPassword } from '@/lib/auth/session'

const schema = z.object({ password: z.string().min(1) })

/** Play policy: in-app account deletion. Soft-delete + revoke sessions. */
export async function DELETE(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  const ok = await verifyPassword(body.password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'invalid_password', messageBn: 'পাসওয়ার্ড ভুল' }, { status: 401 })
  }

  const now = new Date()
  const purgeAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  await prisma.$transaction([
    prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: now } }),
    prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: now },
    }),
  ])

  return NextResponse.json({
    ok: true,
    purgeAt: purgeAt.toISOString(),
    messageBn: 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ গৃহীত। ৩০ দিনের মধ্যে লগইন করে পুনরুদ্ধার করা যাবে। তারপর পরিচয় মুছে যাবে।',
  })
}
