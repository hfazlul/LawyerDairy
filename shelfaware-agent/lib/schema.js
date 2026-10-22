// lib/schema.js
// Shared constants + normalization helpers used by every resolver slot and
// by write-product.js. Centralizing this avoids each slot inventing its own
// category strings, which would silently fall back to "custom" on-device.

// Must match ItemCategory.kt exactly — unknown keys fall back to "custom" in-app.
export const VALID_CATEGORIES = [
  'food', 'grocery', 'dairy', 'meat', 'fish', 'drinks', 'medicine',
  'cosmetics', 'pet', 'documents', 'subscriptions', 'household',
  'returns', 'warranties', 'custom',
];

// Loose keyword → category map, used to normalize free-text category guesses
// coming from Open Food Facts tags or LLM output into a valid ItemCategory key.
// ORDER MATTERS. `/pet/` used to match French OFF "Petit-déjeuners" (breakfast)
// as a substring — Nutella 3017620422003 was written as category "pet".
// Breakfast/food/spread must win first; "pet"/"dog"/"cat" are whole words only.
const CATEGORY_KEYWORDS = [
  [/dairy|milk|cheese|yogurt|yoghurt|butter|cream/i, 'dairy'],
  [/meat|beef|chicken|pork|sausage|poultry/i, 'meat'],
  [/fish|seafood|shrimp|prawn|tuna|salmon/i, 'fish'],
  [/beverage|drink|juice|soda|water|tea|coffee|energy.?drink|caf[eé]s?\b/i, 'drinks'],
  [/medicine|pharma|drug|tablet|syrup|capsule/i, 'medicine'],
  [/cosmetic|beauty|skincare|shampoo|lotion|makeup/i, 'cosmetics'],
  [/petit[- ]?d[ée]jeuners?|breakfasts?|spreads?|p[âa]tes? à tartiner|tartiner|confectionary|chocolate/i, 'food'],
  [/\bpets?\b|\bdogs?\b|\bcats?\b|animal[- ]?feed|pet[- ]?food/i, 'pet'],
  [/document|paper|stationery/i, 'documents'],
  [/subscription|membership/i, 'subscriptions'],
  [/household|cleaning|detergent|tissue|paper.?towel/i, 'household'],
  [/grocery|snack|cereal|bakery|bread|spice|condiment|sauce|oil|rice|flour/i, 'grocery'],
  [/food/i, 'food'],
];

export function normalizeCategory(raw) {
  if (!raw || typeof raw !== 'string') return 'custom';
  const cleaned = raw.trim().toLowerCase();
  if (VALID_CATEGORIES.includes(cleaned)) return cleaned;
  for (const [regex, category] of CATEGORY_KEYWORDS) {
    if (regex.test(cleaned)) return category;
  }
  return 'custom';
}

// Default emoji per category — used whenever a resolver doesn't produce one.
export const CATEGORY_EMOJI = {
  food: '🍽️', grocery: '🛒', dairy: '🥛', meat: '🥩', fish: '🐟',
  drinks: '🥤', medicine: '💊', cosmetics: '💄', pet: '🐾',
  documents: '📄', subscriptions: '🔁', household: '🧽',
  returns: '↩️', warranties: '🧾', custom: '📦',
};

export function emojiForCategory(category) {
  return CATEGORY_EMOJI[category] || CATEGORY_EMOJI.custom;
}

