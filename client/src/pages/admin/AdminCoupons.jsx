import React, { useState } from 'react';
import { Ticket, Plus, Trash2, CheckCircle2, Copy, Sparkles, Download } from 'lucide-react';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'WELCOME10', discountPercent: 10, minAmount: 1999, description: '10% discount on first luxury purchase', active: true, usageCount: 412 },
    { id: 2, code: 'LUXURY20', discountPercent: 20, minAmount: 4999, description: '20% discount on botanical hampers & brass art', active: true, usageCount: 184 },
    { id: 3, code: 'ORIVIDA15', discountPercent: 15, minAmount: 2999, description: '15% discount for VIP society members', active: true, usageCount: 290 },
    { id: 4, code: 'MONSOON50', discountPercent: 50, minAmount: 9999, description: 'Flat 50% discount on mega botanical orders', active: true, usageCount: 95 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercent: 10,
    minAmount: 1999,
    description: ''
  });

  const handleExportCouponsCSV = () => {
    const headers = ['ID', 'Coupon Code', 'Discount %', 'Min Cart Amount', 'Usage Count', 'Status'];
    const rows = coupons.map(c => [c.id, `"${c.code}"`, c.discountPercent, c.minAmount, c.usageCount, c.active ? 'Active' : 'Inactive']);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ORIVIDA_Coupons_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    const created = {
      id: Date.now(),
      code: newCoupon.code.toUpperCase().trim(),
      discountPercent: Number(newCoupon.discountPercent),
      minAmount: Number(newCoupon.minAmount),
      description: newCoupon.description || 'Promotional coupon discount',
      active: true,
      usageCount: 0
    };
    setCoupons([created, ...coupons]);
    setIsModalOpen(false);
    setNewCoupon({ code: '', discountPercent: 10, minAmount: 1999, description: '' });
  };

  const handleDeleteCoupon = (id) => {
    if (window.confirm('Deactivate and delete this coupon code?')) {
      setCoupons(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-8 p-6 sm:p-8 bg-[#FAF9F6] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Store Promo Codes Engine</span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-1">Coupon Codes Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCouponsCSV}
            className="bg-white hover:bg-gray-100 border border-gray-300 text-[#154734] px-5 py-3 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> EXPORT COUPONS (CSV)
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#154734] hover:bg-[#0F3526] text-white px-6 py-3 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" /> GENERATE NEW PROMO CODE
          </button>
        </div>
      </div>

      {/* Coupon Grid Scroll Container */}
      <div className="max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#154734]" />
                  <span className="font-mono font-extrabold text-lg text-[#154734] tracking-widest bg-[#E8F2EC] px-3 py-1 rounded-xl border border-[#154734]/30">
                    {c.code}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Syncing with Cart
                </span>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-900">{c.discountPercent}% Off Total Cart Value</p>
                <p className="text-xs text-slate-600 leading-relaxed font-body">{c.description}</p>
              </div>

              <div className="text-xs font-semibold text-slate-500 bg-gray-50 p-3 rounded-2xl border border-gray-100 flex justify-between">
                <span>Minimum Order: ₹{c.minAmount.toLocaleString('en-IN')}</span>
                <span>Used {c.usageCount} times</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(c.code);
                  alert(`Copied coupon code ${c.code} to clipboard!`);
                }}
                className="text-[#154734] font-bold hover:underline flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </button>

              <button
                onClick={() => handleDeleteCoupon(c.id)}
                className="text-rose-600 font-bold hover:underline"
              >
                Delete Code
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <h3 className="font-display font-extrabold text-xl text-slate-900">Create New Promo Code</h3>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Coupon Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE25"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734] font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Discount % *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="90"
                    value={newCoupon.discountPercent}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Min Cart Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newCoupon.minAmount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minAmount: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Offer Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 25% discount for exclusive plant buyers"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 rounded-full border border-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#154734] text-white font-bold hover:bg-[#0F3526]"
                >
                  Save & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
