// lib/load-live-models.js
// Reads model fallback lists from Firestore /config/ai_models — a single doc
// that the Phase 3 monthly health checker keeps fresh. This is a *separate*
// source from the app's Firebase Remote Config (which the Android app reads
// directly); mirroring live-model data into Firestore lets this Node.js agent
// read it with one cheap Admin SDK call instead of pulling in the Remote
// Config Admin API.
//
// HuggingFace is stored on this Firestore doc only (`hf`). It is never
// published to Remote Config — the Android app does not use HF.
//
// Falls back to hardcoded defaults if the doc is missing or a given
// provider's field is empty, so a fresh deploy (before Phase 3 has ever run)
// still works.

import { getDb } from './firestore.js';

const DEFAULTS = {
  groq: ['llama-3.1-8b-instant', 'openai/gpt-oss-20b'],
  openrouter: [
    'openrouter/free',
    'liquid/lfm-2.5-2.6b:free',
    'nvidia/nemotron-nano-9b-v2:free',
  ],
  gemini_free: ['gemini-2.0-flash'],
  gemini_paid: ['gemini-2.0-flash'],
  // Last fallback only. Used when Firestore hf is missing or [].
  hf: [
    'google/gemma-3-4b-it',
    'aisingapore/Gemma-SEA-LION-v4-27B-IT',
  ],
};

let cached = null;

export async function loadLiveModels() {
  if (cached) return cached;
  try {
    const db = getDb();
    const snap = await db.collection('config').doc('ai_models').get();
    const data = snap.exists ? snap.data() : {};
    cached = {
      groq: nonEmpty(data.groq) || DEFAULTS.groq,
      openrouter: nonEmpty(data.openrouter) || DEFAULTS.openrouter,
      hf: nonEmpty(data.hf) || DEFAULTS.hf,
      gemini_free: nonEmpty(data.gemini_free) || DEFAULTS.gemini_free,
      gemini_paid: nonEmpty(data.gemini_paid) || DEFAULTS.gemini_paid,
    };
  } catch (err) {
    console.warn('[load-live-models] falling back to defaults:', err.message);
    cached = { ...DEFAULTS };
  }
  return cached;
}

function nonEmpty(arr) {
  return Array.isArray(arr) && arr.length > 0 ? arr : null;
}
