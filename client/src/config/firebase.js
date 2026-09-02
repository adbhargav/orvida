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

// Firebase web config is public by design — it identifies the project, it
// does not authorise anything. Access is decided by Firebase security rules
// and, here, by the backend verifying the ID token against the service
// account for this same project.
const firebaseConfig = {
  apiKey: "AIzaSyBX5vCKEwyp-wfPZ5l6GwPxB3q7SIcd4oQ",
  authDomain: "orivida-490fb.firebaseapp.com",
  projectId: "orivida-490fb",
  storageBucket: "orivida-490fb.firebasestorage.app",
  messagingSenderId: "575142041700",
  appId: "1:575142041700:web:e240aba74ae60ed6302771"
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
