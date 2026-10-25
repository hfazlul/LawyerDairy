import assert from 'node:assert/strict'
import test from 'node:test'
import { composeShelfReminder, SHELF_REMINDER_KINDS } from './messages'

test('every ShelfAware kind has the app sentence', () => {
  const samples: Record<string, { title: string; body: string }> = {
    expiry_today: composeShelfReminder({ language: 'en', kind: 'expiry_today', slots: { name: 'Milk' } })!,
    expiry_tomorrow: composeShelfReminder({ language: 'en', kind: 'expiry_tomorrow', slots: { name: 'Milk' } })!,
    expiry_advance: composeShelfReminder({
      language: 'en',
      kind: 'expiry_advance',
      slots: { name: 'Milk', days: 3 },
    })!,
    return_deadline: composeShelfReminder({
      language: 'en',
      kind: 'return_deadline',
      slots: { name: 'Shoes', days: 2, price: 'BDT 500' },
    })!,
    daily_grocery: composeShelfReminder({ language: 'en', kind: 'daily_grocery', slots: { count: 4 } })!,
    monthly_grocery: composeShelfReminder({ language: 'en', kind: 'monthly_grocery' })!,
    streak_milestone: composeShelfReminder({ language: 'en', kind: 'streak_milestone', slots: { streak: 7 } })!,
    streak_update: composeShelfReminder({ language: 'en', kind: 'streak_update', slots: { streak: 21 } })!,
    streak_broken: composeShelfReminder({ language: 'en', kind: 'streak_broken' })!,
    weekly_summary: composeShelfReminder({
      language: 'en',
      kind: 'weekly_summary',
      slots: { saved: 'BDT 10', wasted: 'BDT 2', score: 80, streak: 4 },
    })!,
    budget_70: composeShelfReminder({ language: 'en', kind: 'budget_70', slots: { percent: 70 } })!,
    budget_80: composeShelfReminder({ language: 'en', kind: 'budget_80', slots: { percent: 80 } })!,
    budget_90: composeShelfReminder({ language: 'en', kind: 'budget_90', slots: { percent: 90 } })!,
    budget_over: composeShelfReminder({ language: 'en', kind: 'budget_over', slots: { percent: 110 } })!,
    budget_followup: composeShelfReminder({ language: 'en', kind: 'budget_followup' })!,
    morning_digest: composeShelfReminder({ language: 'en', kind: 'morning_digest', slots: { count: 3 } })!,
    use_soon: composeShelfReminder({ language: 'en', kind: 'use_soon', slots: { name: '🥛 Milk', days: 2 } })!,
    evening_digest: composeShelfReminder({
      language: 'en',
      kind: 'evening_digest',
      slots: { percent: 40, unchecked: 2 },
    })!,
    auto_wasted: composeShelfReminder({ language: 'en', kind: 'auto_wasted', slots: { name: 'Yogurt' } })!,
    affiliate_engagement: composeShelfReminder({
      language: 'en',
      kind: 'affiliate_engagement',
      slots: { categoryLabel: 'Dairy', count: 3 },
    })!,
    note_reminder: composeShelfReminder({ language: 'en', kind: 'note_reminder' })!,
    user_reminder: composeShelfReminder({
      language: 'en',
      kind: 'user_reminder',
      slots: { name: 'Take medicine', notes: 'After food' },
    })!,
    pairing_request: composeShelfReminder({ language: 'en', kind: 'pairing_request', slots: { requester: 'Ria' } })!,
    pairing_accepted: composeShelfReminder({ language: 'en', kind: 'pairing_accepted' })!,
    items_sent: composeShelfReminder({ language: 'en', kind: 'items_sent', slots: { sender: 'Ria', count: 2 } })!,
  }
  assert.deepEqual(Object.keys(samples).sort(), [...SHELF_REMINDER_KINDS].sort())
  assert.equal(samples.expiry_today.title, 'Milk expires today')
  assert.equal(samples.expiry_today.body, "Use it today so it doesn't go to waste.")
  assert.equal(samples.expiry_tomorrow.title, 'Milk expires tomorrow')
  assert.equal(samples.expiry_advance.title, 'Milk expires in 3 days')
  assert.equal(samples.return_deadline.title, '📦 Return Deadline!')
  assert.equal(samples.return_deadline.body, '📦 2 days left to return Shoes for BDT 500 refund!')
  assert.equal(samples.daily_grocery.title, 'Your shopping list is ready')
  assert.equal(samples.daily_grocery.body, 'You still have 4 item(s) left to pick up today.')
  assert.equal(samples.monthly_grocery.title, 'Monthly grocery check-in')
  assert.equal(samples.streak_milestone.body, '🔥 7-day streak! Badge earned!')
  assert.equal(samples.streak_update.body, '21 day streak 🔥')
  assert.equal(samples.streak_broken.body, '💔 Streak broken. Start fresh tomorrow!')
  assert.equal(samples.weekly_summary.title, '📊 Weekly Summary')
  assert.equal(samples.budget_70.title, 'Budget heads-up')
  assert.match(samples.budget_70.body, /70%/)
  assert.equal(samples.budget_80.title, 'Budget alert')
  assert.equal(samples.budget_90.title, 'Budget warning')
  assert.equal(samples.budget_over.title, 'Over budget')
  assert.equal(samples.budget_followup.title, 'Check your spending')
  assert.equal(samples.morning_digest.title, '🌅 Food Check')
  assert.equal(samples.morning_digest.body, '3 item(s) expiring within 3 days')
  assert.equal(samples.use_soon.title, 'Use soon: 🥛 Milk')
  assert.equal(samples.evening_digest.title, '🌙 Evening Recap')
  assert.equal(samples.evening_digest.body, 'Budget 40% used · 2 grocery item(s) pending')
  assert.equal(samples.auto_wasted.title, '🗑️ Moved to Bin')
  assert.equal(samples.auto_wasted.body, 'Yogurt expired 2+ days ago unused — moved to the Bin.')
  assert.equal(samples.affiliate_engagement.title, 'Expiring soon')
  assert.equal(samples.affiliate_engagement.body, 'Dairy: 3 items expiring soon — check trusted deals')
  assert.equal(samples.note_reminder.title, 'Expense note reminder')
  assert.equal(samples.user_reminder.title, 'Take medicine')
  assert.equal(samples.user_reminder.body, 'After food')
  assert.equal(samples.pairing_request.title, '🔔 Someone wants to join your list')
  assert.equal(samples.pairing_accepted.title, '✅ Your join request was accepted')
  assert.equal(samples.items_sent.body, 'Ria sent you 2 item(s) to your grocery list.')
})

