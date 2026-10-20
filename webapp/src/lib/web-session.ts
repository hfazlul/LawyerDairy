import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from './prisma'
import { verifyJwt } from './jwt'
import type { Plan, User, Workspace, WorkspaceMember } from '@prisma/client'

export type UserWithWorkspaces = User & {
  memberships: (WorkspaceMember & { workspace: Workspace })[]
}

export async function readWebUser(): Promise<UserWithWorkspaces | null> {
  const jar = await cookies()
  const token = jar.get('ldb_access')?.value
  const payload = token ? verifyJwt(token) : null
  if (!payload?.sub) return null
  const user = await prisma.user.findUnique({
    where: { id: payload.sub as string },
    include: {
      memberships: { where: { status: 'ACTIVE', deletedAt: null }, include: { workspace: true } },
    },
  })
  if (!user || user.deletedAt) return null
  prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {})
  return user
}

export async function requireWebUser(nextPath = '/user'): Promise<UserWithWorkspaces> {
  const user = await readWebUser()
  if (!user) redirect(`/user/login?next=${encodeURIComponent(nextPath)}`)
  return user
}

export function personalWorkspace(user: UserWithWorkspaces): Workspace | undefined {
  return user.memberships.find((m) => m.workspace.kind === 'PERSONAL')?.workspace
    ?? user.memberships[0]?.workspace
}

export function planOfUser(user: UserWithWorkspaces): Plan {
  return personalWorkspace(user)?.plan ?? 'FREE'
}
