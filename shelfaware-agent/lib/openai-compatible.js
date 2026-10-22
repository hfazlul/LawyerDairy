// lib/openai-compatible.js
// Groq, OpenRouter, and HuggingFace's Inference API all expose an
// OpenAI-compatible /chat/completions endpoint, so one caller covers all three.

import { classifyRateLimit } from './key-state.js';
import { abortSignalFor } from './abort-signal.js';

/**
 * @returns {Promise<{ok: boolean, status: number, text: string, rateLimit: string|null}>}
 */
export async function callChatCompletion({
  url,
  apiKey,
  model,
  prompt,
  extraHeaders = {},
  timeoutMs = 4000,
  signal,
}) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0,
      }),
      signal: abortSignalFor(timeoutMs, signal),
    });
  } catch (err) {
    return { ok: false, status: 0, text: `network error: ${err.message}`, rateLimit: null };
  }

  const bodyText = await res.text().catch(() => '');

  if (!res.ok) {
    return { ok: false, status: res.status, text: bodyText, rateLimit: classifyRateLimit(res.status, bodyText) };
  }

  let json;
  try {
    json = JSON.parse(bodyText);
  } catch {
    return { ok: false, status: res.status, text: 'malformed JSON response', rateLimit: null };
  }

  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    return { ok: false, status: res.status, text: 'no content in response', rateLimit: null };
  }

  return { ok: true, status: res.status, text: content, rateLimit: null };
}
