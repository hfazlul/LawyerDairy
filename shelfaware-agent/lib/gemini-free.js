// lib/gemini-free.js
// Slot 2 — Gemini FREE key (15 RPM, 1500/day). Used as the one-fast-LLM
// fallback when Groq is missing/asleep; raced only on Pro-sized leftover.

import { isKeyAsleep, sleepKey, classifyRateLimit } from './key-state.js';
import { buildResolutionPrompt, parseResolutionResponse } from './llm-prompt.js';
import { abortSignalFor } from './abort-signal.js';

const SLOT = 2;

export async function resolveViaGeminiFree(barcode, hints, liveModels, opts = {}) {
  const apiKey = process.env.GEMINI_FREE_API_KEY;
  if (!apiKey) return { success: false, error: 'GEMINI_FREE_API_KEY not configured' };
  if (await isKeyAsleep(SLOT, 0)) return { success: false, error: 'Gemini free key asleep (rate limited)' };

  const model = liveModels?.gemini_free?.[0] || 'gemini-2.0-flash';
  const prompt = buildResolutionPrompt(barcode, hints);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const timeoutMs = opts.timeoutMs || 4000;

  let res, bodyText;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0 },
      }),
      signal: abortSignalFor(timeoutMs, opts.signal),
    });
    bodyText = await res.text().catch(() => '');
  } catch (err) {
    return { success: false, error: `network error: ${err.message}` };
  }

  if (!res.ok) {
    const rateLimit = classifyRateLimit(res.status, bodyText);
    if (rateLimit) await sleepKey(SLOT, 0, rateLimit);
    return { success: false, error: `HTTP ${res.status}` };
  }

  let json;
  try {
    json = JSON.parse(bodyText);
  } catch {
    return { success: false, error: 'malformed JSON response' };
  }

  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return { success: false, error: 'no content in response' };

  return parseResolutionResponse(text);
}
