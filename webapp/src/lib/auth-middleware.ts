import { NextRequest } from 'next/server'
import { verifyJwt } from './jwt'
import { prisma } from './prisma'
import type { AppRole, Plan } from '@prisma/client'
import {
  isPremiumActive,
  hasProAdvance,
  hasCauseListAccess,
  hasCaseManageAccess,
  maxTeamMembers,
} from './entitlement-gates'

export type AuthUser = NonNullable<Awaited<ReturnType<typeof requireAuth>>>

export async function requireAuth(req: NextRequest) {
  const header = req.headers.get('authorization') ?? ''
  let token = header.startsWith('Bearer ') ? header.slice(7) : ''

  // Cookie session for web dashboards
  if (!token) {
    token = req.cookies.get('ldb_access')?.value ?? ''
  }
  if (!token) return null

  const payload = verifyJwt(token)
  if (!payload?.sub) return null

  return prisma.user.findUnique({
    where: { id: payload.sub as string },
    include: { chamber: true },
  })
}

export async function requireAppRole(req: NextRequest, roles: AppRole[]) {
  const user = await requireAuth(req)
  if (!user) return null
  if (!roles.includes(user.appRole)) return null
  return user
}

export {
  isPremiumActive,
  hasProAdvance,
  hasCauseListAccess,
  hasCaseManageAccess,
  maxTeamMembers,
}
export type { Plan }
