import { NextRequest } from 'next/server'
import { verifyJwt } from './jwt'
import { prisma } from './prisma'
import type { AppRole, MemberRole, Plan, Workspace } from '@prisma/client'
import { resolvePermissions, type PermissionKey } from './permissions'
import {
  isPremiumActive,
  hasProAdvance,
  hasCauseListAccess,
  hasCaseManageAccess,
  maxTeamMembers,
} from './entitlement-gates'
import { fullAccessExpiry, fullAccessPlan } from './full-access'
import { touchReferralActivity } from './referral'

export type AuthedMembership = {
  workspaceId: string
  role: MemberRole
  scopeMode: 'ALL' | 'ASSIGNED_ONLY'
  permissions: Set<string>
  workspace: Workspace
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof requireAuth>>>

function tokenFrom(req: NextRequest): string {
  const header = req.headers.get('authorization') ?? ''
  let token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) token = req.cookies.get('mq_admin')?.value ?? ''
  if (!token) token = req.cookies.get('ldb_access')?.value ?? ''
  return token
}

export async function requireAuth(req: NextRequest) {
  const token = tokenFrom(req)
  if (!token) return null
  const payload = verifyJwt(token)
  if (!payload?.sub) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.sub as string },
    include: {
      memberships: {
        where: { status: 'ACTIVE', deletedAt: null },
        include: { workspace: true, permissions: true },
      },
    },
  })
  if (!user || user.deletedAt) return null

  const seen = user.lastSeenAt?.getTime() ?? 0
  if (Date.now() - seen > 6 * 60 * 60 * 1000) {
    touchReferralActivity(user.id)
  }

  const memberships: AuthedMembership[] = user.memberships.map((m) => ({
    workspaceId: m.workspaceId,
    role: m.role,
    scopeMode: m.scopeMode,
    permissions: resolvePermissions(
      m.role,
      m.permissions.map((p) => ({ permissionKey: p.permissionKey, effect: p.effect })),
    ),
    workspace: m.workspace,
  }))

  const personal = memberships.find((m) => m.workspace.kind === 'PERSONAL') ?? memberships[0]
  const requested =
    req.headers.get('x-workspace-id') ||
    req.nextUrl.searchParams.get('workspaceId') ||
    ''
  const active =
    memberships.find((m) => m.workspaceId === requested) ?? personal ?? null

  return {
    ...user,
    jwtDeviceId:
      typeof payload.deviceId === 'string' && payload.deviceId.length > 0
        ? payload.deviceId
        : null,
    memberships,
    activeMembership: active,
    /** @deprecated use activeMembership.workspaceId */
    workspaceId: active?.workspaceId ?? '',
    chamber: active?.workspace ?? null,
    chamberId: active?.workspaceId ?? '',
  }
}

export async function requireWorkspace(
  req: NextRequest,
  permission?: PermissionKey,
) {
  const user = await requireAuth(req)
  if (!user?.activeMembership) return null
  if (permission && !user.activeMembership.permissions.has(permission)) return null
  return user
}

export async function requireAppRole(req: NextRequest, roles: AppRole[]) {
  const user = await requireAuth(req)
  if (!user) return null
  if (!roles.includes(user.appRole)) return null
  return user
}

export function planOf(user: AuthUser): Plan {
  return fullAccessPlan(user, user.activeMembership?.workspace.plan ?? 'FREE')
}

export function planExpires(user: AuthUser): Date | null {
  return fullAccessExpiry(user, user.activeMembership?.workspace.planExpiresAt ?? null)
}

export {
  isPremiumActive,
  hasProAdvance,
  hasCauseListAccess,
  hasCaseManageAccess,
  maxTeamMembers,
}
export type { Plan }
