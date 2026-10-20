import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from './prisma'
import { verifyJwt } from './jwt'
import type { User } from '@prisma/client'

export const ADMIN_COOKIE = 'mq_admin'

export async function readAdminUser(): Promise<User | null> {
  const jar = await cookies()
  const token = jar.get(ADMIN_COOKIE)?.value
  const payload = token ? verifyJwt(token) : null
  if (!payload?.sub || payload.kind !== 'admin') return null
  const user = await prisma.user.findUnique({ where: { id: payload.sub as string } })
  if (!user || user.deletedAt || user.appRole !== 'ADMIN') return null
  return user
}

export async function requireAdminPage(_nextPath = '/hfazlul'): Promise<User> {
  const user = await readAdminUser()
  if (!user) redirect('/hfazlul/login')
  return user
}

export async function adminCount(): Promise<number> {
  return prisma.user.count({ where: { appRole: 'ADMIN', deletedAt: null } })
}
