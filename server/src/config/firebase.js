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

try {
  const serviceAccountFilePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(serverRootDir, 'orvida-33088-firebase-adminsdk-fbsvc-7a869ca29b.json');
  const isPlaceholderKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_FIREBASE_PRIVATE_KEY');

  if (fs.existsSync(serviceAccountFilePath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountFilePath, 'utf-8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log(`Firebase Admin SDK initialized with Service Account file: ${path.basename(serviceAccountFilePath)}`);
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
