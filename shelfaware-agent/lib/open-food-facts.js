// lib/open-food-facts.js
// Slot 1 — Open Food Facts. Free, no API key, no rate limit. Best signal we
// get for free, but coverage skews toward EU/packaged-food products.

import { normalizeCategory } from './schema.js';
import { abortSignalFor } from './abort-signal.js';

export async function resolveViaOpenFoodFacts(barcode, opts = {}) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
  const timeoutMs = opts.timeoutMs || 2500;

  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'ShelfAwareCentralAgent/1.0 (+https://shelfaware.app)' },
      signal: abortSignalFor(timeoutMs, opts.signal),
    });
  } catch (err) {
    return { success: false, error: `network error: ${err.message}` };
  }

  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}` };
  }

  let json;
  try {
    json = await res.json();
  } catch (err) {
    return { success: false, error: `bad JSON: ${err.message}` };
  }

  if (json.status !== 1 || !json.product) {
    return { success: false, error: 'not found in OFF' };
  }

  const p = json.product;
  const name = p.product_name || p.product_name_en || p.generic_name;
  if (!name) {
    return { success: false, error: 'OFF entry has no usable name' };
  }

  const n = p.nutriments || {};
  const nutrimentScalars = {
    calories_per_100g: numOrUndefined(n['energy-kcal_100g']),
    fat_per_100g: numOrUndefined(n['fat_100g']),
    protein_per_100g: numOrUndefined(n['proteins_100g']),
    carbs_per_100g: numOrUndefined(n['carbohydrates_100g']),
    salt_per_100g: numOrUndefined(n['salt_100g']),
    fiber_per_100g: numOrUndefined(n['fiber_100g']),
  };

  return {
    success: true,
    confidence: 'high',
    data: {
      product_name: name,
      brand: p.brands ? p.brands.split(',')[0].trim() : undefined,
      category: normalizeCategory(p.categories || p.categories_tags?.[0]),
      image_url: p.image_url && p.image_url.startsWith('http') ? p.image_url : undefined,
      nutriments_json: Object.keys(n).length ? JSON.stringify(n) : undefined,
      ...nutrimentScalars,
    },
  };
}

function numOrUndefined(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
