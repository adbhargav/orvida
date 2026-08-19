import React, { useEffect } from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, Minus, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    freeShippingThreshold,
    discountAmount,
    appliedPromo,
    promoError,
    promoLoading,
    applyPromo,
    removePromo,
    promoCode,
    setPromoCode,
    totalItemsCount,
  } = useCart();

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && setIsCartOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setIsCartOpen]);

  if (!isCartOpen) return null;

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fadeIn"
      />

      <div className="absolute inset-y-0 right-0 w-screen max-w-md bg-canvas flex flex-col border-l border-line animate-riseIn">
        {/* Header */}
        <div className="flex justify-between items-center px-6 h-[72px] border-b border-line shrink-0">
          <h2 className="type-heading text-lg text-ink">
            Cart <span className="text-ink-faint tabular">({totalItemsCount})</span>
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 -mr-2 text-ink-soft hover:text-ink transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 space-y-4">
            <ShoppingBag className="w-10 h-10 text-ink-faint" strokeWidth={1} />
            <div className="space-y-1.5">
              <p className="type-heading text-xl text-ink">Your cart is empty</p>
              <p className="text-sm text-ink-soft">Explore our hand-nurtured botanicals and heirloom arts.</p>
            </div>
            <button
              onClick={() => { setIsCartOpen(false); navigate('/category/plants'); }}
              className="px-7 py-3 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
            >
              Browse the collection
            </button>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            <div className="px-6 py-4 border-b border-line bg-white shrink-0">
              <p className="text-sm text-ink-soft mb-2">
                {remainingForFreeShipping > 0 ? (
                  <>Add <span className="text-ink tabular">{formatPrice(remainingForFreeShipping)}</span> more for complimentary shipping</>
                ) : (
                  <span className="text-emerald-default">Complimentary shipping unlocked</span>
                )}
              </p>
              <div className="w-full h-px bg-line">
                <div
                  className="h-px bg-emerald-default transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-24 bg-emerald-subtle border border-line overflow-hidden shrink-0">
                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-ink line-clamp-2">{item.name}</p>
                        {item.variant && item.variant !== 'Standard' && (
                          <p className="text-xs text-ink-faint mt-0.5">{item.variant}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 -mr-1 text-ink-faint hover:text-rose-600 transition-colors shrink-0"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-auto pt-3">
                      <div className="flex items-center border border-line">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1.5 text-ink-soft hover:text-emerald-default transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-sm text-ink tabular min-w-[1.5rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1.5 text-ink-soft hover:text-emerald-default transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="type-price text-base text-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="px-6 py-5 border-t border-line bg-white space-y-4 shrink-0">
              {appliedPromo ? (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-default">Code {appliedPromo} applied</span>
                  <button onClick={removePromo} className="text-ink-faint hover:text-ink transition-colors text-xs">
                    Remove
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); applyPromo(promoCode); }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Discount code"
                    className="flex-1 px-3.5 py-2.5 border border-line bg-white text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-emerald-default transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-5 py-2.5 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.14em] disabled:opacity-40 transition-colors"
                  >
                    {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </button>
                </form>
              )}
              {promoError && <p className="text-xs text-rose-600 -mt-2">{promoError}</p>}

              <dl className="space-y-2 text-sm pt-1 border-t border-line">
                <div className="flex justify-between pt-3">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="text-ink tabular">{formatPrice(subtotal)}</dd>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Discount</dt>
                    <dd className="text-emerald-default tabular">−{formatPrice(discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-line">
                  <dt className="type-heading text-base text-ink">Total</dt>
                  <dd className="type-price text-lg text-ink">{formatPrice(Math.max(0, Math.round(subtotal - discountAmount)))}</dd>
                </div>
                <p className="text-xs text-ink-faint">Shipping calculated at checkout</p>
              </dl>

              <button
                onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
                className="w-full py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors"
              >
                Proceed to checkout <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <p className="text-xs text-ink-faint text-center">Taxes included · Secure Razorpay checkout</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
