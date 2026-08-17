export type {
  CampaignAudience,
  CampaignTemplate,
  MailFromKind,
  MailProviderName,
  SendEmailInput,
  SendResult,
} from './types'

export {
  emailFallback,
  emailPrimary,
  emailProviderMode,
  hasBrevoKey,
  hasResendKey,
  mailDailyLimit,
  mailDomain,
  resolveFromAddress,
} from './config'

export { getDailySendStats, canSendWithinDailyLimit } from './daily-limit'
export { sendEmail } from './send'
export { renderCampaignTemplate, personalizeHtml } from './templates'
export { runSubscriptionCampaign, DailyLimitError } from './campaigns'
export type { RunCampaignOpts } from './campaigns'
