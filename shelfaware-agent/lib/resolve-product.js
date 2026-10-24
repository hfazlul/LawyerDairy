// lib/resolve-product.js
// Orchestrates the fallback chain for one barcode.
//
// Hobby (maxDuration 10s): OFF first, then at most ONE actual LLM per slice.
// agent_queue.llmTried is the resume cursor (Groq → Gemini free → OpenRouter).
// Never wait on two LLMs in one Hobby invocation. Never let a slot hang
// until Vercel kills the function (that can corrupt in-flight writes).
//
// Pro-sized leftover (>12s): may race remaining free LLMs and try HF/search/paid.
// Paid Gemini / Google Search stay skipped unless leftover is that large —
// do not re-enable them on Hobby.

import { resolveViaOpenFoodFacts } from './open-food-facts.js';
import { resolveViaGeminiFree } from './gemini-free.js';
import { resolveViaOpenRouter } from './open-router.js';
import { resolveViaGroq } from './groq.js';
import { resolveViaGoogleSearch } from './google-search.js';
import { resolveViaHuggingFace } from './hugging-face.js';
import { resolveViaGeminiPaid } from './gemini-paid.js';

const WRITE_MARGIN_MS = 800;
const MIN_OFF_MS = 600;
const MIN_LLM_MS = 2000;
const EXTRA_FALLBACK_MS = 12_000;

async function safely(label, fn) {
  try {
    return { label, ...(await fn()) };
  } catch (err) {
    return { label, success: false, error: `threw: ${err.message}` };
  }
}

function remaining(deadlineMs) {
  return deadlineMs - Date.now();
}

function slotTimeout(deadlineMs, cap) {
  return Math.max(400, Math.min(cap, remaining(deadlineMs) - WRITE_MARGIN_MS));
}

function skippedWithoutCall(result) {
  const e = String(result?.error || '').toLowerCase();
  return e.includes('not configured') || e.includes('asleep');
}

/**
 * Race slot factories. First usable product wins; remaining work is aborted.
 * Each factory receives an AbortSignal.
 */
export async function raceSlots(factories) {
  if (!factories.length) return { success: false, error: 'no slots' };

  const controllers = factories.map(() => new AbortController());
  return new Promise((resolve) => {
    let pending = factories.length;
    let firstFailure = null;
    let done = false;

    const finish = (value) => {
      if (done) return;
      done = true;
      resolve(value);
    };

    factories.forEach((factory, i) => {
      Promise.resolve()
        .then(() => factory(controllers[i].signal))
        .then((result) => {
          pending--;
          if (done) return;
          if (result && result.success) {
            for (let j = 0; j < controllers.length; j++) {
              if (j !== i) controllers[j].abort();
            }
            finish(result);
            return;
          }
          if (!firstFailure) firstFailure = result;
          if (pending === 0) {
            finish(firstFailure || { success: false, error: 'all slots failed' });
          }
        })
        .catch((err) => {
          pending--;
          if (done) return;
          if (!firstFailure) firstFailure = { success: false, error: err.message };
          if (pending === 0) finish(firstFailure);
        });
    });
  });
}

const HOBBY_LLM_SLOTS = [
  ['Groq', resolveViaGroq],
  ['GeminiFree', resolveViaGeminiFree],
  ['OpenRouter', resolveViaOpenRouter],
];

function llmOpts(deadlineMs) {
  return { timeoutMs: slotTimeout(deadlineMs, 4000), maxModels: 1 };
}

/**
 * One fast LLM — Groq first (typically the quickest). If that provider is
 * missing/asleep, fall through to Gemini free then OpenRouter. If Groq actually
 * ran and failed, do not wait on a second model (Hobby 10s).
 */
async function resolveOneFastLlm(barcode, mergedHints, liveModels, deadlineMs) {
  const opts = llmOpts(deadlineMs);

  let r = await safely('Groq', () => resolveViaGroq(barcode, mergedHints, liveModels, opts));
  if (r.success || !skippedWithoutCall(r) || remaining(deadlineMs) < MIN_LLM_MS) return r;

  r = await safely('GeminiFree', () => resolveViaGeminiFree(barcode, mergedHints, liveModels, opts));
  if (r.success || !skippedWithoutCall(r) || remaining(deadlineMs) < MIN_LLM_MS) return r;

  return safely('OpenRouter', () => resolveViaOpenRouter(barcode, mergedHints, liveModels, opts));
}

/**
 * Hobby resume: at most one *actual* LLM call per invocation. Unconfigured /
 * asleep providers skip in-slice. Already-tried labels (from agent_queue.llmTried)
 * are not repeated, so hour 2 continues at the next model instead of Groq again.
 */
async function resolveNextHobbyLlm(barcode, mergedHints, liveModels, deadlineMs, alreadyTried) {
  const tried = new Set(alreadyTried);
  const ranThisSlice = [];

  for (const [label, fn] of HOBBY_LLM_SLOTS) {
    if (tried.has(label)) continue;
    if (remaining(deadlineMs) < MIN_LLM_MS) {
      return {
        success: false,
        deferred: true,
        passComplete: false,
        reason: 'time budget: skip LLM',
        ranThisSlice,
      };
    }

    const r = await safely(label, () => fn(barcode, mergedHints, liveModels, llmOpts(deadlineMs)));
    ranThisSlice.push(label);
    if (r.success) return { ...r, ranThisSlice, deferred: false, passComplete: false };
    if (skippedWithoutCall(r)) continue;

    const stillLeft = HOBBY_LLM_SLOTS.some(
      ([l]) => !tried.has(l) && !ranThisSlice.includes(l)
    );
    return {
      ...r,
      ranThisSlice,
      deferred: stillLeft,
      passComplete: !stillLeft,
      reason: stillLeft
        ? `slice: ${label} done, resume next hour`
        : 'all free LLMs tried this pass',
    };
  }

  return {
    success: false,
    deferred: false,
    passComplete: true,
    reason: 'all free LLMs skipped or tried this pass',
    ranThisSlice,
  };
}

