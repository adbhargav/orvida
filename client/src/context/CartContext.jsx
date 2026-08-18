import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';

const CartContext = createContext();

const STORAGE_KEY = 'orvida_cart';
const FREE_SHIPPING_THRESHOLD = 1999;
const STANDARD_SHIPPING_FEE = 250;

const readStoredCart = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];

    // Drop entries written by the previous build. Those rows carried no
    // variantId, which checkout now needs to price a line server-side, and
    // they include the placeholder item that used to be seeded into every
    // new visitor's cart.
    return parsed.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        'variantId' in item &&
        Number.isFinite(Number(item.productId)) &&
        Number.isFinite(Number(item.price))
    );
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  // Starts empty. The previous build seeded a Monstera into every new
  // visitor's cart, so first-time shoppers saw "1" in the header.
  const [cartItems, setCartItems] = useState(readStoredCart);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore quota/private-mode failures
    }
  }, [cartItems]);

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  const totalItemsCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const addToCart = useCallback((product, selectedVariant = null, quantity = 1) => {
    setCartItems((prevItems) => {
      const variantId = selectedVariant?.id ?? null;
      const variantLabel = selectedVariant?.value || 'Standard';
      const basePrice = product.effectivePrice ?? product.discountPrice ?? product.price;
      const unitPrice = Number(basePrice) + Number(selectedVariant?.priceDelta || 0);

      const existingIndex = prevItems.findIndex(
        (item) => item.productId === product.id && item.variantId === variantId
      );

      if (existingIndex > -1) {
        return prevItems.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...prevItems,
        {
          id: `cart-${product.id}-${variantId ?? 'base'}`,
          productId: product.id,
          variantId,
          name: product.name,
          slug: product.slug,
          price: unitPrice,
          image: product.images?.[0]?.url || '',
          variant: variantLabel,
          quantity,
        },
      ];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback(
    (cartItemId, newQty) => {
      if (newQty <= 0) {
        removeFromCart(cartItemId);
        return;
      }
      setCartItems((prev) =>
        prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
      );
    },
    [removeFromCart]
  );

  const removePromo = useCallback(() => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoCode('');
    setPromoError('');
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    removePromo();
  }, [removePromo]);

  /**
   * Validates a code against the coupons table rather than a hard-coded list,
   * so codes created in the admin panel actually work. The discount shown here
   * is indicative — checkout re-derives it on the server.
   */
  const applyPromo = useCallback(
    async (code) => {
      const cleanCode = (code || '').trim();
      setPromoError('');
      if (!cleanCode) return;

      setPromoLoading(true);
      try {
        const res = await api.coupons.validate(cleanCode.toUpperCase(), subtotal);
        setAppliedPromo(res.coupon.code);
        setDiscountAmount(Number(res.coupon.discountAmount) || 0);
      } catch (err) {
        setAppliedPromo(null);
        setDiscountAmount(0);
        setPromoError(err.message || 'That coupon code could not be applied.');
      } finally {
        setPromoLoading(false);
      }
    },
    [subtotal]
  );

  // Keep a percentage discount honest when the cart contents change.
  useEffect(() => {
    if (appliedPromo && discountAmount > subtotal) {
      setDiscountAmount(subtotal);
    }
  }, [subtotal, appliedPromo, discountAmount]);

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = Math.max(0, Math.round(subtotal - discountAmount + shippingFee));

  // The minimal payload the server needs to re-price the cart itself.
  const getPricingPayload = useCallback(
    () => cartItems.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        shippingFee,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        discountAmount,
        appliedPromo,
        promoError,
        promoLoading,
        applyPromo,
        removePromo,
        promoCode,
        setPromoCode,
        finalTotal,
        totalItemsCount,
        getPricingPayload,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
