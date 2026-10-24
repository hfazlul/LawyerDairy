// lib/open-router.js
// Slot 3 — OpenRouter free models. On Hobby this is a last one-fast-LLM
// fallback (not raced). On Pro leftover it may be raced with Gemini free.

import { openRouterKeyPool } from './credentials.js';
import { pickAwakeKey, sleepKey } from './key-state.js';
import { callChatCompletion } from './openai-compatible.js';
import { buildResolutionPrompt, parseResolutionResponse } from './llm-prompt.js';

const SLOT = 3;
const URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function resolveViaOpenRouter(barcode, hints, liveModels, opts = {}) {
  const picked = await pickAwakeKey(SLOT, openRouterKeyPool());
  if (!picked) return { success: false, error: 'all OpenRouter keys asleep (rate limited)' };

  const allModels = liveModels?.openrouter?.length
    ? liveModels.openrouter
    : ['meta-llama/llama-3.3-70b-instruct:free'];
  const models = allModels.slice(0, opts.maxModels || allModels.length);
  const prompt = buildResolutionPrompt(barcode, hints);

  for (const model of models) {
    const result = await callChatCompletion({
      url: URL,
      apiKey: picked.key,
      model,
      prompt,
      extraHeaders: { 'HTTP-Referer': 'https://shelfaware.app', 'X-Title': 'ShelfAware Central Agent' },
      timeoutMs: opts.timeoutMs || 4000,
      signal: opts.signal,
    });

    if (result.rateLimit) {
      await sleepKey(SLOT, picked.index, result.rateLimit);
      continue;
    }
    if (!result.ok) continue;

    return parseResolutionResponse(result.text);
  }

  return { success: false, error: 'no OpenRouter model produced a usable response' };
}
