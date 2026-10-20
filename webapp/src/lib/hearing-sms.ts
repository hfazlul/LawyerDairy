import { MAMLAQ_PUBLIC_SITE } from './auth/password-otp'

export { MAMLAQ_PUBLIC_SITE }

/** Demo values for the lawyer preview. Never a real client. */
export const HEARING_SMS_DEMO = {
  clientName: 'করিম উদ্দিন (নমুনা)',
  caseName: 'দেওয়ানি ১২৩/২০২৬ (নমুনা)',
  courtName: 'ঢাকা জজ আদালত (নমুনা)',
  hearingDate: '২২/১০/২০২৬ (নমুনা)',
} as const

export type HearingSmsFields = {
  clientName: string
  caseName: string
  courtName: string
  hearingDate: string
  lawyerName: string
  chamberName: string
  appearanceTime: string
}

/**
 * One client SMS. Footer is always the last two lines.
 * Bangla plus the seven fields does not fit in one 160-character non-masking SMS.
 */
export function hearingReminderSms(input: HearingSmsFields): string {
  const client = input.clientName.trim() || 'মক্কেল'
  const caseName = input.caseName.trim() || 'মামলা'
  const court = input.courtName.trim() || 'আদালত'
  const date = input.hearingDate.trim()
  const lawyer = input.lawyerName.trim()
  const chamber = input.chamberName.trim()
  const time = input.appearanceTime.trim()
  const line = `মক্কেল: ${client}। মামলা: ${caseName}। আদালত: ${court}। শুনানি: ${date}। আইনজীবী: ${lawyer}। চেম্বার: ${chamber}। সময়: ${time}।`
  return `${line}\nMAMLAQ\n${MAMLAQ_PUBLIC_SITE}`
}
