import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldCheck, CreditCard, Truck, Calendar, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, finalTotal, clearCart, subtotal, shippingFee, discountAmount } = useCart();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Delivery Slot, 3: Payment
  
  // Shipping Form State
  const [formData, setFormData] = useState({
    fullName: 'Princess Radhika',
    email: 'radhika@orvida-luxury.com',
    phone: '+91 98765 43210',
    address: 'Suite 402, Royal Palms Residency, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    deliverySlot: 'Morning (9 AM - 1 PM)',
    paymentMethod: 'razorpay'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    const orderId = `ORI-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderDetails = {
      orderId,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      items: cartItems,
      total: finalTotal,
      shippingAddress: formData
    };
    localStorage.setItem('orvida_last_order', JSON.stringify(orderDetails));
    clearCart();
    navigate(`/orders/${orderId}`);
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4 bg-[#FAF9F6]">
        <h2 className="font-display font-bold text-2xl text-slate-900">No items to checkout</h2>
        <button onClick={() => navigate('/category/plants')} className="bg-[#154734] text-white px-6 py-3 rounded-full font-bold text-xs hover:bg-[#0F3526]">
          RETURN TO CATALOG
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#FAF9F6]">
      
      {/* Progress Indicator */}
      <div className="max-w-xl mx-auto flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-0" />
        
        {[
          { num: 1, label: 'Shipping' },
          { num: 2, label: 'Delivery Slot' },
          { num: 3, label: 'Payment' }
        ].map((s) => (
          <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5">
            <div
              className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition ${
                step >= s.num
                  ? 'bg-[#154734] text-white ring-4 ring-[#154734]/20 shadow-md'
                  : 'bg-white text-slate-400 border border-gray-300'
              }`}
            >
              {step > s.num ? <Check className="w-5 h-5" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? 'text-[#154734]' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Multi-Step Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* STEP 1: SHIPPING ADDRESS */}
          {step === 1 && (
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
              <h2 className="font-display font-bold text-xl text-slate-900">1. Shipping Address & Contact</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#154734]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#154734]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#154734]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#154734]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Street Address / Penthouse</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#154734]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#154734]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#154734]"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-[#154734] hover:bg-[#0F3526] text-white py-3.5 rounded-full font-bold text-xs tracking-widest mt-4 shadow-md transition"
              >
                PROCEED TO DELIVERY SLOT
              </button>
            </div>
          )}

          {/* STEP 2: DELIVERY SLOT */}
          {step === 2 && (
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
              <h2 className="font-display font-bold text-xl text-slate-900">2. Select White-Glove Delivery Slot</h2>
              <p className="text-xs text-slate-500">Choose your preferred temperature-controlled dispatch window.</p>

              <div className="space-y-3">
                {[
                  { slot: 'Morning (9 AM - 1 PM)', desc: 'Ideal for weekend plant setup & unboxing.' },
                  { slot: 'Evening (4 PM - 8 PM)', desc: 'Pre-scheduled delivery for office & home.' },
                  { slot: 'Express Same-Day (Bengaluru Only)', desc: 'Hand-delivered in luxury wooden container.' }
                ].map((item) => (
                  <label
                    key={item.slot}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                      formData.deliverySlot === item.slot
                        ? 'bg-[#F0F5F2] border-[#154734] shadow-sm'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliverySlot"
                      value={item.slot}
                      checked={formData.deliverySlot === item.slot}
                      onChange={handleInputChange}
                      className="accent-[#154734]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.slot}</h4>
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-full border border-gray-300 text-xs font-bold text-slate-700 hover:bg-gray-50"
                >
                  BACK
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-[#154734] hover:bg-[#0F3526] text-white py-3.5 rounded-full font-bold text-xs tracking-widest shadow-md transition"
                >
                  PROCEED TO PAYMENT
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === 3 && (
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
              <h2 className="font-display font-bold text-xl text-slate-900">3. Payment Gateway</h2>

              <div className="space-y-3">
                {[
                  { id: 'razorpay', label: 'Razorpay / UPI / NetBanking / Cards', desc: 'Secure 256-bit instant checkout' },
                  { id: 'cod', label: 'Cash / Card on Delivery', desc: 'Available for orders up to ₹10,000' }
                ].map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                      formData.paymentMethod === pm.id
                        ? 'bg-[#F0F5F2] border-[#154734] shadow-sm'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={pm.id}
                      checked={formData.paymentMethod === pm.id}
                      onChange={handleInputChange}
                      className="accent-[#154734]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{pm.label}</h4>
                      <p className="text-[10px] text-slate-500">{pm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <form onSubmit={handlePlaceOrder} className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-[#154734] hover:bg-[#0F3526] text-white py-4 rounded-full font-extrabold text-sm tracking-widest flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition duration-300"
                >
                  <Lock className="w-4 h-4" />
                  <span>AUTHORIZE & PAY ₹{finalTotal.toLocaleString('en-IN')}</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right Column: Order Review Sidebar */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-gray-200 shadow-md space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900 border-b border-gray-100 pb-3">
            Order Review ({cartItems.length} items)
          </h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 text-xs">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                  <p className="text-[10px] text-slate-500">Qty: {item.quantity} · {item.variant}</p>
                </div>
                <span className="font-serif font-bold text-[#154734]">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-gray-100">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-[#154734] font-bold"><span>Discount Privilege</span><span>-₹{discountAmount}</span></div>}
            <div className="flex justify-between"><span>Express Transport</span><span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span></div>
            <div className="flex justify-between font-serif font-bold text-lg text-[#154734] pt-2 border-t border-gray-200">
              <span>Total Amount</span>
              <span>₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
