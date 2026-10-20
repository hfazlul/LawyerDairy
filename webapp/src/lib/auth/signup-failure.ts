export const kSignupUnexpectedMessage = 'অ্যাকাউন্ট তৈরি হয়নি। আবার চেষ্টা করুন।'
export const kSignupMissingSecretMessage =
  'অ্যাকাউন্ট তৈরি হয়নি। সার্ভারে JWT_SECRET সেট করা নেই।'
export const kSignupDatabaseMessage = 'অ্যাকাউন্ট তৈরি হয়নি। ডাটাবেস টেবিল পাওয়া যায়নি।'

export function signingSecretMissing(env: NodeJS.ProcessEnv = process.env): boolean {
  return !(env.JWT_SECRET || '').trim()
}

function errorText(err: unknown): string {
  if (err instanceof Error) return `${err.name} ${err.message}`
  if (err && typeof err === 'object') {
    const row = err as { code?: unknown; message?: unknown }
    return `${String(row.code || '')} ${String(row.message || '')}`
  }
  return String(err ?? '')
}

/** Bangla message for a signup throw. Never echoes the exception or a secret. */
export function signupFailureMessage(err: unknown, env: NodeJS.ProcessEnv = process.env): string {
  const text = errorText(err)
  if (signingSecretMissing(env) || /secretOrPrivateKey must have a value/i.test(text)) {
    return kSignupMissingSecretMessage
  }
  if (/P2021|does not exist|P1001|Can't reach database/i.test(text)) {
    return kSignupDatabaseMessage
  }
  return kSignupUnexpectedMessage
}
