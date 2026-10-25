/**
 * ShelfAware notification copy, taken from the app's strings.
 * English is values/strings.xml. Bangla is values-bn/strings.xml.
 * Android falls back to English when Bangla has no override.
 *
 * The phone shows these at the user's own time. This module only builds
 * the sentence. The caller stores it and the push job sends it once dueAt
 * has passed.
 */

export const SHELF_REMINDER_KINDS = [
  'expiry_today',
  'expiry_tomorrow',
  'expiry_advance',
  'return_deadline',
  'daily_grocery',
  'monthly_grocery',
  'streak_milestone',
  'streak_update',
  'streak_broken',
  'weekly_summary',
  'budget_70',
  'budget_80',
  'budget_90',
  'budget_over',
  'budget_followup',
  'morning_digest',
  'use_soon',
  'evening_digest',
  'auto_wasted',
  'affiliate_engagement',
  'note_reminder',
  'user_reminder',
  'pairing_request',
  'pairing_accepted',
  'items_sent',
] as const

export type ShelfReminderKind = (typeof SHELF_REMINDER_KINDS)[number]

const KIND_SET = new Set<string>(SHELF_REMINDER_KINDS)

export type ShelfSlots = {
  name?: string
  count?: number
  days?: number
  percent?: number
  saved?: string
  wasted?: string
  score?: number
  streak?: number
  price?: string
  categoryLabel?: string
  unchecked?: number
  notes?: string
  requester?: string
  sender?: string
}

type Copy = { title: string; body: string }
type Lang = 'en' | 'bn'

export function shelfLanguage(raw: string | null | undefined): Lang {
  const value = (raw || '').trim().toLowerCase()
  if (value.startsWith('bn') || value.startsWith('bangla')) return 'bn'
  return 'en'
}

export function isShelfReminderKind(value: string | undefined): value is ShelfReminderKind {
  return Boolean(value && KIND_SET.has(value))
}

function pct(n: number): string {
  return `${Math.trunc(n)}%`
}

