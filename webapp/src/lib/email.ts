/**
 * Backward-compatible re-exports.
 * Prefer importing from `@/lib/mail`.
 */
export {
  sendEmail,
  runSubscriptionCampaign,
  DailyLimitError,
  type SendEmailInput,
  type SendResult,
  type CampaignAudience,
  type CampaignTemplate,
  type RunCampaignOpts,
} from './mail'
