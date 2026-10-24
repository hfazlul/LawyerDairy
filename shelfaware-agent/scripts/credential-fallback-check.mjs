// One local check: agent key pools fall back to health-checker names.
// Prints a status line only. Does not call a provider or Firebase.

import { groqKeyPool, openRouterKeyPool, resolveFirebaseAdminFields } from '../lib/credentials.js';

const NAMES = [
  'GROQ_KEYS',
  'GROQ_API_KEY',
  'OPENROUTER_KEYS',
  'OPENROUTER_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
];

const prev = new Map(NAMES.map((name) => [name, process.env[name]]));

function clearAll() {
  for (const name of NAMES) delete process.env[name];
}

function restore() {
  for (const name of NAMES) {
    const value = prev.get(name);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

function fail(reason) {
  console.log(`credential fallback failed: ${reason}`);
  restore();
  process.exit(1);
}

clearAll();
process.env.GROQ_API_KEY = 'health-groq-fixture';
if (groqKeyPool() !== 'health-groq-fixture') fail('groq did not use GROQ_API_KEY');
process.env.GROQ_KEYS = 'agent-groq-fixture';
if (groqKeyPool() !== 'agent-groq-fixture') fail('GROQ_KEYS did not win');

delete process.env.OPENROUTER_KEYS;
process.env.OPENROUTER_API_KEY = 'health-or-fixture';
if (openRouterKeyPool() !== 'health-or-fixture') fail('openrouter did not use OPENROUTER_API_KEY');
process.env.OPENROUTER_KEYS = 'agent-or-fixture';
if (openRouterKeyPool() !== 'agent-or-fixture') fail('OPENROUTER_KEYS did not win');

delete process.env.FIREBASE_PROJECT_ID;
delete process.env.FIREBASE_CLIENT_EMAIL;
delete process.env.FIREBASE_PRIVATE_KEY;
delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
process.env.SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
  project_id: 'shelfaware-ee460',
  client_email: 'fixture@shelfaware-ee460.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\\nfixture-not-a-real-key\\n-----END PRIVATE KEY-----\\n',
});
const fromShelf = resolveFirebaseAdminFields();
if (!fromShelf || fromShelf.source !== 'SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON') {
  fail('firebase did not use SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON');
}
if (fromShelf.projectId !== 'shelfaware-ee460') fail('firebase project was not the shelf project id');

delete process.env.SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON;
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
  project_id: 'shelfaware-ee460',
  client_email: 'fixture@shelfaware-ee460.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\\nfixture-not-a-real-key\\n-----END PRIVATE KEY-----\\n',
});
const fromHealth = resolveFirebaseAdminFields();
if (!fromHealth || fromHealth.source !== 'FIREBASE_SERVICE_ACCOUNT_JSON') {
  fail('firebase did not fall back to FIREBASE_SERVICE_ACCOUNT_JSON');
}

process.env.FIREBASE_PROJECT_ID = 'shelfaware-ee460';
process.env.FIREBASE_CLIENT_EMAIL = 'fixture@shelfaware-ee460.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nfixture-not-a-real-key\\n-----END PRIVATE KEY-----\\n';
const fromSplit = resolveFirebaseAdminFields();
if (!fromSplit || fromSplit.source !== 'FIREBASE_PROJECT_ID') fail('split FIREBASE_* fields did not win');

restore();
console.log('credential fallback ok');
