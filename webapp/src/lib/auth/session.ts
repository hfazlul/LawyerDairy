import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/jwt'
import { hashToken, newId, randomOpaqueToken } from '@/lib/crypto-tokens'
import { extraTeamSeats, monthlySmsCredits, resolvePermissions } from '@/lib/permissions'
import { entitlementPayload } from '@/lib/entitlement-gates'
import type { MemberRole, Plan, Prisma, ScopeMode } from '@prisma/client'

const ACCESS_TTL = '15m'
const REFRESH_MS = 30 * 24 * 60 * 60 * 1000

export type DeviceInput = {
  deviceId?: string
  label?: string
  platform?: string
  appVersion?: string
  osVersion?: string
}

export async function createPersonalWorkspace(
  tx: Prisma.TransactionClient,
  userId: string,
  displayName: string,
) {
  const workspace = await tx.workspace.create({
    data: {
      name: 'আমার ডায়েরি',
      kind: 'PERSONAL',
      ownerUserId: userId,
      plan: 'FREE',
      memberLimit: extraTeamSeats('FREE'),
      smsCredits: monthlySmsCredits('FREE'),
    },
  })
  await tx.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId,
      role: 'OWNER',
      scopeMode: 'ALL',
      status: 'ACTIVE',
      joinedAt: new Date(),
    },
  })
  return workspace
}

export async function issueSession(opts: {
  userId: string
  device?: DeviceInput
  ip?: string
  userAgent?: string
  tx?: Prisma.TransactionClient
}) {
  const db = opts.tx ?? prisma
  const refreshToken = randomOpaqueToken()
  let deviceId: string | undefined
  if (opts.device?.deviceId || opts.device?.platform) {
    const id = opts.device.deviceId || newId()
    const device = await db.device.upsert({
      where: { id },
      create: {
        id,
        userId: opts.userId,
        label: opts.device.label,
        platform: opts.device.platform || 'web',
        appVersion: opts.device.appVersion,
        osVersion: opts.device.osVersion,
        lastSeenAt: new Date(),
      },
      update: {
        label: opts.device.label,
        appVersion: opts.device.appVersion,
        lastSeenAt: new Date(),
        revokedAt: null,
      },
    })
    deviceId = device.id
  }

  await db.session.create({
    data: {
      userId: opts.userId,
      deviceId,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: opts.userAgent,
      ipAddress: opts.ip,
      expiresAt: new Date(Date.now() + REFRESH_MS),
      lastUsedAt: new Date(),
    },
  })

  const accessToken = signJwt({ sub: opts.userId, deviceId, jti: newId() }, ACCESS_TTL)
  const accessExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const refreshExpiresAt = new Date(Date.now() + REFRESH_MS).toISOString()
  return { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt, deviceId }
}

export async function revokeSessionByRefreshToken(refreshToken: string) {
  const hash = hashToken(refreshToken)
  const session = await prisma.session.findFirst({
    where: { refreshTokenHash: hash },
    select: { id: true, deviceId: true },
  })
  await prisma.session.updateMany({
    where: { refreshTokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  if (session?.deviceId) {
    await prisma.device.updateMany({
      where: { id: session.deviceId },
      data: { pushToken: null },
    })
  }
}

export async function rotateRefreshToken(refreshToken: string) {
  const hash = hashToken(refreshToken)
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: hash },
    include: { user: true, device: true },
  })
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    if (session?.revokedAt) {
      await prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
    return null
  }
  if (session.user.deletedAt) return null
  if (session.device?.revokedAt) return null

  const next = randomOpaqueToken()
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashToken(next),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_MS),
    },
  })
  const accessToken = signJwt(
    { sub: session.userId, deviceId: session.deviceId, jti: newId() },
    ACCESS_TTL,
  )
  return {
    user: session.user,
    accessToken,
    refreshToken: next,
    accessExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    refreshExpiresAt: new Date(Date.now() + REFRESH_MS).toISOString(),
    deviceId: session.deviceId,
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export async function buildLoginEnvelope(userId: string, tx?: Prisma.TransactionClient) {
  const db = tx ?? prisma
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      memberships: {
        where: { status: 'ACTIVE', deletedAt: null },
        include: {
          workspace: true,
          permissions: true,
        },
      },
    },
  })

  const workspaces = user.memberships.map((m) => {
    const perms = resolvePermissions(
      m.role,
      m.permissions.map((p) => ({ permissionKey: p.permissionKey, effect: p.effect })),
    )
    return {
      id: m.workspace.id,
      name: m.workspace.name,
      kind: m.workspace.kind.toLowerCase(),
      role: m.role.toLowerCase() as Lowercase<MemberRole>,
      scopeMode: m.scopeMode.toLowerCase() as Lowercase<ScopeMode>,
      permissions: [...perms],
      scopeHash: `${m.scopeMode}:${m.permissionsVersion}`,
      plan: m.workspace.plan,
    }
  })

  const personal = user.memberships.find((m) => m.workspace.kind === 'PERSONAL')
  const plan = (personal?.workspace.plan ?? 'FREE') as Plan
  const entitlement = entitlementPayload(plan, personal?.workspace.planExpiresAt ?? null, {
    userCreatedAt: user.createdAt,
    trialEndsAt: user.webTrialEndsAt,
  })

  const configRow = await db.appConfig.findUnique({ where: { id: 'current' } })

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      phoneVerified: false,
      email: user.email,
      uiLanguage: user.uiLanguage,
      barRegNo: user.barRegNo,
      appRole: user.appRole,
    },
    workspaces,
    entitlement,
    config: {
      configVersion: configRow?.configVersion ?? 1,
      minAppVersion: configRow?.minAppVersion ?? '1.0.0',
      killSwitches: configRow?.killSwitches ?? [],
    },
  }
}
