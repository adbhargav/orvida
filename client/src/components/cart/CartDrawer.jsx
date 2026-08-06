import React from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, Sparkles, Tag, Check, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
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
    finalTotal
  } = useCart();

  if (!isCartOpen) return null;

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F6] text-slate-900 shadow-2xl flex flex-col justify-between border-l border-gray-200 relative">
          
          {/* Cart Header */}
          <div className="p-5 bg-[#154734] text-white flex justify-between items-center border-b border-[#0F3526]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#F0D585]" />
              <h2 className="font-display font-bold text-lg text-white">
                Your Luxury Basket ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-white/80 hover:text-white transition rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#0F3526] text-white px-5 py-3 border-b border-[#0B281E]">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              {amountNeededForFreeShipping > 0 ? (
                <span>Add <strong className="text-[#F0D585]">₹{amountNeededForFreeShipping.toLocaleString('en-IN')}</strong> more for FREE Express Shipping</span>
              ) : (
                <span className="text-[#F0D585] font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Congratulations! You unlocked FREE Luxury Shipping
                </span>
              )}
              <span className="text-[10px] text-[#F0D585]">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#0B281E] rounded-full overflow-hidden border border-[#154734]">
              <div
                className="h-full bg-[#F0D585] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 px-4">
                <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="font-display font-bold text-lg text-slate-800 mb-2">Your basket is currently empty</h3>
                <p className="text-xs text-slate-500 mb-6">Explore our hand-nurtured botanicals and heirloom arts.</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-[#154734] hover:bg-[#0F3526] text-white px-6 py-3 rounded-full font-bold text-xs tracking-wider shadow-md hover:scale-105 transition"
                >
                  DISCOVER BOTANICALS
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-white rounded-2xl border border-gray-200 shadow-sm relative group"
                >
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-display font-bold text-xs text-slate-900 line-clamp-1 pr-4">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-[#154734] font-semibold mt-0.5">{item.variant}</p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border border-gray-300 rounded-full px-2 py-0.5 bg-gray-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 text-xs font-bold text-slate-700 hover:text-[#154734]"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 text-xs font-bold text-slate-700 hover:text-[#154734]"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-serif font-bold text-sm text-[#154734]">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer Summary */}
          {cartItems.length > 0 && (
            <div className="p-5 bg-[#F0F5F2] border-t border-gray-200 space-y-3">
              
              {/* Promo Code Form */}
              <div>
                {appliedPromo ? (
                  <div className="flex justify-between items-center bg-[#154734] text-white p-2.5 rounded-xl text-xs font-bold border border-[#154734]">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-[#F0D585]" /> Promo Code "{appliedPromo}" Applied!
                    </span>
                    <button onClick={removePromo} className="text-white hover:underline text-[10px]">Remove</button>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); applyPromo(promoCode); }} className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo Code (Try ORIVIDA10)"
                      className="bg-white border border-gray-300 rounded-full px-3 py-2 text-xs flex-1 focus:outline-none focus:border-[#154734]"
                    />
                    <button
                      type="submit"
                      className="bg-[#154734] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#0F3526] transition"
                    >
                      APPLY
                    </button>
                  </form>
                )}
                {promoError && <p className="text-[10px] text-red-600 mt-1 font-semibold">{promoError}</p>}
              </div>

              {/* Order Calculations */}
              <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#154734] font-bold">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Express Shipping</span>
                  <span className="font-semibold">{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
                </div>
                <div className="flex justify-between font-serif font-bold text-base text-[#154734] pt-2 border-t border-gray-300">
                  <span>Total Amount</span>
                  <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="w-full bg-[#154734] hover:bg-[#0F3526] text-white py-3.5 rounded-full font-bold text-xs tracking-widest flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition duration-300"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
