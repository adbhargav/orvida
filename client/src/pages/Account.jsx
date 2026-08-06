import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Package, MapPin, Heart, LogOut, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Account() {
  const { user, logout, setIsAuthModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6 bg-[#FAF9F6]">
        <h2 className="font-display font-extrabold text-2xl text-slate-900">Sign In Required</h2>
        <p className="text-xs text-slate-600">Please sign in with Google to view your ORIVIDA account and order history.</p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="bg-[#154734] hover:bg-[#0F3526] text-white px-8 py-3.5 rounded-full font-bold text-xs shadow-md"
        >
          SIGN IN WITH GOOGLE
        </button>
      </div>
    );
  }

  const mockOrders = [
    {
      id: 'ORI-ORD-982131',
      date: '24 July 2026',
      total: 5499,
      status: 'Delivered',
      item: 'The Emperor’s Golden Harvest Plant Hamper'
    },
    {
      id: 'ORI-ORD-881204',
      date: '12 May 2026',
      total: 3999,
      status: 'Delivered',
      item: 'Royal Monstera Deliciosa (Variegated Alba)'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#FAF9F6]">
      
      {/* Profile Header */}
      <div className="p-8 rounded-3xl bg-white border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-5">
          <img src={user.photoURL} alt={user.name} className="w-20 h-20 rounded-full border-2 border-[#154734] shadow-md object-cover" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-2xl text-slate-900">{user.name}</h1>
              <span className="bg-[#154734] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">VIP Member</span>
            </div>
            <p className="text-xs text-[#154734] font-semibold mt-0.5">{user.email}</p>
            <p className="text-[10px] text-slate-500 mt-1">Client Member Since: {user.memberSince}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs uppercase font-bold tracking-wider">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'orders' ? 'border-[#154734] text-[#154734]' : 'border-transparent text-gray-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" /> Order History
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'addresses' ? 'border-[#154734] text-[#154734]' : 'border-transparent text-gray-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" /> Saved Addresses
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {mockOrders.map(ord => (
            <div key={ord.id} className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-mono font-bold text-sm text-[#154734]">#{ord.id}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8F2EC] text-[#154734] text-[10px] font-bold border border-[#154734]/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#154734]" /> {ord.status}
                  </span>
                </div>
                <p className="text-xs text-slate-900 font-semibold mt-2">{ord.item}</p>
                <p className="text-[10px] text-slate-500 mt-1">Ordered on {ord.date}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-serif font-bold text-lg text-slate-900">₹{ord.total.toLocaleString('en-IN')}</span>
                <Link to={`/orders/${ord.id}`} className="bg-[#154734] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#0F3526]">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#154734] bg-[#E8F2EC] px-2 py-0.5 rounded border border-[#154734]/20">Primary Residence</span>
            <h4 className="font-bold text-sm text-slate-900">Princess Radhika</h4>
            <p className="text-xs text-slate-600">Suite 402, Royal Palms Residency, Indiranagar</p>
            <p className="text-xs text-slate-600">Bengaluru, Karnataka - 560038</p>
            <p className="text-xs text-slate-500 pt-2">Phone: +91 98765 43210</p>
          </div>
        </div>
      )}

    </div>
  );
}
