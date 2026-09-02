import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseInitialized = false;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRootDir = path.resolve(__dirname, '../../');

/**
 * Finds the service-account JSON without hard-coding a project.
 *
 * The filename Firebase hands you carries the project id, so pinning one name
 * means a new project silently falls through to whatever comes next and the
 * server ends up verifying tokens against the wrong project. Any
 * *firebase-adminsdk*.json in the server root is picked up instead, and when
 * FIREBASE_PROJECT_ID names one, that one wins.
 */
const findServiceAccountFile = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) return process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  const candidates = fs
    .readdirSync(serverRootDir)
    .filter((name) => name.includes('firebase-adminsdk') && name.endsWith('.json'))
    .map((name) => path.join(serverRootDir, name));

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const wanted = process.env.FIREBASE_PROJECT_ID;
  const match = wanted && candidates.find((file) => path.basename(file).startsWith(`${wanted}-`));
  if (match) return match;

  console.warn(
    `Multiple Firebase service accounts found (${candidates
      .map((f) => path.basename(f))
      .join(', ')}). Set FIREBASE_SERVICE_ACCOUNT_PATH to choose one.`
  );
  return candidates[0];
};

try {
  const serviceAccountFilePath = findServiceAccountFile();
  const isPlaceholderKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_FIREBASE_PRIVATE_KEY');

  if (serviceAccountFilePath && fs.existsSync(serviceAccountFilePath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountFilePath, 'utf-8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log(`Firebase Admin SDK initialized for project "${serviceAccount.project_id}" (${path.basename(serviceAccountFilePath)})`);

    // The client mints tokens for whatever project its web config names. If
    // this credential belongs to a different one, every Google sign-in is
    // rejected with an opaque "Firebase ID token has incorrect audience" —
    // so say so plainly at boot rather than at 3am.
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== serviceAccount.project_id) {
      console.warn(
        `Firebase project mismatch: FIREBASE_PROJECT_ID is "${process.env.FIREBASE_PROJECT_ID}" but this ` +
          `service account is for "${serviceAccount.project_id}". Google Sign-In will fail unless the ` +
          `client's firebaseConfig also targets "${serviceAccount.project_id}".`
      );
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // Hosts like Render take a single-line env var far more gracefully than a
    // JSON blob with embedded newlines: base64-encode the service account file
    // and paste it as FIREBASE_SERVICE_ACCOUNT_BASE64.
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim(), 'base64').toString('utf-8');
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(decoded)),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized with base64 service account from environment.');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized with Service Account JSON string.');
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    !isPlaceholderKey
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized with environment credentials.');
  } else {
    console.warn('Firebase credentials pending in .env. Firebase Admin operating in mock verification mode.');
  }
} catch (error) {
  console.warn('Firebase initialization notice:', error.message);
}

export const isFirebaseReady = () => firebaseInitialized;

export const verifyFirebaseToken = async (idToken) => {
  if (!firebaseInitialized) {
    // Previously this returned a fixed placeholder identity, which meant every
    // Google sign-in resolved to the same account. Fail closed instead.
    throw new Error('Google Sign-In is unavailable: Firebase Admin credentials are not configured.');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    throw new Error('Invalid Firebase Auth Token');
  }
};

export default admin;
