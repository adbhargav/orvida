import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { signInWithGooglePopup } from '../config/firebase';

const AuthContext = createContext();

const STORAGE_KEY = 'orvida_user';

// Shapes the server's user row into the form the UI reads, and keeps the JWT
// alongside it so api.js can attach it to authenticated requests.
const toSessionUser = (user, token) => ({
  ...user,
  token,
  isAdmin: Boolean(user.is_admin ?? user.isAdmin),
  photoURL: user.photo_url || user.photoURL || null,
  memberSince: user.member_since || user.memberSince || null,
});

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const persist = useCallback((sessionUser) => {
    setUser(sessionUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    } catch {
      // Storage may be unavailable in private browsing; the session still
      // works for this tab.
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('orvida_admin_auth');
    } catch {
      // ignore
    }
  }, []);

  // Revalidate the stored token on boot so a revoked or expired session does
  // not linger in the UI.
  useEffect(() => {
    const stored = readStoredUser();
    if (!stored?.token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.auth.getProfile();
        if (!cancelled && res.success && res.user) {
          persist(toSessionUser(res.user, stored.token));
        }
      } catch (err) {
        // 401/403 means the token is no longer valid — sign out rather than
        // leaving a stale identity on screen. Network blips are left alone.
        if (!cancelled && (err.status === 401 || err.status === 403)) {
          logout();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [persist, logout]);

  const loginWithEmail = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(email, password);
      const sessionUser = toSessionUser(res.user, res.token);
      persist(sessionUser);
      setIsAuthModalOpen(false);
      return sessionUser;
    } catch (err) {
      // A failed sign-in must stay failed. The previous build fell back to a
      // fabricated local account, which let any password through.
      setError(err.message || 'Sign in failed. Please check your details.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.signup({ name, email, password });
      const sessionUser = toSessionUser(res.user, res.token);
      persist(sessionUser);
      setIsAuthModalOpen(false);
      return sessionUser;
    } catch (err) {
      setError(err.message || 'We could not create your account.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const { idToken, user: firebaseUser } = await signInWithGooglePopup();

      // The backend verifies the Firebase ID token and issues our own JWT.
      // Without that exchange there is no token, so cart, orders and account
      // pages would all silently fail.
      const res = await api.auth.googleLogin(idToken, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      });

      const sessionUser = toSessionUser(res.user, res.token);
      persist(sessionUser);
      setIsAuthModalOpen(false);
      return sessionUser;
    } catch (err) {
      const message =
        err?.code === 'auth/popup-closed-by-user'
          ? 'Google sign-in was cancelled.'
          : err.message || 'Google sign-in failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (details) => {
    const res = await api.auth.updateProfile(details);
    const sessionUser = toSessionUser(res.user, user?.token);
    persist(sessionUser);
    return sessionUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user?.token),
        isAdmin: Boolean(user?.isAdmin),
        isAuthModalOpen,
        setIsAuthModalOpen,
        loading,
        error,
        setError,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