test('published app name/name upload becomes the expires-today sentence', () => {
  const en = composeShelfReminder({ language: 'en', title: 'Milk', body: 'Milk' })
  assert.equal(en?.title, 'Milk expires today')
  assert.equal(en?.body, "Use it today so it doesn't go to waste.")
  const bn = composeShelfReminder({ language: 'bn', title: 'দুধ', body: 'দুধ' })
  assert.equal(bn?.title, 'দুধ আজ মেয়াদ শেষ')
  assert.equal(bn?.body, 'আজই ব্যবহার করুন যাতে নষ্ট না হয়।')
  const kept = composeShelfReminder({ language: 'en', title: 'মেয়াদ শেষ', body: 'দুধ আজ শেষ' })
  assert.equal(kept?.title, 'মেয়াদ শেষ')
  assert.equal(kept?.body, 'দুধ আজ শেষ')
})

test('Bangla expiry advance keeps the app wording', () => {
  const text = composeShelfReminder({
    language: 'bn-BD',
    kind: 'expiry_advance',
    slots: { name: 'দুধ', days: 2, count: 1 },
  })
  assert.equal(text?.title, 'দুধ 2 দিনে মেয়াদ শেষ')
  assert.equal(text?.body, 'মেয়াদ শেষের আগে ব্যবহার করুন, বা পরের কেনাকাটা পরিকল্পনা করুন।')
})
