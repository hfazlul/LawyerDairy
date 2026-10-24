// lib/budget-gate.js
// $X/month dynamic budget gate for Slot 7 (Gemini PAID). Spreads the remaining
// monthly budget evenly across remaining days, so a burst early in the month
// doesn't starve the rest of it. State lives in billing/gemini_paid_budget.
//
// NOTE ON COST ESTIMATION: token pricing changes over time and per-model.
// COST_PER_1K_INPUT / COST_PER_1K_OUTPUT below are placeholders — verify
// current rates at https://ai.google.dev/pricing before relying on this for
// real budget enforcement, and update the constants (or move them to env vars).

import { getDb, FieldValue } from './firestore.js';

const DOC_PATH = ['billing', 'gemini_paid_budget'];
const TOTAL_MONTHLY_BUDGET = Number(process.env.PAID_BUDGET_USD || 2.0);

// Placeholder pricing — update to match the model actually configured in
// gemini_paid_model. Figures are USD per 1K tokens.
const COST_PER_1K_INPUT = Number(process.env.GEMINI_PAID_COST_PER_1K_INPUT || 0.0001);
const COST_PER_1K_OUTPUT = Number(process.env.GEMINI_PAID_COST_PER_1K_OUTPUT || 0.0004);

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function dayKey(d = new Date()) {
  return `${monthKey(d)}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
function daysInMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

export function estimateCostUsd(inputTokens = 0, outputTokens = 0) {
  return (inputTokens / 1000) * COST_PER_1K_INPUT + (outputTokens / 1000) * COST_PER_1K_OUTPUT;
}

/** Returns true if today's spend is still under the dynamically spread daily allowance. */
export async function isWithinDailyBudget() {
  const db = getDb();
  const snap = await db.collection(DOC_PATH[0]).doc(DOC_PATH[1]).get();
  const data = snap.exists ? snap.data() : {};

  const now = new Date();
  const daysLeft = Math.max(1, daysInMonth(now) - now.getUTCDate() + 1);
  const spentMonth = data[monthKey(now)] || 0;
  const remaining = Math.max(0, TOTAL_MONTHLY_BUDGET - spentMonth);
  const dailyAllow = remaining / daysLeft;
  const spentToday = data[dayKey(now)] || 0;

  return spentToday < dailyAllow;
}

/** Call after a successful paid Gemini call to record spend against both the day and month keys. */
export async function recordSpend(costUsd) {
  if (!costUsd || costUsd <= 0) return;
  const db = getDb();
  const now = new Date();
  await db.collection(DOC_PATH[0]).doc(DOC_PATH[1]).set(
    {
      [monthKey(now)]: FieldValue.increment(costUsd),
      [dayKey(now)]: FieldValue.increment(costUsd),
      lastSpendAt: Date.now(),
    },
    { merge: true }
  );
}
