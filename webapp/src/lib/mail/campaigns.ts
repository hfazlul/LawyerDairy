import { prisma } from '../prisma'
import { hasBrevoKey, hasResendKey } from './config'
import { canSendWithinDailyLimit, getDailySendStats } from './daily-limit'
import { sendEmail } from './send'
import { personalizeHtml, renderCampaignTemplate } from './templates'
import type { CampaignAudience, CampaignTemplate } from './types'
import type { Prisma } from '@prisma/client'

export type RunCampaignOpts = {
  subject?: string
  bodyHtml?: string
  audience: CampaignAudience
  template?: CampaignTemplate
  couponCode?: string
  dealTitle?: string
  createdById?: string
}

/** Workspace-based audience (Chamber 1:1 is gone). Personal FREE rows do not mark everyone inactive. */
export function campaignAudienceWhere(
  audience: CampaignAudience,
  now: Date,
  in7: Date,
): Prisma.UserWhereInput {
  if (audience === 'inactive') {
    return {
      ownedWorkspaces: {
        none: {
          deletedAt: null,
          plan: { not: 'FREE' as const },
          OR: [{ planExpiresAt: null }, { planExpiresAt: { gte: now } }],
        },
      },
    }
  }
  if (audience === 'expiring') {
    return {
      ownedWorkspaces: {
        some: {
          deletedAt: null,
          plan: { not: 'FREE' as const },
          planExpiresAt: { gte: now, lte: in7 },
        },
      },
    }
  }
  return {}
}

/**
 * Admin campaign: resolve recipients → send (or dry-run) → log EmailCampaign.
 * Uses deals@ From by default. Respects MAIL_DAILY_LIMIT soft guard.
 */
export async function runSubscriptionCampaign(opts: RunCampaignOpts) {
  const now = new Date()
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const template: CampaignTemplate = opts.template || 'custom'

  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      appRole: 'USER',
      deletedAt: null,
      ...campaignAudienceWhere(opts.audience, now, in7),
    },
    select: { id: true, email: true, name: true, phone: true },
  })

  const recipients = users.filter((u) => Boolean(u.email))
  const stats = getDailySendStats()

  // Soft guard: if keys are configured and batch would exceed remaining quota, fail early.
  // Dry-run (no keys) always proceeds.
  const live = hasBrevoKey() || hasResendKey()
  if (live && recipients.length > 0 && !canSendWithinDailyLimit(recipients.length)) {
    throw new DailyLimitError(
      `Campaign would send ${recipients.length} emails but only ${stats.remaining} remain today (limit ${stats.limit}).`,
    )
  }

  let defaultSubject = opts.subject?.trim() || ''
  let defaultHtml = opts.bodyHtml?.trim() || ''

  if (template !== 'custom') {
    const built = renderCampaignTemplate(template, {
      couponCode: opts.couponCode,
      dealTitle: opts.dealTitle,
    })
    if (!defaultSubject) defaultSubject = built.subject
    if (!defaultHtml) defaultHtml = built.html
  }

  if (!defaultSubject || !defaultHtml) {
    throw new Error('subject and bodyHtml are required for custom campaigns')
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      subject: defaultSubject,
      bodyHtml: defaultHtml,
      audience: opts.audience,
      status: 'sending',
      createdById: opts.createdById,
    },
  })

  let sent = 0
  let dryRun = false
  let failed = 0

  for (const u of recipients) {
    if (!u.email) continue

    let subject = defaultSubject
    let html: string

    if (template === 'custom') {
      html = personalizeHtml(defaultHtml, { name: u.name, phone: u.phone })
    } else {
      const built = renderCampaignTemplate(template, {
        name: u.name,
        phone: u.phone,
        couponCode: opts.couponCode,
        dealTitle: opts.dealTitle,
      })
      subject = built.subject || defaultSubject
      html = built.html
    }

    const result = await sendEmail({
      to: u.email,
      subject,
      html,
      from: 'deals',
    })

    if (result.dryRun) dryRun = true
    if (result.ok) sent += 1
    else failed += 1
  }

  const updated = await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      sentCount: sent,
      status: dryRun ? 'dry_run' : failed > 0 && sent === 0 ? 'failed' : 'sent',
      sentAt: new Date(),
    },
  })

  return {
    campaign: updated,
    recipientCount: recipients.length,
    sent,
    failed,
    dryRun,
    daily: getDailySendStats(),
  }
}

export class DailyLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DailyLimitError'
  }
}
