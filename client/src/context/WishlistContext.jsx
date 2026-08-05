import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('orvida_wishlist');
      return saved ? JSON.parse(saved) : [1, 3];
    } catch {
      return [1, 3];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('orvida_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {
      console.error('Failed to save wishlist', e);
    }
  }, [wishlistIds]);

  const toggleWishlist = (productId) => {
    setWishlistIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const isInWishlist = (productId) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isInWishlist, count: wishlistIds.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
