import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAppRole } from '@/lib/auth-middleware'
import {
  DailyLimitError,
  runSubscriptionCampaign,
} from '@/lib/mail'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const schema = z
  .object({
    subject: z.string().min(3).max(200).optional(),
    bodyHtml: z.string().min(10).optional(),
    audience: z.enum(['all', 'inactive', 'expiring']).default('all'),
    template: z.enum(['subscription', 'coupons', 'deals', 'custom']).default('custom'),
    couponCode: z.string().min(2).max(64).optional(),
    dealTitle: z.string().min(2).max(120).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.template === 'custom') {
      if (!val.subject || val.subject.length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'subject required for custom', path: ['subject'] })
      }
      if (!val.bodyHtml || val.bodyHtml.length < 10) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'bodyHtml required for custom', path: ['bodyHtml'] })
      }
    }
  })

/** Admin: Send campaign email (Brevo primary / Resend fallback, or dry-run). */
export async function POST(req: NextRequest) {
  const admin = await requireAppRole(req, ['ADMIN'])
  if (!admin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const ip = clientIp(req.headers)
  const rl = rateLimit(`admin-campaign:${admin.id}:${ip}`, 5, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { message: 'Too many campaign sends. Try again shortly.' },
      { status: 429 },
    )
  }

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }

  try {
    const result = await runSubscriptionCampaign({
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      audience: body.audience,
      template: body.template,
      couponCode: body.couponCode,
      dealTitle: body.dealTitle,
      createdById: admin.id,
    })

    return NextResponse.json({
      ok: true,
      dryRun: result.dryRun,
      sent: result.sent,
      failed: result.failed,
      recipientCount: result.recipientCount,
      campaignId: result.campaign.id,
      status: result.campaign.status,
      daily: result.daily,
    })
  } catch (e) {
    if (e instanceof DailyLimitError) {
      return NextResponse.json({ message: e.message }, { status: 429 })
    }
    const message = e instanceof Error ? e.message : 'Campaign failed'
    return NextResponse.json({ message }, { status: 500 })
  }
}
