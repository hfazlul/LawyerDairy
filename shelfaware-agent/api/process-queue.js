// api/process-queue.js
// Entry point invoked by Vercel Cron (Hobby: once daily — see vercel.json
// `0 3 * * *`) or an external scheduler. Reads up to BATCH_SIZE pending
// barcodes from /agent_queue, resolves each through the slot fallback chain,
// and writes results.
//
// Cheap external ping (Hobby has no 10-minute cron): GitHub Actions
// `.github/workflows/process-queue.yml` POSTs this route every hour with
// `Authorization: Bearer $CRON_SECRET`. Do not require Pro.
//
// TIME BUDGET: Vercel Hobby maxDuration is 10s. Default FUNCTION_TIME_BUDGET_MS
// is 8000 so a missing env var cannot wait 55s and get killed mid-write.
// Stop pulling new barcodes within TIME_SAFETY_MARGIN_MS of the budget.

import { getDb } from '../lib/firestore.js';
import { loadLiveModels } from '../lib/load-live-models.js';
import { resolveProduct } from '../lib/resolve-product.js';
import {
  writeResolvedProduct,
  deleteQueueDoc,
  recordFailedAttempt,
  readAbandonedScanHints,
  drainAbandonedScan,
  saveQueueResume,
} from '../lib/write-product.js';

const BATCH_SIZE = 30;
// Hobby maxDuration is 10s (vercel.json). Cap requested budget so a stale
// FUNCTION_TIME_BUDGET_MS=55000 env cannot hang until Vercel kills the process.
const PLAN_MAX_MS = Number(process.env.VERCEL_FUNCTION_MAX_DURATION_MS || 10_000);
const REQUESTED_BUDGET_MS = Number(process.env.FUNCTION_TIME_BUDGET_MS || 8_000);
const TIME_BUDGET_MS = Math.min(REQUESTED_BUDGET_MS, Math.max(3_000, PLAN_MAX_MS - 2_000));
const TIME_SAFETY_MARGIN_MS = Math.min(2_000, Math.max(1_000, Math.floor(TIME_BUDGET_MS * 0.2)));
const CONCURRENCY = TIME_BUDGET_MS <= 15_000 ? 3 : 5;

function isAuthorized(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // no secret configured — do not do this in production
  const header = req.headers.authorization || req.headers.Authorization;
  return header === `Bearer ${expected}`;
}

async function processOne(barcode, queueMeta, liveModels, deadlineMs) {
  const hints = await readAbandonedScanHints(barcode).catch(() => null);

  let outcome;
  try {
    outcome = await resolveProduct(barcode, queueMeta, hints, liveModels, { deadlineMs });
  } catch (err) {
    outcome = { success: false, attempts: [{ error: `orchestration threw: ${err.message}` }] };
  }

  if (outcome.success) {
    try {
      await writeResolvedProduct(barcode, outcome.data, queueMeta.country, outcome.source);
      await deleteQueueDoc(barcode);
      // Hints are consumed only after products + product_templates both wrote.
      if (hints) await drainAbandonedScan(barcode).catch(() => {});
    } catch (err) {
      console.error(`[process-queue] write failed for ${barcode}:`, err.message);
      // Keep abandoned_scans so the next cycle still has the typed name/category.
      return { barcode, resolved: false, error: `write failed: ${err.message}` };
    }
    return {
      barcode,
      resolved: true,
      source: outcome.source,
      slotsAttempted: outcome.attempts?.map((a) => a.label).filter(Boolean),
    };
  }

  if (outcome.deferred) {
    // Ran out of Hobby wall-clock — do not burn attempts or hints.
    // Persist llmTried so the next hourly invocation continues the chain.
    if (Array.isArray(outcome.llmTried)) {
      await saveQueueResume(barcode, outcome.llmTried).catch((err) =>
        console.error(`[process-queue] resume-save failed for ${barcode}:`, err.message)
      );
    }
    return {
      barcode,
      resolved: false,
      deferred: true,
      reason: outcome.reason,
      llmTried: outcome.llmTried,
      slotsAttempted: outcome.attempts?.map((a) => a.label).filter(Boolean),
    };
  }

  await recordFailedAttempt(barcode).catch((err) =>
    console.error(`[process-queue] attempt-record failed for ${barcode}:`, err.message)
  );

  return {
    barcode,
    resolved: false,
    source: outcome.source,
    slotsAttempted: outcome.attempts?.map((a) => a.label).filter(Boolean),
  };
}

/** Simple bounded-concurrency runner — avoids pulling in a dependency for this. */
async function runWithConcurrency(items, limit, worker) {
  const results = [];
  let index = 0;
  async function next() {
    while (index < items.length) {
      const i = index++;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const startedAt = Date.now();
  const deadlineMs = startedAt + TIME_BUDGET_MS;
  const db = getDb();

  let snap;
  try {
    snap = await db
      .collection('agent_queue')
      .orderBy('createdAt', 'asc')
      .limit(BATCH_SIZE)
      .get();
  } catch (err) {
    console.error('[process-queue] failed to read agent_queue:', err.message);
    res.status(500).json({ error: 'failed to read agent_queue', detail: err.message });
    return;
  }

  if (snap.empty) {
    res.status(200).json({ processed: 0, message: 'queue empty' });
    return;
  }

  const liveModels = await loadLiveModels();

  const docs = snap.docs;
  const results = [];
  let i = 0;
  while (i < docs.length) {
    if (Date.now() - startedAt > TIME_BUDGET_MS - TIME_SAFETY_MARGIN_MS) {
      console.warn(`[process-queue] time budget reached, stopping early at ${i}/${docs.length}`);
      break;
    }
    const chunk = docs.slice(i, i + CONCURRENCY);
    const chunkResults = await runWithConcurrency(chunk, CONCURRENCY, async (doc) => {
      const data = doc.data();
      return processOne(
        doc.id,
        {
          country: data.country || 'ALL',
          llmTried: Array.isArray(data.llmTried) ? data.llmTried : [],
        },
        liveModels,
        deadlineMs
      );
    });
    results.push(...chunkResults);
    i += CONCURRENCY;
  }

  const resolvedCount = results.filter((r) => r.resolved).length;
  res.status(200).json({
    processed: results.length,
    resolved: resolvedCount,
    unresolved: results.length - resolvedCount,
    remainingInQueue: docs.length - results.length,
    durationMs: Date.now() - startedAt,
    results,
  });
}
