import type { Prisma, PrismaClient, User } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type NameDb = Prisma.TransactionClient | PrismaClient

export const nameTakenMessageBn =
  'এই নামে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। অন্য নাম দিয়ে সাইন আপ করুন।'

export const nameAmbiguousMessageBn =
  'এই নামে একাধিক অ্যাকাউন্ট আছে। সাপোর্টে যোগাযোগ করুন।'

export function collapseName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

export async function findActiveUsersByName(name: string, db: NameDb = prisma): Promise<User[]> {
  const collapsed = collapseName(name)
  if (!collapsed) return []
  return db.user.findMany({
    where: {
      deletedAt: null,
      name: { equals: collapsed, mode: 'insensitive' },
    },
  })
}
