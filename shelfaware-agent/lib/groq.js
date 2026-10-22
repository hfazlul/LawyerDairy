// lib/groq.js
// Slot 4 — Groq. Free tier, 14,400 req/day (shared across GROQ_KEYS pool).

import { pickAwakeKey, sleepKey } from './key-state.js';
import { callChatCompletion } from './openai-compatible.js';
import { buildResolutionPrompt, parseResolutionResponse } from './llm-prompt.js';

const SLOT = 4;
const URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function resolveViaGroq(barcode, hints, liveModels, opts = {}) {
  const picked = await pickAwakeKey(SLOT, process.env.GROQ_KEYS);
  if (!picked) return { success: false, error: 'all Groq keys asleep (rate limited)' };

  const allModels = liveModels?.groq?.length ? liveModels.groq : ['llama-3.1-8b-instant'];
  const models = allModels.slice(0, opts.maxModels || allModels.length);
  const prompt = buildResolutionPrompt(barcode, hints);

  for (const model of models) {
    const result = await callChatCompletion({
      url: URL,
      apiKey: picked.key,
      model,
      prompt,
      timeoutMs: opts.timeoutMs || 4000,
      signal: opts.signal,
    });

    if (result.rateLimit) {
      await sleepKey(SLOT, picked.index, result.rateLimit);
      continue; // try next model with the same (now-asleep-tracked) key skipped next barcode
    }
    if (!result.ok) continue; // try next model in the fallback list

    return parseResolutionResponse(result.text);
  }

  return { success: false, error: 'no Groq model produced a usable response' };
}
