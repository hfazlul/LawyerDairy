import type { Prisma, PrismaClient } from '@prisma/client'
import { findActiveUsersByName } from './login-name'

type Db = Prisma.TransactionClient | PrismaClient

export class SignupConflict extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SignupConflict'
  }
}

/** Looks up an existing account. Does not write. */
export async function signupConflictMessage(
  db: Db,
  input: { name: string; phone: string; email: string | null },
): Promise<string | null> {
  const phoneHit = await db.user.findFirst({
    where: { phone: input.phone, deletedAt: null },
    select: { id: true },
  })
  if (phoneHit) return 'সেভ হয়নি। এই মোবাইল নম্বরে অ্যাকাউন্ট আছে। লগইন করুন।'

  if (input.email) {
    const emailHit = await db.user.findFirst({
      where: { email: input.email, deletedAt: null },
      select: { id: true },
    })
    if (emailHit) return 'সেভ হয়নি। এই ইমেইলে অ্যাকাউন্ট আছে। লগইন করুন।'
  }

  const names = await findActiveUsersByName(input.name, db)
  if (names.length > 0) return 'সেভ হয়নি। এই নামে অ্যাকাউন্ট আছে। অন্য নাম দিন।'
  return null
}

export async function freeUsername(db: Db, base: string): Promise<string> {
  const root = base.slice(0, 20)
  for (let i = 0; i < 8; i++) {
    const candidate = (i === 0 ? base : `${root}${i}`).slice(0, 24)
    const hit = await db.user.findUnique({ where: { username: candidate }, select: { id: true } })
    if (!hit) return candidate
  }
  return `${root}${Date.now().toString().slice(-4)}`.slice(0, 24)
}
