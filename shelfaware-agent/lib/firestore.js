// lib/firestore.js
// Singleton Firebase Admin SDK init. Vercel serverless functions can be
// re-invoked on a warm container, so we must not call initializeApp() twice.

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

function buildCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel env vars store literal "\n" — must be converted back to real newlines.
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, ' +
      'FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in the environment.'
    );
  }

  return cert({ projectId, clientEmail, privateKey });
}

export function getDb() {
  if (getApps().length === 0) {
    initializeApp({ credential: buildCredential() });
  }
  return getFirestore();
}

export { FieldValue, Timestamp };
