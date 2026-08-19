import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ArrowLeft, Minus, Plus, ShoppingBag, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import usePageMeta from '../hooks/usePageMeta';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function CartPage() {
  usePageMeta({ title: 'Your Cart | ORIVIDA', path: '/cart', robots: 'noindex, follow' });

  const navigate = useNavigate();
  const {
    cartItems, updateQuantity, removeFromCart, subtotal, freeShippingThreshold,
    discountAmount, appliedPromo, promoError, promoLoading, applyPromo, removePromo,
    promoCode, setPromoCode, totalItemsCount,
  } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] bg-canvas flex flex-col items-center justify-center text-center px-6 gap-5">
        <ShoppingBag className="w-11 h-11 text-ink-faint" strokeWidth={1} />
        <div className="space-y-1.5">
          <h1 className="type-display text-3xl text-ink">Your cart is empty</h1>
          <p className="text-sm text-ink-soft max-w-md">
            Explore our hand-nurtured botanicals, artisan planters and heritage craft.
          </p>
        </div>
        <Link
          to="/category/plants"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
        >
          Browse the collection <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="bg-canvas min-h-[60vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
        <header className="border-b border-line pb-6 mb-10 space-y-2">
          <span className="type-eyebrow text-emerald-default block">Your selection</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">
            Cart <span className="text-ink-faint tabular text-2xl">({totalItemsCount})</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Items */}
          <div className="lg:col-span-7 xl:col-span-8">
            <ul className="divide-y divide-line border-y border-line">
              {cartItems.map((item) => (
                <li key={item.id} className="py-6 flex gap-5">
                  <Link to={`/product/${item.slug}`} className="w-24 h-28 sm:w-28 sm:h-32 bg-emerald-subtle border border-line overflow-hidden shrink-0">
                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 space-y-1">
                        <Link to={`/product/${item.slug}`} className="type-heading text-base text-ink hover:text-emerald-default transition-colors line-clamp-2">
                          {item.name}
                        </Link>
                        {item.variant && item.variant !== 'Standard' && (
                          <p className="text-sm text-ink-soft">{item.variant}</p>
                        )}
                        <p className="text-sm text-ink-faint tabular">{formatPrice(item.price)} each</p>
                      </div>

                      <span className="type-price text-lg text-ink shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4">
                      <div className="flex items-center border border-line">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-2 text-ink-soft hover:text-emerald-default transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-sm text-ink tabular min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-2 text-ink-soft hover:text-emerald-default transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              to="/category/plants"
              className="inline-flex items-center gap-2 mt-8 text-sm text-ink-soft hover:text-emerald-default transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Continue shopping
            </Link>
          </div>

          {/* Summary */}
          <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28">
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <h2 className="type-heading text-xl text-ink">Order summary</h2>

              {appliedPromo ? (
                <div className="flex justify-between items-center text-sm px-4 py-3 bg-emerald-light">
                  <span className="text-emerald-deep">Code {appliedPromo} applied</span>
                  <button onClick={removePromo} className="text-ink-soft hover:text-ink text-xs transition-colors">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <form onSubmit={(e) => { e.preventDefault(); applyPromo(promoCode); }} className="flex gap-2">
                    <label htmlFor="promo" className="sr-only">Discount code</label>
                    <input
                      id="promo"
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
                  {promoError && <p className="text-xs text-rose-600">{promoError}</p>}
                </div>
              )}

              <dl className="space-y-2.5 text-sm pt-2 border-t border-line">
                <div className="flex justify-between pt-4">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="text-ink tabular">{formatPrice(subtotal)}</dd>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Discount</dt>
                    <dd className="text-emerald-default tabular">−{formatPrice(discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-4 border-t border-line">
                  <dt className="type-heading text-lg text-ink">Total</dt>
                  <dd className="type-price text-xl text-ink">{formatPrice(Math.max(0, Math.round(subtotal - discountAmount)))}</dd>
                </div>
                <p className="text-xs text-ink-faint">Shipping calculated at checkout</p>
              </dl>

              {remainingForFreeShipping > 0 && (
                <p className="text-sm text-ink-soft">
                  Add <span className="text-ink tabular">{formatPrice(remainingForFreeShipping)}</span> more for
                  complimentary shipping.
                </p>
              )}

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors"
              >
                Proceed to checkout <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <p className="text-xs text-ink-faint text-center">
                Taxes included · Secure Razorpay checkout
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
