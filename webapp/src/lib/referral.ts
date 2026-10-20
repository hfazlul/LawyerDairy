import { createHash, randomBytes } from 'crypto'
import type { Plan, Prisma } from '@prisma/client'
import { activatePlanForWorkspace } from './billing'
import { prisma } from './prisma'

type Tx = Prisma.TransactionClient

/** Highest tier reached. Gaps stay on the previous tier.
 *  1→1, 2–4→2, 5–7→3, 8–11→4, 12–13→5, 14→6, then +1 month per extra 2.
 */
export function monthsForQualifiedCount(n: number): number {
  if (n < 1) return 0
  if (n < 2) return 1
  if (n < 5) return 2
  if (n < 8) return 3
  if (n < 12) return 4
  if (n < 14) return 5
  return 6 + Math.floor((n - 14) / 2)
}

export function generateReferralCode(username: string): string {
  const base = username.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'MQ'
  return `${base}${randomBytes(2).toString('hex').toUpperCase()}`
}

export function hashFingerprint(raw: string): string {
  return createHash('sha256').update(raw).digest('hex').slice(0, 32)
}

export async function ensureReferralCode(tx: Tx, userId: string, username: string): Promise<string> {
  const user = await tx.user.findUnique({ where: { id: userId } })
  if (user?.referralCode) return user.referralCode
  for (let i = 0; i < 6; i++) {
    const code = generateReferralCode(username)
    try {
      await tx.user.update({ where: { id: userId }, data: { referralCode: code } })
      return code
    } catch {
      /* unique collision */
    }
  }
  const fallback = `MQ${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
  await tx.user.update({ where: { id: userId }, data: { referralCode: fallback } })
  return fallback
}

export async function applyReferralCode(
  tx: Tx,
  opts: {
    referredUserId: string
    code: string
    installFingerprint?: string | null
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const code = opts.code.trim().toUpperCase()
  const me = await tx.user.findUnique({ where: { id: opts.referredUserId } })
  if (!me) return { ok: false, reason: 'missing' }
  if (me.referredById) return { ok: false, reason: 'already_referred' }
  const referrer = await tx.user.findFirst({ where: { referralCode: code } })
  if (!referrer) return { ok: false, reason: 'unknown_code' }
  if (referrer.id === me.id) return { ok: false, reason: 'self' }
  if (
    opts.installFingerprint &&
    referrer.installFingerprint &&
    referrer.installFingerprint === opts.installFingerprint
  ) {
    return { ok: false, reason: 'same_device' }
  }
  const existingFp = opts.installFingerprint
    ? await tx.referralAttribution.findFirst({
        where: { installFingerprint: opts.installFingerprint, qualifiedAt: { not: null } },
      })
    : null
  if (existingFp && existingFp.referrerId === referrer.id) {
    return { ok: false, reason: 'same_device' }
  }

  await tx.user.update({
    where: { id: me.id },
    data: {
      referredById: referrer.id,
      installFingerprint: opts.installFingerprint || me.installFingerprint,
    },
  })
  await tx.referralAttribution.create({
    data: {
      referrerId: referrer.id,
      referredUserId: me.id,
      code,
      installFingerprint: opts.installFingerprint || null,
    },
  })
  return { ok: true }
}

/** Call after referred user has a real new account (install+signup), not paste alone. */
export async function qualifyReferral(tx: Tx, referredUserId: string) {
  const attr = await tx.referralAttribution.findUnique({ where: { referredUserId } })
  if (!attr || attr.qualifiedAt) return { ok: false as const, reason: 'skip' }

  const referred = await tx.user.findUnique({ where: { id: referredUserId } })
  if (!referred) return { ok: false as const, reason: 'skip' }
  const seen = referred.lastSeenAt
  if (!seen) return { ok: false as const, reason: 'not_yet_active' }
  const usedMs = seen.getTime() - referred.createdAt.getTime()
  if (usedMs < 7 * 86400000) return { ok: false as const, reason: 'not_yet_active' }

  await tx.referralAttribution.update({
    where: { id: attr.id },
    data: { qualifiedAt: new Date() },
  })

  const n = await tx.referralAttribution.count({
    where: { referrerId: attr.referrerId, qualifiedAt: { not: null } },
  })
  const months = monthsForQualifiedCount(n)
  if (!months) return { ok: true as const, n, months: 0 }

  const last = await tx.referralReward.findFirst({
    where: { userId: attr.referrerId },
    orderBy: { grantedAt: 'desc' },
  })
  const already = last?.monthsGranted ?? 0
  if (months <= already) return { ok: true as const, n, months: 0 }

  const grant = months - already
  const ownerWs = await tx.workspace.findFirst({
    where: { ownerUserId: attr.referrerId, kind: 'PERSONAL', deletedAt: null },
  })
  if (ownerWs) {
    await activatePlanForWorkspace(tx, {
      workspaceId: ownerWs.id,
      plan: 'STARTER' as Plan,
      months: grant,
      gateway: 'referral',
      gatewayRef: `ref:${attr.id}:${n}`,
      packageCode: 'STARTER',
    })
  }
  await tx.referralReward.create({
    data: {
      userId: attr.referrerId,
      qualifiedN: n,
      monthsGranted: months,
      packageCode: 'STARTER',
    },
  })
  return { ok: true as const, n, months: grant }
}

/** Record use, then qualify only if the referred account has been active for a week. */
export function touchReferralActivity(userId: string) {
  void prisma.user
    .update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
    .then(() => prisma.$transaction((tx) => qualifyReferral(tx, userId)))
    .catch(() => {})
}
