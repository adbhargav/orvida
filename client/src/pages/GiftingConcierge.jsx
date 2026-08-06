import React, { useState } from 'react';
import { Gift, Sparkles, Send, CheckCircle2, Award, Heart } from 'lucide-react';

export default function GiftingConcierge() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    occasion: 'Corporate VIP Gifting',
    quantity: '25 - 50 Hampers',
    budgetPerHamper: '₹5,000 - ₹10,000',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 bg-[#FAF9F6]">
      
      {/* Hero Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F2EC] border border-[#154734]/30 shadow-sm">
          <Sparkles className="w-4 h-4 text-[#154734]" />
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">
            Private Concierge Service
          </span>
        </div>

        <h1 className="font-serif font-extrabold text-4xl sm:text-5xl text-slate-900">
          Bespoke Botanical & Artisan <br />
          <span className="text-[#154734] italic font-serif">Gifting Solutions</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body">
          Whether you are curating executive Diwali hampers, VIP client appreciation gifts, or bespoke wedding favors — our master concierge designs custom brass-trimmed botanical trunks with hand-embossed plaques.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-gray-200 shadow-md space-y-6">
          {submitted ? (
            <div className="text-center py-12 space-y-4 animate-fadeIn">
              <div className="p-4 rounded-full bg-[#F0F5F2] border border-[#154734] w-20 h-20 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-[#154734]" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-slate-900">Proposal Request Received</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Our Senior Botanical Gifting Director will review your requirements and reach out via phone/email within 4 business hours with custom mood boards.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="bg-[#154734] text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#0F3526]"
              >
                SUBMIT ANOTHER ENQUIRY
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-display font-bold text-lg text-[#154734]">Request a Customized Proposal</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Vikramaditya Singhania"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-[#154734]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Company / Household</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Apex Luxury Holdings"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-[#154734]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="concierge@company.com"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-[#154734]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-[#154734]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Gifting Occasion</label>
                  <select
                    value={formData.occasion}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#154734]"
                  >
                    <option value="Corporate VIP Gifting">Corporate VIP Gifting</option>
                    <option value="Luxury Wedding Favors">Luxury Wedding Favors</option>
                    <option value="Festive Diwali Hampers">Festive Diwali Hampers</option>
                    <option value="Real Estate Milestone Gift">Real Estate Milestone Gift</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Estimated Quantity</label>
                  <select
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#154734]"
                  >
                    <option value="10 - 25 Hampers">10 - 25 Hampers</option>
                    <option value="25 - 50 Hampers">25 - 50 Hampers</option>
                    <option value="50 - 200 Hampers">50 - 200 Hampers</option>
                    <option value="200+ Bulk Order">200+ Bulk Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Custom Branding & Notes</label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Mention custom logo engraving requirements, plant preferences (e.g. low maintenance Sansevieria vs brass bell metal votives), or delivery timelines..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-[#154734]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#154734] hover:bg-[#0F3526] text-white py-4 rounded-full font-bold text-xs tracking-widest flex items-center justify-center gap-2 shadow-md hover:scale-105 transition"
              >
                <Send className="w-4 h-4" />
                <span>SUBMIT CONCIERGE REQUEST</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Visual Trunk Highlight */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-md aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80"
              alt="Luxury Hamper Trunk"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3 text-xs text-slate-600">
            <h4 className="font-display font-bold text-sm text-[#154734] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#154734]" /> The ORIVIDA Gifting Promise
            </h4>
            <p className="leading-relaxed">
              Every hamper features hand-selected live flora, certified bell metal keepsakes, organic botanical serums, and custom handwritten gold-ink gift cards. Delivered in temperature-controlled vehicles.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
