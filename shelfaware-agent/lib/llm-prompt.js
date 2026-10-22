// lib/llm-prompt.js
// Shared prompt + response-parsing logic for every LLM-based slot
// (Gemini free/paid, OpenRouter, Groq, HuggingFace).
//
// IMPORTANT DESIGN NOTE: a barcode is an opaque number. An LLM has no way to
// "look up" what product it belongs to unless (a) that exact product is
// well-known enough to appear in training data verbatim (rare), or (b) we
// hand it real context. So every prompt below is *hint-gated*: we pass
// whatever partial_name/category hints exist from abandoned_scans, plus a
// GS1-derived likely country, and we instruct the model to say "unknown"
// rather than guess — resolve-product.js treats "unknown" as a slot failure
// and falls through to the next slot instead of writing a hallucinated name.

import { safeParseJson, hasUsableName, countryFromBarcode } from './schema.js';

export function buildResolutionPrompt(barcode, hints = {}) {
  const country = hints.country && hints.country !== 'ALL' ? hints.country : countryFromBarcode(barcode);
  const lines = [
    'You are a product-identification assistant for a grocery/pantry scanner app.',
    `Barcode (GTIN/EAN/UPC): ${barcode}`,
  ];
  if (country) lines.push(`Likely country of origin (from barcode prefix, not certain): ${country}`);
  if (hints.partial_name) lines.push(`User-typed partial product name hint: "${hints.partial_name}"`);
  if (hints.category) lines.push(`User-suggested category hint: "${hints.category}"`);

  lines.push(
    '',
    'Identify this specific product ONLY if you have real knowledge of it. Do NOT guess or invent',
    'plausible-sounding details. If you do not have genuine knowledge of this exact product, return',
    'the literal string "unknown" for "name" and leave other fields null.',
    '',
    'Respond with ONLY a raw JSON object (no markdown fences, no prose) in exactly this shape:',
    '{"name": string, "brand": string|null, "category": string|null, "typical_shelf_life_days": number|null, "emoji": string|null}',
    '',
    'Valid category values: food, grocery, dairy, meat, fish, drinks, medicine, cosmetics, pet, ' +
    'documents, subscriptions, household, returns, warranties, custom.'
  );
  return lines.join('\n');
}

/** Parses a raw LLM text response into a normalized resolver result. */
export function parseResolutionResponse(rawText) {
  const parsed = safeParseJson(rawText);
  if (!parsed || !hasUsableName(parsed.name)) {
    return { success: false, error: 'model returned no usable product name' };
  }
  return {
    success: true,
    confidence: 'medium',
    data: {
      product_name: parsed.name.trim(),
      brand: parsed.brand || undefined,
      category: parsed.category || undefined,
      typical_shelf_life_days: Number.isFinite(Number(parsed.typical_shelf_life_days))
        ? Number(parsed.typical_shelf_life_days)
        : undefined,
      emoji: parsed.emoji || undefined,
    },
  };
}
