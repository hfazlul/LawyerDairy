// lib/gemini-paid.js
// Slot 7 — Gemini PAID key. LAST RESORT, gated by budget-gate.js.
//
// Optional enhancement (off by default): Gemini's API supports a Google
// Search grounding tool, which is the one slot in this whole chain that
// could plausibly do a *real* lookup instead of relying on memorized
// training data — genuinely useful for a last-resort slot. It costs extra
// per grounded call on top of token cost, which isn't reflected in the
// estimateCostUsd() token-only estimate below, so it defaults OFF. Flip
// GEMINI_PAID_GROUNDING=true once you've checked current grounding pricing
// at https://ai.google.dev/pricing and decided it's worth it.

import { isWithinDailyBudget, recordSpend, estimateCostUsd } from './budget-gate.js';
import { buildResolutionPrompt, parseResolutionResponse } from './llm-prompt.js';
import { abortSignalFor } from './abort-signal.js';

export async function resolveViaGeminiPaid(barcode, hints, liveModels, opts = {}) {
  const apiKey = process.env.GEMINI_PAID_API_KEY;
  if (!apiKey) return { success: false, error: 'GEMINI_PAID_API_KEY not configured' };

  if (!(await isWithinDailyBudget())) {
    return { success: false, error: 'daily budget exhausted for Gemini paid slot' };
  }

  const model = liveModels?.gemini_paid?.[0] || 'gemini-2.0-flash';
  const prompt = buildResolutionPrompt(barcode, hints);
  const groundingEnabled = String(process.env.GEMINI_PAID_GROUNDING).toLowerCase() === 'true';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 200, temperature: 0 },
  };
  if (groundingEnabled) {
    requestBody.tools = [{ google_search: {} }];
  }

  let res, bodyText;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: abortSignalFor(opts.timeoutMs || 15000, opts.signal),
    });
    bodyText = await res.text().catch(() => '');
  } catch (err) {
    return { success: false, error: `network error: ${err.message}` };
  }

  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}` };
  }

  let json;
  try {
    json = JSON.parse(bodyText);
  } catch {
    return { success: false, error: 'malformed JSON response' };
  }

  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  const usage = json?.usageMetadata || {};
  const cost = estimateCostUsd(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
  await recordSpend(cost);

  if (!text) return { success: false, error: 'no content in response' };

  return parseResolutionResponse(text);
}
