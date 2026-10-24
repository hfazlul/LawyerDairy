// lib/write-product.js
// Implements the "Full Write-Set Per Resolved Barcode" contract from the
// blueprint: /products + /product_templates must BOTH be written (merge),
// and /agent_queue + /abandoned_scans must both be drained.
//
// The /product_templates.updated_at field is the one landmine in this whole
// system: it MUST be a Number (epoch ms), never a Firestore Timestamp, or
// ProductTemplateWorker's `whereGreaterThan("updated_at", lastFetchMs)` query
// silently never matches the doc and it never reaches any device.

import { getDb, FieldValue, Timestamp } from './firestore.js';
import {
  normalizeCategory,
  emojiForCategory,
  displayProductName,
  templateCountryCode,
} from './schema.js';

/**
 * @param {string} barcode
 * @param {object} resolved - normalized product fields from a resolver slot
 * @param {string} country - uppercase ISO country or "ALL", from agent_queue doc
 * @param {string} source - e.g. "AGENT:OpenFoodFacts", "AGENT:Groq" (for debugging/audit)
 */
export async function writeResolvedProduct(barcode, resolved, country, source) {
  const db = getDb();
  const category = normalizeCategory(resolved.category);
  const emoji = resolved.emoji || emojiForCategory(category);

  const productDoc = {
    barcode,
    product_name: resolved.product_name,
    source: 'AGENT',
  };
  if (resolved.brand) productDoc.brand = resolved.brand;
  if (category) productDoc.category = category;
  if (Number.isFinite(resolved.typical_shelf_life_days)) {
    productDoc.typical_shelf_life_days = resolved.typical_shelf_life_days;
  }
  if (resolved.nutriments_json) productDoc.nutriments_json = resolved.nutriments_json;
  if (resolved.image_url) productDoc.image_url = resolved.image_url;
  for (const key of [
    'calories_per_100g', 'fat_per_100g', 'protein_per_100g',
    'carbs_per_100g', 'salt_per_100g', 'fiber_per_100g',
  ]) {
    if (Number.isFinite(resolved[key])) productDoc[key] = resolved[key];
  }
  productDoc.last_updated = Timestamp.now();

  const templateDoc = {
    barcode,
    // Brand must live in `name` — the app search is prefix-on-name and has no brand field.
    name: displayProductName(resolved),
    category,
    emoji,
    country_code: templateCountryCode(country),
    created_by: 'agent',
    updated_at: Date.now(), // CRITICAL: Number, not Timestamp — see file header.
  };

  const batch = db.batch();
  batch.set(db.collection('products').doc(barcode), productDoc, { merge: true });
  batch.set(db.collection('product_templates').doc(barcode), templateDoc, { merge: true });
  await batch.commit();

  console.log(`[write-product] wrote ${barcode} via ${source}`);
}

/** Deletes the agent_queue doc — call after a successful resolve. */
export async function deleteQueueDoc(barcode) {
  const db = getDb();
  await db.collection('agent_queue').doc(barcode).delete();
}

/**
 * Increments the attempts counter on a failed resolve. Once attempts >= maxAttempts,
 * deletes the doc so a permanently-unresolvable barcode doesn't loop forever.
 * @returns {Promise<boolean>} true if the doc was given up on (deleted)
 */
export async function recordFailedAttempt(barcode, maxAttempts = 5) {
  const db = getDb();
  const ref = db.collection('agent_queue').doc(barcode);
  const snap = await ref.get();
  const attempts = ((snap.exists && snap.data().attempts) || 0) + 1;

  if (attempts >= maxAttempts) {
    await ref.delete();
    console.warn(`[write-product] giving up on ${barcode} after ${attempts} attempts`);
    return true;
  }
  // Clear llmTried so the next pass retries Groq → Gemini → OpenRouter.
  await ref.set(
    { attempts, lastAttemptAt: FieldValue.serverTimestamp(), llmTried: [] },
    { merge: true }
  );
  return false;
}

/**
 * Park a Hobby time-slice without burning attempts. Hints in abandoned_scans
 * stay put — only drainAbandonedScan after a successful write.
 */
export async function saveQueueResume(barcode, llmTried) {
  const db = getDb();
  await db.collection('agent_queue').doc(barcode).set(
    {
      llmTried: Array.isArray(llmTried) ? llmTried : [],
      lastSliceAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/** Reads abandoned_scans hints for a barcode, if present. Does NOT delete — call drainAbandonedScan separately. */
export async function readAbandonedScanHints(barcode) {
  const db = getDb();
  const snap = await db.collection('abandoned_scans').doc(barcode).get();
  if (!snap.exists) return null;
  const data = snap.data();
  return { partial_name: data.partial_name, category: data.category, country: data.country };
}

/** Deletes the abandoned_scans doc. Call only after products + product_templates wrote. */
export async function drainAbandonedScan(barcode) {
  const db = getDb();
  await db.collection('abandoned_scans').doc(barcode).delete();
}
