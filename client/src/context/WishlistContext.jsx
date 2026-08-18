import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

    return parsed.filter((id) => Number.isFinite(Number(id)));
  } catch {
    return [];
  }
};

export const WishlistProvider = ({ children }) => {
  // Starts empty — the previous build pre-liked products 1 and 3 for every
  // new visitor, so the header always showed a count of 2.
  const [wishlistIds, setWishlistIds] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  const toggleWishlist = useCallback((productId) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const isInWishlist = useCallback((productId) => wishlistIds.includes(productId), [wishlistIds]);

  return (
    <WishlistContext.Provider
      value={{ wishlistIds, toggleWishlist, isInWishlist, count: wishlistIds.length }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
