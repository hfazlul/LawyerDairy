export type MailProviderName = 'brevo' | 'resend'

export type MailFromKind = 'deals' | 'noreply' | 'support'

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  /** Which From address to use (defaults to noreply for transactional). */
  from?: MailFromKind
  /** Force a provider; otherwise config / auto selection applies. */
  provider?: MailProviderName
}

export type SendResult = {
  ok: boolean
  dryRun: boolean
  id?: string
  error?: string
  provider?: MailProviderName | 'gmail' | 'dry_run'
}

export type CampaignAudience = 'all' | 'inactive' | 'expiring'

export type CampaignTemplate = 'subscription' | 'coupons' | 'deals' | 'custom'
