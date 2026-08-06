import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('orvida_cart');
      return saved ? JSON.parse(saved) : [
        {
          id: 'cart-1',
          productId: 1,
          name: 'Royal Monstera Deliciosa (Variegated Alba)',
          price: 3999,
          image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=400&q=80',
          variant: 'Medium (18-22 inches) / Emerald & Gold Brass Vessel',
          quantity: 1
        }
      ];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('orvida_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  const addToCart = (product, selectedVariant = null, quantity = 1) => {
    setCartItems(prevItems => {
      const variantText = selectedVariant ? `${selectedVariant.value}` : 'Standard';
      const itemPrice = product.discountPrice || product.price;
      const finalPrice = itemPrice + (selectedVariant?.priceDelta || 0);
      const existingIndex = prevItems.findIndex(
        item => item.productId === product.id && item.variant === variantText
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prevItems,
          {
            id: `cart-${Date.now()}-${Math.random()}`,
            productId: product.id,
            name: product.name,
            price: finalPrice,
            image: product.images[0]?.url || '',
            variant: variantText,
            quantity: quantity,
            slug: product.slug
          }
        ];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity: newQty } : item));
  };

  const removeFromCart = (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedPromo(null);
    setDiscountAmount(0);
  };

  const applyPromo = (code) => {
    setPromoError('');
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();
    
    if (cleanCode === 'WELCOME10' || cleanCode === 'ORIVIDA10') {
      setAppliedPromo(cleanCode);
      setDiscountAmount(subtotal * 0.10);
    } else if (cleanCode === 'ORIVIDA15') {
      if (subtotal >= 2999) {
        setAppliedPromo('ORIVIDA15');
        setDiscountAmount(subtotal * 0.15);
      } else {
        setPromoError('Minimum order value of ₹2,999 required for ORIVIDA15');
      }
    } else if (cleanCode === 'LUXURY20') {
      if (subtotal >= 4999) {
        setAppliedPromo('LUXURY20');
        setDiscountAmount(subtotal * 0.20);
      } else {
        setPromoError('Minimum order value of ₹4,999 required for LUXURY20');
      }
    } else if (cleanCode === 'MONSOON50') {
      if (subtotal >= 9999) {
        setAppliedPromo('MONSOON50');
        setDiscountAmount(subtotal * 0.50);
      } else {
        setPromoError('Minimum order value of ₹9,999 required for MONSOON50');
      }
    } else if (cleanCode === 'LUXURY2000') {
      if (subtotal >= 5000) {
        setAppliedPromo('LUXURY2000');
        setDiscountAmount(2000);
      } else {
        setPromoError('Minimum order value of ₹5,000 required for LUXURY2000');
      }
    } else {
      setPromoError('Invalid coupon code. Try WELCOME10, ORIVIDA15, or LUXURY20');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoCode('');
    setPromoError('');
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const freeShippingThreshold = 1999;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 250;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      subtotal,
      shippingFee,
      freeShippingThreshold,
      discountAmount,
      appliedPromo,
      promoError,
      applyPromo,
      removePromo,
      promoCode,
      setPromoCode,
      finalTotal,
      totalItemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