// GS1 / GTIN prefix → likely country of origin. Not authoritative (brand
// owner's country, not manufacturing country), but it's a free, offline signal
// that meaningfully grounds an LLM guess instead of it guessing blind.
// Ranges abbreviated to the common/high-traffic ones; falls back to null.
const GS1_PREFIX_RANGES = [
  [[0, 19], 'US/CA'], [[30, 39], 'US'], [[60, 139], 'US/CA'],
  [[300, 379], 'FR'], [[400, 440], 'DE'], [[450, 459], 'JP'], [[490, 499], 'JP'],
  [[460, 469], 'RU'], [[470, 470], 'KG'], [[471, 471], 'TW'], [[474, 474], 'EE'],
  [[500, 509], 'GB'], [[520, 521], 'GR'], [[529, 529], 'CY'], [[530, 530], 'AL'],
  [[531, 531], 'MK'], [[535, 535], 'MT'], [[539, 539], 'IE'], [[540, 549], 'BE/LU'],
  [[560, 560], 'PT'], [[569, 569], 'IS'], [[570, 579], 'DK'], [[590, 590], 'PL'],
  [[599, 599], 'HU'], [[600, 601], 'ZA'], [[608, 608], 'BH'], [[609, 609], 'MU'],
  [[611, 611], 'MA'], [[613, 613], 'DZ'], [[615, 615], 'NG'], [[616, 616], 'KE'],
  [[618, 618], 'CI'], [[619, 619], 'TN'], [[621, 621], 'SY'], [[622, 622], 'EG'],
  [[624, 624], 'LY'], [[625, 625], 'JO'], [[626, 626], 'IR'], [[627, 627], 'KW'],
  [[628, 628], 'SA'], [[629, 629], 'AE'], [[640, 649], 'FI'], [[690, 699], 'CN'],
  [[700, 709], 'NO'], [[729, 729], 'IL'], [[730, 739], 'SE'], [[740, 740], 'GT'],
  [[741, 741], 'SV'], [[742, 742], 'HN'], [[743, 743], 'NI'], [[744, 744], 'CR'],
  [[745, 745], 'PA'], [[746, 746], 'DO'], [[750, 750], 'MX'], [[754, 755], 'CA'],
  [[759, 759], 'VE'], [[760, 769], 'CH/LI'], [[770, 771], 'CO'], [[773, 773], 'UY'],
  [[775, 775], 'PE'], [[777, 777], 'BO'], [[778, 779], 'AR'], [[780, 780], 'CL'],
  [[784, 784], 'PY'], [[786, 786], 'EC'], [[789, 790], 'BR'], [[800, 839], 'IT'],
  [[840, 849], 'ES'], [[850, 850], 'CU'], [[858, 858], 'SK'], [[859, 859], 'CZ'],
  [[860, 860], 'RS'], [[865, 865], 'MN'], [[867, 867], 'KP'], [[868, 869], 'TR'],
  [[870, 879], 'NL'], [[880, 880], 'KR'], [[884, 884], 'KH'], [[885, 885], 'TH'],
  [[888, 888], 'SG'], [[890, 890], 'IN'], [[893, 893], 'VN'], [[894, 894], 'BD'],
  [[896, 896], 'PK'],
  [[899, 899], 'ID'], [[900, 919], 'AT'], [[930, 939], 'AU'], [[940, 949], 'NZ'],
  [[955, 955], 'MY'], [[958, 958], 'MO'], [[977, 977], 'ISSN'], [[978, 979], 'ISBN'],
];

export function countryFromBarcode(barcode) {
  const digits = String(barcode).replace(/\D/g, '');
  if (digits.length < 3) return null;
  const prefix3 = parseInt(digits.slice(0, 3), 10);
  for (const [[lo, hi], country] of GS1_PREFIX_RANGES) {
    if (prefix3 >= lo && prefix3 <= hi) return country;
  }
  return null;
}

// Strips markdown code fences and parses the first JSON object/array found.
// LLMs routinely wrap JSON in ```json ... ``` despite instructions not to.
export function safeParseJson(text) {
  if (!text || typeof text !== 'string') return null;
  let cleaned = text.trim();
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) cleaned = fenced[1].trim();
  const start = cleaned.search(/[{[]/);
  if (start === -1) return null;
  // Walk from the first brace and try progressively shorter trailing cuts
  // in case of trailing prose after the JSON — cheap and dependency-free.
  for (let end = cleaned.length; end > start; end--) {
    const candidate = cleaned.slice(start, end);
    try {
      return JSON.parse(candidate);
    } catch {
      // keep shrinking
    }
  }
  return null;
}

// A resolver result is only usable if it has a real, non-placeholder name.
export function hasUsableName(name) {
  if (!name || typeof name !== 'string') return false;
  const n = name.trim().toLowerCase();
  if (n.length < 2) return false;
  return !['unknown', 'n/a', 'na', 'null', 'none', 'not found', 'unidentified'].includes(n);
}

/**
 * Template `name` is what Add Item search prefixes against. OFF often stores the
 * generic line ("The Original Coffee Mix") in product_name and the brand
 * ("MacCoffee") separately — without combining them, searching the brand never hits.
 * Products keep brand as its own field (the app concatenates on barcode lookup).
 */
export function displayProductName(resolved) {
  const name = String(resolved?.product_name || '').trim();
  const brand = String(resolved?.brand || '').trim();
  if (!name) return brand;
  if (!brand) return name;
  const n = name.toLowerCase();
  const b = brand.toLowerCase();
  if (n === b || n.startsWith(b + ' ') || n.includes(' ' + b + ' ') || n.endsWith(' ' + b)) {
    return name;
  }
  return `${brand} ${name}`;
}

/**
 * product_templates.country_code must be ISO-3166 alpha-2 or "ALL".
 * Never persist GS1 composites ("US/CA") — those would miss every country file.
 */
export function templateCountryCode(queueCountry) {
  const cc = String(queueCountry || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(cc)) return cc;
  return 'ALL';
}
