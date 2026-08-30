import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Firebase config comes from the environment so that each deployment target
 * (production, qa, local) points at its own Firebase project. There is
 * deliberately no fallback: a missing variable fails the app immediately
 * rather than silently connecting QA to the production database.
 *
 * See .env.example for the variables, and docs/ENVIRONMENTS.md for where
 * each one is set.
 */
const required = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`);

if (missing.length > 0) {
  throw new Error(
    `Firebase is not configured. Missing environment variables:\n  ${missing.join('\n  ')}\n\n` +
      `Locally: copy .env.example to .env and fill it in.\n` +
      `On Vercel: set these under Settings > Environment Variables for this environment.`
  );
}

const firebaseConfig = {
  ...required,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/** Environment this build targets. Defaults to production when unset. */
export const APP_ENV = import.meta.env.VITE_APP_ENV ?? 'production';

/** The Firebase project this build is talking to — shown in the QA banner. */
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