/**
 * @param {string} barcode
 * @param {{country: string}} queueMeta
 * @param {{partial_name?: string, category?: string, country?: string}|null} hints
 * @param {object} liveModels
 * @param {{deadlineMs?: number}} [opts]
 * @returns {Promise<{success: boolean, data?: object, source?: string, deferred?: boolean, reason?: string, attempts: Array}>}
 */
export async function resolveProduct(barcode, queueMeta, hints, liveModels, opts = {}) {
  const requested = Number(process.env.FUNCTION_TIME_BUDGET_MS || 8_000);
  const planMax = Number(process.env.VERCEL_FUNCTION_MAX_DURATION_MS || 10_000);
  const deadlineMs = Number.isFinite(opts.deadlineMs)
    ? opts.deadlineMs
    : Date.now() + Math.min(requested, Math.max(3_000, planMax - 2_000));
  const mergedHints = { ...(hints || {}), country: (hints && hints.country) || queueMeta.country };
  const alreadyTried = Array.isArray(queueMeta.llmTried)
    ? queueMeta.llmTried.filter((x) => typeof x === 'string' && x)
    : [];
  const attempts = [];
  const hasHints = !!(mergedHints.partial_name || mergedHints.category);

  // Slot 1 — Open Food Facts. Always first. Short timeout so a hang cannot
  // consume the entire Hobby 10s window.
  if (remaining(deadlineMs) >= MIN_OFF_MS) {
    const offMs = slotTimeout(deadlineMs, 2500);
    const r = await safely('OpenFoodFacts', () =>
      resolveViaOpenFoodFacts(barcode, { timeoutMs: offMs })
    );
    attempts.push(r);
    if (r.success) return { success: true, data: r.data, source: 'AGENT:OpenFoodFacts', attempts };
  }

  if (remaining(deadlineMs) < MIN_LLM_MS) {
    return {
      success: false,
      deferred: true,
      reason: 'time budget: skip LLM',
      attempts,
      llmTried: alreadyTried,
    };
  }

  // Hobby (leftover < 12s): one actual LLM per slice, then park the doc.
  // llmTried on agent_queue is the cursor so the next hour continues.
  if (remaining(deadlineMs) < EXTRA_FALLBACK_MS) {
    const r = await resolveNextHobbyLlm(
      barcode,
      mergedHints,
      liveModels,
      deadlineMs,
      alreadyTried
    );
    attempts.push(r);
    const llmTried = [...new Set([...alreadyTried, ...(r.ranThisSlice || [])])];
    if (r.success) return { success: true, data: r.data, source: `AGENT:${r.label}`, attempts };
    if (r.passComplete) return { success: false, attempts, llmTried };
    return {
      success: false,
      deferred: true,
      reason: r.reason || (hasHints ? 'slice deferred' : 'OFF miss, resume LLM next hour'),
      attempts,
      llmTried,
    };
  }

  // Pro-sized leftover: one fast LLM, then race remaining free slots.
  const r = await resolveOneFastLlm(barcode, mergedHints, liveModels, deadlineMs);
  attempts.push(r);
  if (r.success) return { success: true, data: r.data, source: `AGENT:${r.label}`, attempts };

  const raced = await raceSlots([
    (signal) =>
      safely('OpenRouter', () =>
        resolveViaOpenRouter(barcode, mergedHints, liveModels, {
          timeoutMs: slotTimeout(deadlineMs, 8000),
          maxModels: 1,
          signal,
        })
      ),
    (signal) =>
      safely('GeminiFree', () =>
        resolveViaGeminiFree(barcode, mergedHints, liveModels, {
          timeoutMs: slotTimeout(deadlineMs, 8000),
          signal,
        })
      ),
  ]);
  attempts.push(raced);
  if (raced.success) return { success: true, data: raced.data, source: `AGENT:${raced.label}`, attempts };

  if (remaining(deadlineMs) >= 8_000) {
    const r = await safely('HuggingFace', () =>
      resolveViaHuggingFace(barcode, mergedHints, liveModels, {
        timeoutMs: slotTimeout(deadlineMs, 10000),
        maxModels: 1,
      })
    );
    attempts.push(r);
    if (r.success) return { success: true, data: r.data, source: 'AGENT:HuggingFace', attempts };
  }

  if (remaining(deadlineMs) >= 10_000) {
    const r = await safely('GoogleSearch', () =>
      resolveViaGoogleSearch(barcode, mergedHints, { timeoutMs: slotTimeout(deadlineMs, 8000) })
    );
    attempts.push(r);
    if (r.success) return { success: true, data: r.data, source: 'AGENT:GoogleSearch', attempts };
  }

  if (remaining(deadlineMs) >= 16_000) {
    const r = await safely('GeminiPaid', () =>
      resolveViaGeminiPaid(barcode, mergedHints, liveModels, {
        timeoutMs: slotTimeout(deadlineMs, 15000),
      })
    );
    attempts.push(r);
    if (r.success) return { success: true, data: r.data, source: 'AGENT:GeminiPaid', attempts };
  }

  return { success: false, attempts };
}
