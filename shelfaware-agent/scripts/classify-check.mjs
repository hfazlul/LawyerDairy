// Dry-run: prove Petit-déjeuners cannot classify as "pet", and that a
// first-success race returns without waiting on the loser.
// Usage: node scripts/classify-check.mjs

import { normalizeCategory } from '../lib/schema.js';
import { raceSlots } from '../lib/resolve-product.js';

const cases = [
  ['Petit-déjeuners', 'food'],
  ['en:Petit-déjeuners, en:Pâtes à tartiner', 'food'],
  [
    'en:Confectionary based spreads, en:Petit-déjeuners, en:Produits à tartiner, en:Pâtes à tartiner',
    'food',
  ],
  ['en:breakfasts', 'food'],
  ['pet food', 'pet'],
  ['dog food', 'pet'],
  ['cat litter', 'pet'],
  ['instant coffee 3-in-1', 'drinks'],
  ['Cafés, Boissons', 'drinks'],
  ['food', 'food'],
];

let failed = 0;
for (const [input, expected] of cases) {
  const got = normalizeCategory(input);
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'ok' : 'FAIL'}  ${JSON.stringify(input)} → ${got} (want ${expected})`);
}

async function fetchOffCategory(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ShelfAwareCentralAgent/1.0 (+https://shelfaware.app classify-check)' },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404) return { found: false, status: 404 };
  if (!res.ok) return { found: false, status: res.status };
  const json = await res.json();
  if (json.status !== 1 || !json.product) return { found: false, status: json.status };
  const raw = json.product.categories || json.product.categories_tags?.[0] || '';
  return {
    found: true,
    name: json.product.product_name || json.product.product_name_en,
    brand: json.product.brands,
    raw,
    mapped: normalizeCategory(raw),
  };
}

console.log('\n--- live OFF ---');
const nutella = await fetchOffCategory('3017620422003');
if (!nutella.found) {
  console.log('WARN  Nutella 3017620422003 not in OFF (skip live assert)');
} else {
  console.log(`Nutella raw: ${nutella.raw}`);
  console.log(`Nutella mapped: ${nutella.mapped}`);
  if (nutella.mapped === 'pet') {
    failed++;
    console.log('FAIL  Nutella would still write category pet');
  } else if (nutella.mapped !== 'food') {
    console.log(`WARN  Nutella mapped to ${nutella.mapped}, not food (but not pet)`);
  } else {
    console.log('ok    Nutella new writes → food');
  }
}

const mac = await fetchOffCategory('8887290130028');
if (!mac.found) {
  console.log(`MacCoffee jar 8887290130028 not in OFF (HTTP ${mac.status}) — LLM/hint path`);
  const hintMapped = normalizeCategory('instant coffee jar');
  console.log(`hint "instant coffee jar" → ${hintMapped}`);
  if (hintMapped !== 'drinks') {
    failed++;
    console.log('FAIL  coffee hint should map to drinks');
  }
} else {
  console.log(`MacCoffee jar raw: ${mac.raw}`);
  console.log(`MacCoffee jar mapped: ${mac.mapped}`);
  if (mac.mapped === 'pet') {
    failed++;
    console.log('FAIL  MacCoffee jar would write pet');
  }
}

console.log('\n--- raceSlots ---');
const slow = (signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve({ success: true, label: 'slow' }), 400);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('aborted'));
    });
  });
const fast = () => Promise.resolve({ success: true, label: 'fast' });
const started = Date.now();
const raced = await raceSlots([slow, fast]);
const elapsed = Date.now() - started;
if (!raced.success || raced.label !== 'fast') {
  failed++;
  console.log(`FAIL  race winner was ${raced.label}`);
} else if (elapsed > 250) {
  failed++;
  console.log(`FAIL  race waited ${elapsed}ms for loser`);
} else {
  console.log(`ok    first success won in ${elapsed}ms (loser aborted)`);
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
