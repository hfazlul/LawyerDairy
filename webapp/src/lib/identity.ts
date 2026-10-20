/** Bangladesh phone normalisation. Storage form: +8801XXXXXXXXX */

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function normalizeBdPhone(raw: string): string | null {
  let d = digitsOnly(raw)
  if (d.startsWith('880')) d = d.slice(3)
  if (d.startsWith('0')) d = d.slice(1)
  if (!/^1[3-9]\d{8}$/.test(d)) return null
  return `+880${d}`
}

export function phoneNormalizedSearch(raw: string): string {
  return digitsOnly(raw).replace(/^880/, '').replace(/^0/, '')
}

const USERNAME_RE = /^[a-z][a-z0-9._]{3,23}$/

export function suggestUsername(name: string, phone: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w]+/g, '')
    .slice(0, 12) || 'user'
  const tail = digitsOnly(phone).slice(-4)
  let candidate = `${base}_${tail}`.replace(/[^a-z0-9._]/g, '')
  if (!/^[a-z]/.test(candidate)) candidate = `u${candidate}`
  return candidate.slice(0, 24)
}

export function isValidUsername(u: string): boolean {
  return USERNAME_RE.test(u)
}

export const kPasswordHintBn = 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড ব্যবহার করুন'
export const kPhoneExample = '01XXXXXXXXX'
export const kEmailExample = 'example@mail.com'

export function passwordIssues(password: string, _extras: string[] = []): string | null {
  if (password.length < 6) return kPasswordHintBn
  if (password.length > 128) return 'পাসওয়ার্ড ১২৮ অক্ষরের বেশি হতে পারবে না'
  return null
}

export const kSignupNameError = 'Text only.'
export const kSignupPhoneError = 'ফোন নম্বর ১১ সংখ্যার হতে হবে এবং ০১ দিয়ে শুরু হবে।'
export const kSignupEmailError = 'ইমেইলে @ এবং .com থাকতে হবে।'
export const kSignupPasswordError = 'পাসওয়ার্ড ৬ থেকে ১০ সংখ্যা হতে হবে।'
export const kLoginEmptyMessage = 'নাম ও পাসওয়ার্ড দিন।'
export const kLoginUnknownMessage = 'নাম বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।'
export const kLoginWrongPasswordMessage = 'পাসওয়ার্ড ভুল।'
export const kPhoneNotRegisteredMessage = 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট নেই।'

/** English letters, Bengali letters (with vowel signs), and spaces. */
const SIGNUP_NAME_RE = /^(?=.*[A-Za-z\u0985-\u09B9\u09DC-\u09E3\u09F0-\u09F1])[A-Za-z\u0981-\u0983\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC\u09BE-\u09C4\u09C7-\u09C8\u09CB-\u09CE\u09D7\u09DC-\u09E3\u09F0-\u09F1 ]+$/

export function signupNameIssue(raw: string): string | null {
  if (!SIGNUP_NAME_RE.test(raw.trim())) return kSignupNameError
  return null
}

export function signupPhoneIssue(raw: string): string | null {
  if (!/^01[3-9]\d{8}$/.test(raw.trim())) return kSignupPhoneError
  return null
}

export function signupEmailIssue(raw: string): string | null {
  const v = raw.trim()
  if (!v) return null
  const lower = v.toLowerCase()
  if (!lower.includes('@') || !lower.includes('.com')) return kSignupEmailError
  return null
}

/** Normal user signup only. Login, reset, and admin signup do not use this. */
export function signupPasswordIssue(password: string): string | null {
  if (!/^\d{6,10}$/.test(password)) return kSignupPasswordError
  return null
}

/** Signup and reset fields accept only the 11-digit local form, like 017XXXXXXXX. */
export function phoneFieldIssue(raw: string): string | null {
  const d = digitsOnly(raw)
  if (!/^01[3-9]\d{8}$/.test(d)) {
    return `১১ সংখ্যার মোবাইল নম্বর দিন, যেমন ${kPhoneExample}`
  }
  return null
}

export function takenAccountMessage(target: string): string {
  if (target.includes('phone')) return 'সেভ হয়নি। এই মোবাইল নম্বরে অ্যাকাউন্ট আছে। লগইন করুন।'
  if (target.includes('email')) return 'সেভ হয়নি। এই ইমেইলে অ্যাকাউন্ট আছে। লগইন করুন।'
  if (target.includes('name') || target.includes('username')) return 'সেভ হয়নি। এই নামে অ্যাকাউন্ট আছে। অন্য নাম দিন।'
  return 'সেভ হয়নি। এই তথ্য আগে থেকেই আছে। লগইন করুন।'
}

export function emailFieldIssue(raw: string): string | null {
  const v = raw.trim()
  if (!v) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return `সঠিক ইমেইল দিন, যেমন ${kEmailExample}`
  }
  return null
}
