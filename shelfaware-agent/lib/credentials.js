// Provider keys and the ShelfAware Firebase account.
// Agent-specific names win. When they are empty, use the model health
// checker's names (GROQ_API_KEY, OPENROUTER_API_KEY, FIREBASE_SERVICE_ACCOUNT_JSON)
// and the webapp's SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON. No new key names.

import fs from 'node:fs';

export function envValue(name) {
  return String(process.env[name] || '').trim();
}

export function firstSet(names) {
  for (const name of names) {
    const value = envValue(name);
    if (value) return { name, value };
  }
  return null;
}

/** Comma-separated pool. GROQ_KEYS, otherwise the health checker's GROQ_API_KEY. */
export function groqKeyPool() {
  return firstSet(['GROQ_KEYS', 'GROQ_API_KEY'])?.value || '';
}

/** Comma-separated pool. OPENROUTER_KEYS, otherwise OPENROUTER_API_KEY. */
export function openRouterKeyPool() {
  return firstSet(['OPENROUTER_KEYS', 'OPENROUTER_API_KEY'])?.value || '';
}

export function parseServiceAccount(raw) {
  const text = String(raw || '').trim().replace(/^['"]|['"]$/g, '');
  if (!text) return null;
  try {
    if (text.startsWith('{')) return JSON.parse(text);
    if (fs.existsSync(text)) return JSON.parse(fs.readFileSync(text, 'utf8'));
  } catch {
    return null;
  }
  return null;
}

/**
 * Split FIREBASE_* fields when all three are set.
 * Otherwise the ShelfAware service account JSON, preferring the webapp name
 * so a Mamlaq FIREBASE_SERVICE_ACCOUNT_JSON is not used while the shelf one exists.
 */
export function resolveFirebaseAdminFields() {
  const projectId = envValue('FIREBASE_PROJECT_ID');
  const clientEmail = envValue('FIREBASE_CLIENT_EMAIL');
  const privateKey = envValue('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey, source: 'FIREBASE_PROJECT_ID' };
  }
  const jsonEnv = firstSet([
    'SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON',
    'FIREBASE_SERVICE_ACCOUNT_JSON',
  ]);
  if (!jsonEnv) return null;
  const parsed = parseServiceAccount(jsonEnv.value);
  if (!parsed?.project_id || !parsed?.client_email || !parsed?.private_key) return null;
  return {
    projectId: String(parsed.project_id),
    clientEmail: String(parsed.client_email),
    privateKey: String(parsed.private_key).replace(/\\n/g, '\n'),
    source: jsonEnv.name,
  };
}
