// lib/key-state.js
// Sleep/wake bookkeeping for API keys that get rate limited.
// - RPM limit (HTTP 429, per-minute) -> sleep the key 65s
// - Daily limit (429 / daily quota exhausted) -> sleep the key 24h
// State lives in a single small doc: billing/key_states, keyed by "s{slot}_k{index}".
// A single doc (not one-doc-per-key) keeps this to one read + one merge-write
// per cron invocation instead of N.

import { getDb } from './firestore.js';

const DOC_PATH = ['billing', 'key_states'];

let cache = null; // in-memory cache for the lifetime of one invocation

async function loadState() {
  if (cache) return cache;
  const db = getDb();
  const snap = await db.collection(DOC_PATH[0]).doc(DOC_PATH[1]).get();
  cache = snap.exists ? snap.data() : {};
  return cache;
}

function keyId(slot, keyIndex) {
  return `s${slot}_k${keyIndex}`;
}

/** Returns true if this key is currently asleep (rate limited). */
export async function isKeyAsleep(slot, keyIndex) {
  const state = await loadState();
  const entry = state[keyId(slot, keyIndex)];
  if (!entry || !entry.sleepUntil) return false;
  return Date.now() < entry.sleepUntil;
}

/** Marks a key asleep. type: 'RPM' (65s) or 'DAILY' (24h). */
export async function sleepKey(slot, keyIndex, type = 'RPM') {
  const duration = type === 'RPM' ? 65_000 : 86_400_000;
  const db = getDb();
  const entry = { sleepUntil: Date.now() + duration, reason: type, updatedAt: Date.now() };
  await db.collection(DOC_PATH[0]).doc(DOC_PATH[1]).set(
    { [keyId(slot, keyIndex)]: entry },
    { merge: true }
  );
  if (cache) cache[keyId(slot, keyIndex)] = entry;
}

/**
 * Given a comma-separated env var of keys for a slot, returns the first key
 * that isn't currently asleep, along with its index (for sleepKey calls).
 * Returns null if every key in the pool is asleep.
 */
export async function pickAwakeKey(slot, envValue) {
  const keys = (envValue || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  for (let i = 0; i < keys.length; i++) {
    if (!(await isKeyAsleep(slot, i))) {
      return { key: keys[i], index: i };
    }
  }
  return null;
}

/** Classifies a fetch Response into 'RPM' | 'DAILY' | null (not rate-limited). */
export function classifyRateLimit(status, bodyText = '') {
  if (status !== 429) return null;
  const t = bodyText.toLowerCase();
  if (t.includes('daily') || t.includes('per day') || t.includes('quota')) return 'DAILY';
  return 'RPM';
}
