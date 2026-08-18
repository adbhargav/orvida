import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDYqumiM7js51H5aoWRJXDDzlUY54iTBbE",
  authDomain: "orvida-33088.firebaseapp.com",
  projectId: "orvida-33088",
  storageBucket: "orvida-33088.firebasestorage.app",
  messagingSenderId: "598816105716",
  appId: "1:598816105716:web:446235f62d6f7a3ce7eaa1",
  measurementId: "G-0NQXY7GR32"
};

const app = initializeApp(firebaseConfig);

// The app's real session is our own JWT (see AuthContext) — Firebase is only
// a handshake for Google sign-in and password resets. Skip its default
// IndexedDB persistence: a wedged IndexedDB makes every auth call fail with
// "Database is closing/hidden", while localStorage (with fallbacks) does not.
export const auth = initializeAuth(app, {
  persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
export const googleProvider = new GoogleAuthProvider();

export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return {
      user: result.user,
      idToken
    };
  } catch (error) {
    console.error('Firebase Google Sign-In Error:', error);
    throw error;
  }
};

// --- Password reset (Firebase's built-in reset email) ---

export const sendResetEmail = (email) => sendPasswordResetEmail(auth, email);

export const verifyResetCode = (oobCode) => verifyPasswordResetCode(auth, oobCode);

// Confirms the reset with Firebase, then signs in with the new password to
// mint an ID token. The backend verifies that token before syncing the new
// password into its own store — proof the caller really completed the email link.
export const completePasswordReset = async (oobCode, email, newPassword) => {
  await confirmPasswordReset(auth, oobCode, newPassword);
  const cred = await signInWithEmailAndPassword(auth, email, newPassword);
  return cred.user.getIdToken();
};

// The app's session is our own JWT, not Firebase's — drop the Firebase session
// once the reset handshake is done.
export const signOutFirebase = () => signOut(auth).catch(() => {});

export default app;
