import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Package, MapPin, Heart, LogOut, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Account() {
  const { user, logout, setIsAuthModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <h2 className="font-display font-extrabold text-2xl text-white">Sign In Required</h2>
        <p className="text-xs text-[#F7F5EF]/70">Please sign in with Google to view your ORIVIDA account and order history.</p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="bg-gold-gradient text-[#0A3324] px-8 py-3.5 rounded-full font-bold text-xs shadow-xl"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Profile Header */}
      <div className="p-8 rounded-3xl bg-[#0A3324] border-2 border-[#C9972B] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-5">
          <img src={user.photoURL} alt={user.name} className="w-20 h-20 rounded-full border-2 border-[#F0D585] shadow-lg object-cover" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-2xl text-white">{user.name}</h1>
              <span className="bg-[#8A6A16] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">VIP Member</span>
            </div>
            <p className="text-xs text-[#F0D585] mt-0.5">{user.email}</p>
            <p className="text-[10px] text-gray-400 mt-1">Client Member Since: {user.memberSince}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B3D2E] text-red-400 border border-red-900/40 text-xs font-bold hover:bg-red-950/40 transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#8A6A16]/30 gap-6 text-xs uppercase font-bold tracking-wider">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'orders' ? 'border-[#F0D585] text-[#F0D585]' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" /> Order History
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'addresses' ? 'border-[#F0D585] text-[#F0D585]' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" /> Saved Addresses
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {mockOrders.map(ord => (
            <div key={ord.id} className="p-6 rounded-3xl bg-[#0A3324] border border-[#8A6A16]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-mono font-bold text-sm text-[#F0D585]">#{ord.id}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {ord.status}
                  </span>
                </div>
                <p className="text-xs text-white font-semibold mt-2">{ord.item}</p>
                <p className="text-[10px] text-gray-400 mt-1">Ordered on {ord.date}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-serif font-bold text-lg text-white">₹{ord.total.toLocaleString('en-IN')}</span>
                <Link to={`/orders/${ord.id}`} className="bg-[#0B3D2E] border border-[#8A6A16] text-[#F0D585] text-xs font-bold px-4 py-2 rounded-full">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-[#0A3324] border border-[#8A6A16]/40 space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#F0D585] bg-[#0B3D2E] px-2 py-0.5 rounded border border-[#8A6A16]">Primary Residence</span>
            <h4 className="font-bold text-sm text-white">Princess Radhika</h4>
            <p className="text-xs text-gray-300">Suite 402, Royal Palms Residency, Indiranagar</p>
            <p className="text-xs text-gray-300">Bengaluru, Karnataka - 560038</p>
            <p className="text-xs text-gray-400 pt-2">Phone: +91 98765 43210</p>
          </div>
        </div>
      )}

    </div>
  );
}
