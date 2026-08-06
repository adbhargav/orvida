import React from 'react';
import { DollarSign, Package, Users, TrendingUp, ShoppingBag, ArrowUpRight, ShieldCheck, Sparkles, Download } from 'lucide-react';
import { PRODUCTS } from '../../data/mockData';

export default function AdminOverview() {
  const recentOrders = [
    { id: 'ORD-9821', customer: 'Aarav Sharma', items: '2x Variegated Alba', total: '₹14,998', status: 'Delivered', date: '10 mins ago' },
    { id: 'ORD-9820', customer: 'Priya Verma', items: '1x Bastar Brass Statue', total: '₹18,500', status: 'Processing', date: '35 mins ago' },
    { id: 'ORD-9819', customer: 'Vikram Malhotra', items: '1x Monsoon Plant Trunk', total: '₹12,499', status: 'Shipped', date: '1 hour ago' },
    { id: 'ORD-9818', customer: 'Ananya Roy', items: '3x Sansevieria Trifasciata', total: '₹4,497', status: 'Delivered', date: '3 hours ago' },
    { id: 'ORD-9817', customer: 'Rohan Gupta', items: '1x Ficus Bonsai Specimen', total: '₹8,990', status: 'Delivered', date: '5 hours ago' }
  ];

  const handleExportOverviewCSV = () => {
    const headers = ['Order ID', 'Customer', 'Items', 'Total Amount', 'Status', 'Date'];
    const rows = recentOrders.map(o => [o.id, `"${o.customer}"`, `"${o.items}"`, `"${o.total}"`, o.status, `"${o.date}"`]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ORIVIDA_Overview_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 p-6 sm:p-8 bg-[#FAF9F6] min-h-screen">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Real-Time Store Performance</span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-1">Atelier Dashboard Overview</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportOverviewCSV}
            className="bg-white hover:bg-gray-100 border border-gray-300 text-[#154734] px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> EXPORT AUDIT (CSV)
          </button>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-xs font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Store Status: Active</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>TOTAL MONTHLY REVENUE</span>
            <div className="p-2 rounded-xl bg-[#E8F2EC] text-[#154734]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif font-extrabold text-3xl text-[#154734]">₹14,82,900</p>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
            <ArrowUpRight className="w-4 h-4" />
            <span>+18.4% vs previous 30 days</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>ACTIVE CATALOG ITEMS</span>
            <div className="p-2 rounded-xl bg-[#E8F2EC] text-[#154734]">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif font-extrabold text-3xl text-slate-900">{PRODUCTS.length}</p>
          <p className="text-xs text-slate-500 font-medium">Across 4 luxury category pillars</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>REGISTERED VIP USERS</span>
            <div className="p-2 rounded-xl bg-[#E8F2EC] text-[#154734]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif font-extrabold text-3xl text-slate-900">1,420</p>
          <p className="text-xs text-emerald-600 font-bold">+142 new signups this week</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>TOTAL ORDERS COMPLETED</span>
            <div className="p-2 rounded-xl bg-[#E8F2EC] text-[#154734]">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif font-extrabold text-3xl text-slate-900">3,894</p>
          <p className="text-xs text-slate-500 font-medium">99.4% Fulfillment Success Rate</p>
        </div>
      </div>

      {/* Grid Section: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Orders Ledger */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Recent Live Orders</h3>
              <p className="text-xs text-slate-500">Real-time incoming orders across India</p>
            </div>
            <span className="text-xs text-[#154734] font-bold bg-[#E8F2EC] px-3 py-1 rounded-full">
              5 Orders Pending Dispatch
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-2">Order ID</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Items</th>
                  <th className="py-3 px-2">Total Amount</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-2 font-bold text-[#154734]">{ord.id}</td>
                    <td className="py-3.5 px-2 font-bold text-slate-800">{ord.customer}</td>
                    <td className="py-3.5 px-2 text-slate-600">{ord.items}</td>
                    <td className="py-3.5 px-2 font-bold text-slate-900">{ord.total}</td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        ord.status === 'Processing' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-slate-400">{ord.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performing Specimen Products */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-display font-bold text-base text-slate-900">Top Bestselling Items</h3>
            <p className="text-xs text-slate-500">Highest grossing inventory</p>
          </div>

          <div className="space-y-4">
            {PRODUCTS.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition">
                <img src={item.images[0].url} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">{item.categoryName}</span>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-xs text-[#154734] block">₹{item.discountPrice.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">{item.reviewCount * 4} sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
