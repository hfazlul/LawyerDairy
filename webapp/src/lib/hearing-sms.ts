import { MAMLAQ_PUBLIC_SITE } from './auth/password-otp'

export { MAMLAQ_PUBLIC_SITE }

const MONTHS = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'] as const
const BN_DIGITS = '০১২৩৪৫৬৭৮৯'
const HONORIFICS = new Set(['মোঃ', 'মো.', 'মো', 'মোহাম্মদ', 'মোছাঃ', 'মোছা', 'মোসাঃ', 'মোছঃ'])

export function codePointLength(value: string): number {
  return Array.from(value).length
}

function bnNumber(value: number): string {
  return String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] || digit)
}

/** Day plus a short Bangla month, for example 25 October → ২৫ অক্টো. */
export function formatHearingDate(day: number, month: number): string {
  const label = MONTHS[month - 1] || ''
  return `${bnNumber(day)} ${label}`.trim()
}

export function hearingTitle(gender?: string | null): 'জনাব' | 'জনাবা' {
  const value = (gender || '').trim().toLowerCase()
  if (value === 'female' || value === 'f' || value === 'woman' || value === 'জনাবা' || value === 'মহিলা' || value === 'নারী') {
    return 'জনাবা'
  }
  return 'জনাব'
}

function tokensOf(name: string): string[] {
  return name.trim().split(/\s+/).filter(Boolean)
}

function isHonorific(token: string): boolean {
  const bare = token.replace(/[।.]+$/u, '')
  return HONORIFICS.has(token) || HONORIFICS.has(bare)
}

function longerName(client: string[], lawyer: string[]): 'client' | 'lawyer' {
  const clientLen = codePointLength(client.join(' '))
  const lawyerLen = codePointLength(lawyer.join(' '))
  if (clientLen !== lawyerLen) return clientLen > lawyerLen ? 'client' : 'lawyer'
  return client.length >= lawyer.length ? 'client' : 'lawyer'
}

function dropMiddle(tokens: string[]): string[] {
  if (tokens.length <= 2) return tokens
  return [tokens[0], ...tokens.slice(2)]
}

function toOneToken(tokens: string[]): string[] {
  if (tokens.length <= 1) return tokens
  const plain = tokens.filter((token) => !isHonorific(token))
  const pool = plain.length ? plain : tokens
  return [pool.reduce((best, token) => (codePointLength(token) > codePointLength(best) ? token : best))]
}

function compose(title: string, client: string, date: string, court: string, lawyer: string | null): string {
  const courtName = court.trim()
  const courtText = courtName ? `${courtName} ` : ''
  const head = `${title} ${client.trim()}, কেসের শুনানি ${date.trim()}, ${courtText}আদালত। উকিল`
  if (lawyer == null || !lawyer.trim()) return `${head}।`
  return `${head} ${lawyer.trim()}।`
}

/**
 * One hearing SMS. At most 70 Unicode code points.
 * Names shrink on word boundaries. Title, date, আদালত and উকিল stay.
 * Client records have no gender column; pass female only when one is known.
 */
export function hearingSms(input: {
  gender?: string | null
  client: string
  date: string
  court: string
  lawyer: string
}): string {
  const title = hearingTitle(input.gender)
  let client = tokensOf(input.client)
  let lawyer = tokensOf(input.lawyer)
  if (!client.length) client = ['মক্কেল']
  const date = input.date.trim()
  const court = input.court.trim()
  const text = () => compose(title, client.join(' '), date, court, lawyer.join(' '))
  const bare = () => compose(title, client.join(' '), date, court, null)

  if (codePointLength(text()) <= 70) return text()

  while (codePointLength(text()) > 70 && (client.length > 2 || lawyer.length > 2)) {
    const which = longerName(client, lawyer)
    if (which === 'client' && client.length > 2) client = dropMiddle(client)
    else if (lawyer.length > 2) lawyer = dropMiddle(lawyer)
    else if (client.length > 2) client = dropMiddle(client)
    else break
  }
  if (codePointLength(text()) <= 70) return text()

  const first = longerName(client, lawyer)
  const second = first === 'client' ? 'lawyer' : 'client'
  if (first === 'client' && client.length > 1) client = toOneToken(client)
  if (first === 'lawyer' && lawyer.length > 1) lawyer = toOneToken(lawyer)
  if (codePointLength(text()) <= 70) return text()
  if (second === 'client' && client.length > 1) client = toOneToken(client)
  if (second === 'lawyer' && lawyer.length > 1) lawyer = toOneToken(lawyer)
  if (codePointLength(text()) <= 70) return text()

  if (codePointLength(bare()) <= 70) return bare()
  if (client.length > 1) client = toOneToken(client)
  return bare()
}
