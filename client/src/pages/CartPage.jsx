import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    discountAmount,
    appliedPromo,
    promoError,
    applyPromo,
    removePromo,
    promoCode,
    setPromoCode,
    finalTotal
  } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="p-6 rounded-full bg-[#0A3324] border border-[#8A6A16] w-24 h-24 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-[#F0D585]" />
        </div>
        <h2 className="font-display font-extrabold text-3xl text-white">Your Luxury Basket is Empty</h2>
        <p className="text-xs text-[#F7F5EF]/70 max-w-md mx-auto leading-relaxed">
          Discover our curated botanical collections, hand-loomed planters, and heritage Bastar metal arts.
        </p>
        <Link
          to="/category/plants"
          className="inline-flex items-center gap-2 bg-gold-gradient text-[#0A3324] px-8 py-4 rounded-full font-bold text-xs tracking-widest shadow-xl hover:scale-105 transition"
        >
          <span>EXPLORE CATALOG</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-[#8A6A16]/30 pb-4">
        <span className="text-xs uppercase font-bold tracking-widest text-[#F0D585]">Review Basket</span>
        <h1 className="font-display font-extrabold text-3xl text-white">Shopping Basket & Privileges</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-[#0A3324] border border-[#8A6A16]/30 flex flex-col sm:flex-row gap-5 items-center justify-between shadow-md"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img src={item.image} alt={item.name} className="w-24 h-24 rounded-2xl object-cover border border-[#8A6A16]/40" />
                <div>
                  <h3 className="font-display font-semibold text-sm text-white">{item.name}</h3>
                  <p className="text-xs text-[#F0D585] mt-1">{item.variant}</p>
                  <p className="font-serif font-bold text-base text-gold-gradient mt-2">
                    ₹{item.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#8A6A16]/20">
                <div className="flex items-center border border-[#8A6A16]/40 rounded-full px-3 py-1 bg-[#0B3D2E]">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2 font-bold text-[#F0D585]"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-bold text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2 font-bold text-[#F0D585]"
                  >
                    +
                  </button>
                </div>

                <span className="font-serif font-bold text-lg text-white">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-400 transition"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Calculation Card */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0A3324] border-2 border-[#C9972B] shadow-2xl space-y-6">
          <h3 className="font-display font-bold text-lg text-gold-gradient border-b border-[#8A6A16]/30 pb-3">
            Order Summary
          </h3>

          {/* Promo Applicator */}
          <div>
            {appliedPromo ? (
              <div className="flex justify-between items-center bg-[#0B3D2E] text-[#F0D585] p-3 rounded-xl text-xs font-bold border border-[#F0D585]">
                <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> Code "{appliedPromo}" Applied</span>
                <button onClick={removePromo} className="text-white hover:underline text-[10px]">Remove</button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); applyPromo(promoCode); }} className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Promo Code (ORIVIDA10)"
                  className="bg-[#0B3D2E] border border-[#8A6A16]/40 rounded-full px-4 py-2.5 text-xs text-white placeholder-gray-400 flex-1 focus:outline-none focus:border-[#F0D585]"
                />
                <button type="submit" className="bg-gold-gradient text-[#0A3324] px-4 py-2.5 rounded-full text-xs font-bold">APPLY</button>
              </form>
            )}
            {promoError && <p className="text-[10px] text-red-400 mt-1">{promoError}</p>}
          </div>

          {/* Summary Breakdown */}
          <div className="space-y-2 text-xs text-[#F7F5EF]/80 pt-3 border-t border-[#8A6A16]/30">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#F0D585] font-bold">
                <span>Discount Privilege</span>
                <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>White-Glove Shipping</span>
              <span className="font-semibold text-white">{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
            </div>
            <div className="flex justify-between font-serif font-bold text-xl text-gold-gradient pt-3 border-t border-[#8A6A16]/40">
              <span>Total Payable</span>
              <span>₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-gold-gradient hover:bg-gold-gradient-hover text-[#0A3324] py-4 rounded-full font-bold text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition"
          >
            <span>PROCEED TO CHECKOUT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
