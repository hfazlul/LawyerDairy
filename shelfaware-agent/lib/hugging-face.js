// lib/hugging-face.js
// Slot 6 — HuggingFace Inference Providers router. Agent-only last fallback
// after Groq / OpenRouter / free Gemini. Model IDs come from Firestore
// /config/ai_models.hf (health checker). Hardcoded fallback if that array is
// empty. HF is never written to Remote Config; the Android app does not use it.

import { pickAwakeKey, sleepKey } from './key-state.js';
import { classifyRateLimit } from './key-state.js';
import { buildResolutionPrompt, parseResolutionResponse } from './llm-prompt.js';

const SLOT = 6;
const HF_ROUTER = 'https://router.huggingface.co/v1/chat/completions';
const HF_FALLBACK = [
  'google/gemma-3-4b-it',
  'aisingapore/Gemma-SEA-LION-v4-27B-IT',
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callOnce(model, apiKey, prompt, timeoutMs) {
  try {
    const res = await fetch(HF_ROUTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const bodyText = await res.text().catch(() => '');
    return { status: res.status, bodyText };
  } catch (err) {
    return { status: 0, bodyText: `network error: ${err.message}` };
  }
}

export async function resolveViaHuggingFace(barcode, hints, liveModels, opts = {}) {
  const picked = await pickAwakeKey(SLOT, process.env.HF_API_TOKEN);
  if (!picked) return { success: false, error: 'all HuggingFace tokens asleep (rate limited)' };

  const allModels = liveModels?.hf?.length ? liveModels.hf : HF_FALLBACK;
  const models = allModels.slice(0, opts.maxModels || allModels.length);
  const prompt = buildResolutionPrompt(barcode, hints);
  const timeoutMs = opts.timeoutMs || 8000;

  for (const model of models) {
    let { status, bodyText } = await callOnce(model, picked.key, prompt, timeoutMs);

    if (status === 503) {
      // Cold-start wait can be 20s — skip on Hobby rather than eating the 10s budget.
      if (timeoutMs < 12_000) continue;
      let eta = 999;
      try {
        eta = JSON.parse(bodyText).estimated_time ?? 999;
      } catch {
        /* ignore */
      }
      if (eta < 60) {
        await sleep(Math.min(eta + 3, 20) * 1000);
        ({ status, bodyText } = await callOnce(model, picked.key, prompt, timeoutMs));
      } else {
        continue; // model too cold, try next model in list
      }
    }

    const rateLimit = classifyRateLimit(status, bodyText);
    if (rateLimit) {
      await sleepKey(SLOT, picked.index, rateLimit);
      continue;
    }
    if (status !== 200) continue;

    let json;
    try {
      json = JSON.parse(bodyText);
    } catch {
      continue;
    }
    const content = json?.choices?.[0]?.message?.content;
    if (!content) continue;

    return parseResolutionResponse(content);
  }

  return { success: false, error: 'no HuggingFace model produced a usable response' };
}
