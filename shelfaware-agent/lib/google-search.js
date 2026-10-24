// lib/google-search.js
// Slot 5 — Google Custom Search (100 queries/day per key; rotate across the
// GOOGLE_SEARCH_API_KEY pool). Unlike the LLM slots, this genuinely looks the
// barcode up on the live web — but Custom Search only returns titles/snippets,
// not structured product data, so we heuristically clean the top result's
// title into a probable product name. Lower confidence than Open Food Facts,
// higher confidence than an ungrounded LLM guess.

import { pickAwakeKey, sleepKey, classifyRateLimit } from './key-state.js';
import { normalizeCategory } from './schema.js';

const SLOT = 5;

// Strips common e-commerce/site cruft from a search-result title so what's
// left is (usually) just "Brand Product Name".
function cleanTitle(title) {
  return title
    .replace(/\s*[-|:]\s*(Amazon|Walmart|eBay|Buy Online|Official Site).*/i, '')
    .replace(/\bbarcode\b/gi, '')
    .replace(/\b\d{8,14}\b/g, '') // strip the barcode digits themselves if echoed
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function resolveViaGoogleSearch(barcode, hints, opts = {}) {
  const picked = await pickAwakeKey(SLOT, process.env.GOOGLE_SEARCH_API_KEY);
  if (!picked) return { success: false, error: 'all Google Search keys asleep (rate limited/exhausted)' };

  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!cx) return { success: false, error: 'GOOGLE_SEARCH_CX not configured' };

  const query = hints?.partial_name ? `${barcode} ${hints.partial_name}` : `"${barcode}" product`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${picked.key}&cx=${cx}&q=${encodeURIComponent(query)}&num=3`;

  let res, bodyText;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(opts.timeoutMs || 8000) });
    bodyText = await res.text().catch(() => '');
  } catch (err) {
    return { success: false, error: `network error: ${err.message}` };
  }

  if (!res.ok) {
    const rateLimit = classifyRateLimit(res.status, bodyText) || (res.status === 429 ? 'DAILY' : null);
    if (rateLimit) await sleepKey(SLOT, picked.index, rateLimit);
    return { success: false, error: `HTTP ${res.status}` };
  }

  let json;
  try {
    json = JSON.parse(bodyText);
  } catch {
    return { success: false, error: 'malformed JSON response' };
  }

  const items = json.items || [];
  if (!items.length) return { success: false, error: 'no search results' };

  const top = items[0];
  const name = cleanTitle(top.title || '');
  if (!name || name.length < 3) return { success: false, error: 'could not extract a usable name' };

  // Very light category guess from combined title+snippet text.
  const combinedText = `${top.title || ''} ${top.snippet || ''}`;
  const category = normalizeCategory(combinedText);

  return {
    success: true,
    confidence: 'low',
    data: {
      product_name: name,
      category,
      image_url: top.pagemap?.cse_image?.[0]?.src?.startsWith('http')
        ? top.pagemap.cse_image[0].src
        : undefined,
    },
  };
}
