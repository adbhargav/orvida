import React, { useState } from 'react';
import { Tag, Sparkles, Plus, Trash2, CheckCircle2, Clock, Download } from 'lucide-react';

export default function AdminOffers() {
  const [offers, setOffers] = useState([
    { id: 1, title: 'Any 4 Plants at ₹999/-', badge: 'DEAL OF THE MONTH', category: 'Plants', discount: '40% OFF', active: true },
    { id: 2, title: 'Up to 50% Off Extra 10% Above ₹1999/-', badge: 'MONSOON SPECIAL', category: 'All Catalog', discount: '50% + 10% OFF', active: true },
    { id: 3, title: 'Complimentary Express Nursery Shipping', badge: 'FREE SHIPPING', category: 'Orders Above ₹1,999', discount: 'FREE ₹350 VALUE', active: true }
  ]);

  const handleExportOffersCSV = () => {
    const headers = ['ID', 'Campaign Title', 'Badge Tag', 'Category Applicability', 'Discount Value', 'Status'];
    const rows = offers.map(o => [o.id, `"${o.title}"`, `"${o.badge}"`, `"${o.category}"`, `"${o.discount}"`, o.active ? 'Active' : 'Ended']);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ORIVIDA_Flash_Offers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 p-6 sm:p-8 bg-[#FAF9F6] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Promotions & Campaign Engine</span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-1">Offers & Flash Sales</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportOffersCSV}
            className="bg-white hover:bg-gray-100 border border-gray-300 text-[#154734] px-5 py-3 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> EXPORT CAMPAIGNS (CSV)
          </button>

          <button
            onClick={() => alert('Add new offer campaign created!')}
            className="bg-[#154734] hover:bg-[#0F3526] text-white px-6 py-3 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" /> CREATE NEW CAMPAIGN
          </button>
        </div>
      </div>

      {/* Campaign Cards Scroll Container */}
      <div className="max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map((off) => (
          <div key={off.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-[#E8F2EC] text-[#154734] font-bold text-[10px]">
                  {off.badge}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">{off.title}</h3>
              <p className="text-xs text-slate-500 font-medium">Category Applicability: {off.category}</p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="font-serif font-extrabold text-base text-[#154734]">{off.discount}</span>
              <button
                onClick={() => setOffers(offers.filter(o => o.id !== off.id))}
                className="text-rose-600 font-bold hover:underline"
              >
                End Campaign
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
