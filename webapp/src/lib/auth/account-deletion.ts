import { prisma } from '@/lib/prisma'

export const ACCOUNT_GRACE_MS = 30 * 24 * 60 * 60 * 1000

export function purgeAtFrom(deletedAt: Date): Date {
  return new Date(deletedAt.getTime() + ACCOUNT_GRACE_MS)
}

export function isWithinDeletionGrace(deletedAt: Date, now = new Date()): boolean {
  return now.getTime() < purgeAtFrom(deletedAt).getTime()
}

/** Irreversible anonymisation after the 30-day grace. */
export async function anonymizeDeletedUser(userId: string) {
  const stubPhone = `+000${userId.replace(/\D/g, '').slice(0, 11).padEnd(11, '0')}`
  await prisma.user.update({
    where: { id: userId },
    data: {
      username: `deleted_${userId.slice(0, 8)}`,
      phone: stubPhone,
      email: null,
      name: 'Deleted account',
    },
  })
}
