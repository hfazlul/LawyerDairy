// lib/firestore.js
// Singleton Firebase Admin SDK init. Vercel serverless functions can be
// re-invoked on a warm container, so we must not call initializeApp() twice.
// firebase-admin is loaded only when a real database is needed, so a local
// dry run can inject an in-memory db without the package or any credentials.

import { createRequire } from 'node:module';
import { resolveFirebaseAdminFields } from './credentials.js';

const require = createRequire(import.meta.url);

let testDb = null;
let testExtras = null;

export function setFirestoreForTest(db, extras = null) {
  testDb = db;
  testExtras = extras;
}

function loadApp() {
  return require('firebase-admin/app');
}

function loadFirestore() {
  return require('firebase-admin/firestore');
}

function buildCredential() {
  const fields = resolveFirebaseAdminFields();
  if (!fields) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, ' +
      'FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY, or ' +
      'SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON / FIREBASE_SERVICE_ACCOUNT_JSON.'
    );
  }
  const { cert } = loadApp();
  return cert({
    projectId: fields.projectId,
    clientEmail: fields.clientEmail,
    privateKey: fields.privateKey,
  });
}

export function getDb() {
  if (testDb) return testDb;
  const { initializeApp, getApps } = loadApp();
  const { getFirestore } = loadFirestore();
  if (getApps().length === 0) {
    initializeApp({ credential: buildCredential() });
  }
  return getFirestore();
}

export const FieldValue = {
  serverTimestamp() {
    if (testExtras?.FieldValue) return testExtras.FieldValue.serverTimestamp();
    return loadFirestore().FieldValue.serverTimestamp();
  },
};

export const Timestamp = {
  now() {
    if (testExtras?.Timestamp) return testExtras.Timestamp.now();
    return loadFirestore().Timestamp.now();
  },
};