function render(kind: ShelfReminderKind, lang: Lang, slots: ShelfSlots): Copy | null {
  const name = (slots.name || '').trim()
  const count = slots.count
  const days = slots.days
  const percent = slots.percent
  if (kind === 'expiry_today') {
    const n = count ?? (name ? 1 : 0)
    if (n <= 1) {
      if (!name) return null
      return lang === 'bn'
        ? { title: `${name} আজ মেয়াদ শেষ`, body: 'আজই ব্যবহার করুন যাতে নষ্ট না হয়।' }
        : { title: `${name} expires today`, body: "Use it today so it doesn't go to waste." }
    }
    return lang === 'bn'
      ? { title: `${n}টি আইটেম আজ মেয়াদ শেষ`, body: 'ShelfAware খুলে দেখুন আগে কী ব্যবহার করবেন।' }
      : { title: `${n} items expire today`, body: 'Open ShelfAware to see what to use first.' }
  }
  if (kind === 'expiry_tomorrow') {
    const n = count ?? (name ? 1 : 0)
    if (n <= 1) {
      if (!name) return null
      return lang === 'bn'
        ? {
            title: `${name} আগামীকাল মেয়াদ শেষ`,
            body: 'আজ ব্যবহারের পরিকল্পনা করুন। কম থাকলে শীঘ্রই অর্ডার করুন।',
          }
        : {
            title: `${name} expires tomorrow`,
            body: 'Plan to use it today. Running low? Reorder soon.',
          }
    }
    return lang === 'bn'
      ? {
          title: `${n}টি আইটেম আগামীকাল মেয়াদ শেষ`,
          body: 'তালিকা দেখুন এবং মেয়াদ শেষ হওয়া জিনিস দিয়ে খাবার পরিকল্পনা করুন।',
        }
      : {
          title: `${n} items expire tomorrow`,
          body: "Check your list and plan meals around what's expiring.",
        }
  }
  if (kind === 'expiry_advance') {
    if (days == null || days < 2) return null
    const n = count ?? (name ? 1 : 0)
    if (n <= 1) {
      if (!name) return null
      return lang === 'bn'
        ? {
            title: `${name} ${days} দিনে মেয়াদ শেষ`,
            body: 'মেয়াদ শেষের আগে ব্যবহার করুন, বা পরের কেনাকাটা পরিকল্পনা করুন।',
          }
        : {
            title: `${name} expires in ${days} days`,
            body: 'Use it before it expires, or plan your next purchase.',
          }
    }
    return lang === 'bn'
      ? {
          title: `${n}টি আইটেম ${days} দিনে মেয়াদ শেষ`,
          body: 'শেলফ পরীক্ষা করুন এবং সময়মতো ব্যবহার করুন।',
        }
      : {
          title: `${n} items expire in ${days} days`,
          body: 'Review your shelf and use things up in time.',
        }
  }
  if (kind === 'return_deadline') {
    if (!name || days == null || !(slots.price || '').trim()) return null
    const price = slots.price!.trim()
    return lang === 'bn'
      ? {
          title: '📦 রিটার্ন ডেডলাইন!',
          body: `📦 ${price} রিফান্ডের জন্য ${name} ফেরত দিতে ${days} দিন বাকি!`,
        }
      : {
          title: '📦 Return Deadline!',
          body: `📦 ${days} days left to return ${name} for ${price} refund!`,
        }
  }
  if (kind === 'daily_grocery') {
    const n = count ?? slots.unchecked
    if (n == null) return null
    return lang === 'bn'
      ? { title: 'আপনার কেনাকাটার তালিকা প্রস্তুত', body: `আজও ${n}টি আইটেম কিনতে বাকি আছে।` }
      : { title: 'Your shopping list is ready', body: `You still have ${n} item(s) left to pick up today.` }
  }
  if (kind === 'monthly_grocery') {
    return lang === 'bn'
      ? {
          title: 'মাসিক মুদি পরীক্ষা',
          body: 'এই মাসের তালিকায় কিছু বাদ পড়েছে? ট্যাপ করে প্রয়োজনীয় জিনিস দেখুন।',
        }
      : {
          title: 'Monthly grocery check-in',
          body: "Anything missing from this month's list? Tap to review your staples.",
        }
  }
  if (kind === 'streak_milestone') {
    if (slots.streak == null) return null
    const n = slots.streak
    return lang === 'bn'
      ? { title: '🔥 স্ট্রিক মাইলফলক!', body: `🔥 ${n}-দিনের ধারা! ব্যাজ অর্জিত!` }
      : { title: '🔥 Streak Milestone!', body: `🔥 ${n}-day streak! Badge earned!` }
  }
  if (kind === 'streak_update') {
    if (slots.streak == null) return null
    const n = slots.streak
    return lang === 'bn'
      ? { title: '🔥 স্ট্রিক আপডেট', body: `${n} দিনের ধারা 🔥` }
      : { title: '🔥 Streak Update', body: `${n} day streak 🔥` }
  }
  if (kind === 'streak_broken') {
    return lang === 'bn'
      ? { title: '💔 স্ট্রিক ভাঙ্গা', body: '💔 ধারা ভাঙ্গা। আগামীকাল তাজা শুরু করুন!' }
      : { title: '💔 Streak Broken', body: '💔 Streak broken. Start fresh tomorrow!' }
  }
  if (kind === 'weekly_summary') {
    if (!(slots.saved || '').trim() || !(slots.wasted || '').trim() || slots.score == null || slots.streak == null) {
      return null
    }
    const saved = slots.saved!.trim()
    const wasted = slots.wasted!.trim()
    return lang === 'bn'
      ? {
          title: '📊 সাপ্তাহিক সারাংশ',
          body: `সংরক্ষিত: ${saved} | নষ্ট হয়েছে: ${wasted} | স্কোর: ${slots.score} | স্ট্রিক: ${slots.streak} দিন 💪`,
        }
      : {
          title: '📊 Weekly Summary',
          body: `Saved: ${saved} | Wasted: ${wasted} | Score: ${slots.score} | Streak: ${slots.streak} days 💪`,
        }
  }
  if (kind === 'budget_70') {
    if (percent == null) return null
    return lang === 'bn'
      ? {
          title: 'বাজেট মাথা আপ',
          body: `এই মাসে বাকি থাকা সময়ের মধ্যে আপনি আপনার মাসিক বাজেটের প্রায় ${pct(percent)} ব্যবহার করেছেন৷ পর্যালোচনা করতে ব্যয় ট্র্যাকার খুলুন।`,
        }
      : {
          title: 'Budget heads-up',
          body: `You have used about ${pct(percent)} of your monthly budget with time left this month. Open Expense Tracker to review.`,
        }
  }
  if (kind === 'budget_80') {
    if (percent == null) return null
    return lang === 'bn'
      ? {
          title: 'বাজেট অ্যালার্ট',
          body: `আপনি প্রায় ${pct(percent)} মাসিক বাজেট ব্যবহার করেছেন। খরচ পর্যালোচনা করুন।`,
        }
      : {
          title: 'Budget alert',
          body: `You have used about ${pct(percent)} of your monthly budget. Review spending in Expense Tracker.`,
        }
  }
  if (kind === 'budget_90') {
    if (percent == null) return null
    return lang === 'bn'
      ? {
          title: 'বাজেট সতর্কতা',
          body: `আপনি আপনার মাসিক বাজেটের প্রায় ${pct(percent)} ব্যবহার করেছেন৷ খরচ ধীর বা আপনার পরিকল্পনা সামঞ্জস্য বিবেচনা করুন.`,
        }
      : {
          title: 'Budget warning',
          body: `You have used about ${pct(percent)} of your monthly budget. Consider slowing spending or adjusting your plan.`,
        }
  }
  if (kind === 'budget_over') {
    if (percent == null) return null
    return lang === 'bn'
      ? {
          title: 'বাজেট ছাড়িয়ে গেছে',
          body: `খরচ মাসিক বাজেটের প্রায় ${pct(percent)} পৌঁছেছে। Expense Tracker খুলুন।`,
        }
      : {
          title: 'Over budget',
          body: `Spending has reached about ${pct(percent)} of your monthly income budget. Open Expense Tracker to adjust.`,
        }
  }
  if (kind === 'budget_followup') {
    return lang === 'bn'
      ? {
          title: 'আপনার খরচ পরীক্ষা করুন',
          body: 'আপনি গতকাল একটি খরচ লগ লগ. যেকোন সময় এক্সপেন্স ট্র্যাকারে আপনার মাস পর্যালোচনা করুন।',
        }
      : {
          title: 'Check your spending',
          body: 'You logged an expense yesterday. Review your month in Expense Tracker anytime.',
        }
  }
  if (kind === 'morning_digest') {
    const n = count ?? 0
    if (n <= 0) return null
    return lang === 'bn'
      ? { title: 'সকালের পরীক্ষা', body: `${n}টি আইটেম ৩ দিনের মধ্যে মেয়াদ শেষ` }
      : { title: '🌅 Food Check', body: `${n} item(s) expiring within 3 days` }
  }
  if (kind === 'use_soon') {
    if (!name || days == null) return null
    return lang === 'bn'
      ? { title: `শীঘ্রই ব্যবহার: ${name}`, body: `${days} দিনে মেয়াদ শেষ। আইডিয়ার জন্য রান্নাঘর খুলুন।` }
      : { title: `Use soon: ${name}`, body: `Expires in ${days} day(s). Open Kitchen for meal ideas.` }
  }
  if (kind === 'evening_digest') {
    if (percent == null) return null
    const unchecked = slots.unchecked ?? 0
    if (unchecked > 0) {
      return lang === 'bn'
        ? {
            title: 'সন্ধ্যার সারাংশ',
            body: `বাজেট ${pct(percent)} ব্যবহার — ${unchecked}টি মুদি আইটেম বাকি`,
          }
        : {
            title: '🌙 Evening Recap',
            body: `Budget ${pct(percent)} used · ${unchecked} grocery item(s) pending`,
          }
    }
    return lang === 'bn'
      ? { title: 'সন্ধ্যার সারাংশ', body: `বাজেট ${pct(percent)} ব্যবহার — ঠিক পথে!` }
      : { title: '🌙 Evening Recap', body: `Budget ${pct(percent)} used — on track!` }
  }
  if (kind === 'auto_wasted') {
    if (!name) return null
    return lang === 'bn'
      ? {
          title: '🗑️ নষ্ট হিসাবে স্বয়ংক্রিয়ভাবে চিহ্নিত',
          body: `${name} 3+ দিন মেয়াদ শেষ হয়েছে — নষ্ট হিসাবে চিহ্নিত করা হয়েছে।`,
        }
      : {
          title: '🗑️ Moved to Bin',
          body: `${name} expired 2+ days ago unused — moved to the Bin.`,
        }
  }
  if (kind === 'affiliate_engagement') {
    const label = (slots.categoryLabel || '').trim()
    const n = count ?? 0
    if (!label || n <= 0) return null
    if (lang === 'bn') {
      return {
        title: 'মেয়াদ শেষ হচ্ছে শীঘ্রই',
        body: `${label}: ${n} আইটেমের মেয়াদ শীঘ্রই শেষ হচ্ছে — বিশ্বাসযোগ্য ডিল দেখুন`,
      }
    }
    const noun = n === 1 ? 'item' : 'items'
    return {
      title: 'Expiring soon',
      body: `${label}: ${n} ${noun} expiring soon — check trusted deals`,
    }
  }
  if (kind === 'note_reminder') {
    return lang === 'bn'
      ? {
          title: 'খরচের নোট রিমাইন্ডার',
          body: 'আপনার খরচের নোট খুলে অগ্রগতি দেখুন এবং আপডেট করুন।',
        }
      : {
          title: 'Expense note reminder',
          body: 'Open your expense note to review progress and update it.',
        }
  }
  if (kind === 'user_reminder') {
    const title = (slots.name || '').trim()
    if (!title) return null
    const notes = (slots.notes || '').trim()
    return { title, body: notes || 'Tap to open' }
  }
  if (kind === 'pairing_request') {
    const who = (slots.requester || name).trim()
    if (!who) return null
    return {
      title: '🔔 Someone wants to join your list',
      body: `${who} sent a request to join your grocery list. Open the app to accept or decline.`,
    }
  }
  if (kind === 'pairing_accepted') {
    return {
      title: '✅ Your join request was accepted',
      body: 'You are now connected to the shared grocery list. Open the app to see shared items.',
    }
  }
  if (kind === 'items_sent') {
    const who = (slots.sender || name).trim()
    const n = count ?? 0
    if (!who || n <= 0) return null
    return {
      title: '🛒 Partner sent items!',
      body: `${who} sent you ${n} item(s) to your grocery list.`,
    }
  }
  return null
}

/**
 * Official sentence for a known kind. The published app uploads no kind and
 * puts the item name in both title and body; that row is the expiry-morning
 * reminder, so it uses the "expires today" sentence.
 * A title and body that already differ are kept.
 */
export function composeShelfReminder(input: {
  language?: string | null
  kind?: string
  title?: string
  body?: string
  slots?: ShelfSlots
}): Copy | null {
  const lang = shelfLanguage(input.language)
  const slots = input.slots || {}
  const title = (input.title || '').trim()
  const body = (input.body || '').trim()
  const kind = (input.kind || '').trim()
  if (isShelfReminderKind(kind)) {
    const named = kind === 'user_reminder' && !slots.name ? { ...slots, name: title } : slots
    const rendered = render(kind, lang, named)
    if (rendered) return rendered
    if (title && body) return { title, body }
    return null
  }
  if (title && body && title !== body) return { title, body }
  if (title) {
    return render('expiry_today', lang, { ...slots, name: slots.name || title, count: slots.count ?? 1 })
  }
  return null
}
