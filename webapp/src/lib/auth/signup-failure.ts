export const kSignupUnexpectedMessage = 'অ্যাকাউন্ট তৈরি হয়নি। আবার চেষ্টা করুন।'

const kServerInternal =
  /JWT_SECRET|Prisma|P2021|P1001|DATABASE_URL|secretOrPrivateKey|does not exist|Can't reach database|Internal Server Error/i

export function signingSecretMissing(env: NodeJS.ProcessEnv = process.env): boolean {
  return !(env.JWT_SECRET || '').trim()
}

function errorText(err: unknown): string {
  if (err instanceof Error) {
    const code = 'code' in err && err.code != null ? String((err as { code?: unknown }).code) : ''
    return `${err.name}${code ? ` ${code}` : ''} ${err.message}`
  }
  if (err && typeof err === 'object') {
    const row = err as { code?: unknown; message?: unknown }
    return `${String(row.code || '')} ${String(row.message || '')}`
  }
  return String(err ?? '')
}

function signingKeyFailure(err: unknown, env: NodeJS.ProcessEnv): boolean {
  return signingSecretMissing(env) || /secretOrPrivateKey must have a value/i.test(errorText(err))
}

function redact(text: string, env: NodeJS.ProcessEnv): string {
  let out = text
  for (const key of ['JWT_SECRET', 'DATABASE_URL', 'CSRF_SECRET', 'CRON_SECRET'] as const) {
    const value = (env[key] || '').trim()
    if (value.length >= 4) out = out.split(value).join('[redacted]')
  }
  return out.replace(/[a-z][a-z0-9+.-]*:\/\/\S+/gi, '[redacted-url]')
}

/** Bangla sentence for a signup create failure. Never names env, tables, or Prisma. */
export function signupFailureMessage(_err?: unknown, _env?: NodeJS.ProcessEnv): string {
  return kSignupUnexpectedMessage
}

/**
 * Replace a notice that names server internals with the caller's plain fallback.
 * User-input sentences (wrong password, phone, name taken) pass through.
 */
export function plainAuthNotice(message: string, fallback: string): string {
  const text = message.trim()
  if (!text) return ''
  if (kServerInternal.test(text) || text.includes('ডাটাবেস') || text.includes('টেবিল পাওয়া')) return fallback
  return text
}

/** Server log only. A missing JWT_SECRET is named, never its value or a database URL. */
export function logAuthFailure(err: unknown, env: NodeJS.ProcessEnv = process.env, label = 'auth failed'): void {
  if (signingKeyFailure(err, env)) {
    console.error(`${label}: JWT_SECRET is missing`)
    return
  }
  console.error(`${label}: ${redact(errorText(err), env).slice(0, 800)}`)
}
