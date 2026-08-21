import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

const STORAGE_KEY = 'orvida_wishlist';
const MIGRATION_KEY = 'orvida_wishlist_migrated';

// The previous build pre-liked products 1 and 3 for every visitor. Anyone who
// used that build still carries the pair in localStorage, so clear it once —
// guarded by a flag, otherwise a genuine later save of those two would keep
// getting wiped.
const SEEDED_DEFAULT = [1, 3];

const readStored = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];

    if (!localStorage.getItem(MIGRATION_KEY)) {
      localStorage.setItem(MIGRATION_KEY, '1');
      const isUntouchedSeed =
        parsed.length === SEEDED_DEFAULT.length &&
        SEEDED_DEFAULT.every((id) => parsed.includes(id));
      if (isUntouchedSeed) return [];
    }

    // Ids arrive as numbers from the API but can come back from JSON as
    // strings; every comparison here is by number, so normalise on the way in.
    return [...new Set(parsed.map(Number).filter(Number.isInteger))];
  } catch {
    return [];
  }
};

const writeStored = (ids) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore quota / private-mode failures
  }
};

/**
 * Saved products, kept on the visitor's account once they sign in.
 *
 * A guest's list lives in localStorage. On sign-in it is merged into the
 * account rather than replacing it, so a list built before logging in
 * survives, and a second device adds to the list instead of overwriting it.
 * Every write is applied optimistically and rolled back if the server
 * refuses, so the heart never lies about what was saved.
 */
export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const isSignedIn = Boolean(user?.token);

  const [wishlistIds, setWishlistIds] = useState(readStored);
  const [loading, setLoading] = useState(false);
  const mergedFor = useRef(null);

  // A guest's list is the localStorage copy; a signed-in user's lives on the
  // server, so it must not be mirrored back to this device.
  useEffect(() => {
    if (!isSignedIn) writeStored(wishlistIds);
  }, [wishlistIds, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      mergedFor.current = null;
      return undefined;
    }
    // Merge once per signed-in user, not on every render of the provider.
    if (mergedFor.current === user.id) return undefined;
    mergedFor.current = user.id;

    let cancelled = false;
    let settled = false;
    setLoading(true);
    const pending = readStored();

    api.wishlist
      .merge(pending)
      .then((res) => {
        settled = true;
        if (cancelled) return;
        setWishlistIds(res.productIds.map(Number));
        // The account now holds them; a stale local copy would resurrect
        // removals on the next sign-out.
        writeStored([]);
      })
      .catch(() => {
        settled = true;
        // Offline or a rejected token: keep showing the local list rather
        // than blanking a wishlist the visitor can see.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      // React's development double-mount tears this down mid-flight, and the
      // once-per-user guard would then block the retry — leaving the account
      // merged but the local copy never cleared. Merging is idempotent, so
      // release the guard and let the remount redo it.
      if (!settled) mergedFor.current = null;
    };
  }, [isSignedIn, user?.id]);

  const toggleWishlist = useCallback(
    (rawProductId) => {
      const productId = Number(rawProductId);
      if (!Number.isInteger(productId)) return;

      const wasSaved = wishlistIds.includes(productId);
      const next = wasSaved
        ? wishlistIds.filter((id) => id !== productId)
        : [...wishlistIds, productId];

      setWishlistIds(next);
      if (!isSignedIn) return;

      // Put the previous state back if the server disagrees.
      api.wishlist.toggle(productId).catch(() => {
        setWishlistIds((current) =>
          wasSaved
            ? [...new Set([...current, productId])]
            : current.filter((id) => id !== productId)
        );
      });
    },
    [wishlistIds, isSignedIn]
  );

  const isInWishlist = useCallback(
    (productId) => wishlistIds.includes(Number(productId)),
    [wishlistIds]
  );

  return (
    <WishlistContext.Provider
      value={{ wishlistIds, toggleWishlist, isInWishlist, count: wishlistIds.length, loading }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
