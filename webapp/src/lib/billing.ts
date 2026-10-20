import type { BillingPeriod, Plan, Prisma } from '@prisma/client'
import { extraTeamSeats, monthlySmsCredits } from './permissions'
import { isSellablePackage, monthsForPeriod, planFromPackageCode } from './plans'

type Tx = Prisma.TransactionClient

export { planFromPackageCode, isSellablePackage }

/** @deprecated name kept for old tests — now the 4 paid SKUs */
export function isV1SellablePackage(code: string): boolean {
  return isSellablePackage(code)
}

export async function activatePaidSubscription(
  tx: Tx,
  opts: {
    subscriptionId: string
    gatewayRef: string
    months?: number
    gateway?: string
  },
) {
  const sub = await tx.subscription.findUnique({
    where: { id: opts.subscriptionId },
    include: { package: true },
  })
  if (!sub) return { ok: false as const, reason: 'missing' }
  if (sub.status === 'ACTIVE' && sub.gatewayRef === opts.gatewayRef) {
    return { ok: true as const, already: true }
  }

  const plan = planFromPackageCode(sub.package.code)
  if (!plan) return { ok: false as const, reason: 'unsellable' }

  const months =
    opts.months ??
    (sub.billingPeriod === 'YEAR' ? 12 : monthsForPeriod(sub.billingPeriod))
  const starts = sub.startsAt ?? new Date()
  const ends = new Date(starts)
  ends.setMonth(ends.getMonth() + months)

  await tx.subscription.update({
    where: { id: sub.id },
    data: {
      status: 'ACTIVE',
      startsAt: starts,
      endsAt: ends,
      gateway: opts.gateway ?? sub.gateway ?? 'ZiniPay',
      gatewayRef: opts.gatewayRef,
    },
  })

  await tx.workspace.update({
    where: { id: sub.workspaceId },
    data: {
      plan,
      planExpiresAt: ends,
      memberLimit: extraTeamSeats(plan),
      smsCredits: monthlySmsCredits(plan),
    },
  })

  return { ok: true as const, already: false }
}

export async function activatePlanForWorkspace(
  tx: Tx,
  opts: {
    workspaceId: string
    plan: Plan
    months: number
    gateway: string
    gatewayRef: string
    packageCode: string
  },
) {
  const pkg = await tx.subscriptionPackage.findUnique({ where: { code: opts.packageCode } })
  if (!pkg) return { ok: false as const, reason: 'missing_package' }
  const starts = new Date()
  const ends = new Date(starts)
  ends.setMonth(ends.getMonth() + opts.months)
  const period: BillingPeriod = opts.months >= 12 ? 'YEAR' : 'MONTH'
  await tx.subscription.create({
    data: {
      workspaceId: opts.workspaceId,
      packageId: pkg.id,
      status: 'ACTIVE',
      billingPeriod: period,
      amountBdt: period === 'YEAR' ? pkg.yearlyBdt ?? pkg.priceBdt : pkg.priceBdt,
      startsAt: starts,
      endsAt: ends,
      gateway: opts.gateway,
      gatewayRef: opts.gatewayRef,
    },
  })
  await tx.workspace.update({
    where: { id: opts.workspaceId },
    data: {
      plan: opts.plan,
      planExpiresAt: ends,
      memberLimit: extraTeamSeats(opts.plan),
      smsCredits: monthlySmsCredits(opts.plan),
    },
  })
  return { ok: true as const, endsAt: ends }
}
