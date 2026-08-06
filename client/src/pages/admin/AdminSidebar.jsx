import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  CreditCard, 
  Users, 
  Image as ImageIcon, 
  Tag, 
  Ticket, 
  Sparkles,
  LogOut 
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export default function AdminSidebar({ activeTab, setActiveTab, user, onLogout }) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'products', label: 'Products', icon: Package, badge: '28' },
    { id: 'categories', label: 'Categories', icon: Layers, badge: '4' },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: '14' },
    { id: 'users', label: 'Users & VIPs', icon: Users, badge: '1,420' },
    { id: 'banners', label: 'Banners & Hero', icon: ImageIcon, badge: null },
    { id: 'offers', label: 'Flash Offers', icon: Tag, badge: 'Active' },
    { id: 'coupons', label: 'Coupon Codes', icon: Ticket, badge: '4 Active' },
  ];

  return (
    <aside className="w-64 bg-[#0C2B21] text-white flex flex-col justify-between min-h-screen border-r border-[#154734] shrink-0 shadow-xl">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#154734] flex items-center gap-3">
          <img src={logoImg} alt="ORIVIDA Atelier" className="h-10 w-auto object-contain filter brightness-200" />
          <div>
            <span className="text-[9px] uppercase tracking-widest text-[#F0D585] font-bold block">ADMIN PORTAL</span>
            <h2 className="font-display font-bold text-sm text-white">ORIVIDA Atelier</h2>
          </div>
        </div>

        {/* User Mini Card */}
        <div className="mx-4 my-4 p-3 rounded-2xl bg-[#123E30] border border-[#1E5644] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#154734] border border-[#F0D585] flex items-center justify-center text-[#F0D585] font-bold text-xs">
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="font-bold text-xs text-white truncate">{user?.name || 'Master Admin'}</h4>
            <p className="text-[10px] text-[#C2D6CB] truncate">{user?.email || 'admin@orvida.com'}</p>
          </div>
        </div>

        {/* Menu Items Navigation */}
        <nav className="px-3 space-y-1.5 pt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition duration-200 ${
                  isActive
                    ? 'bg-[#154734] text-white shadow-md border border-[#2A6A52]'
                    : 'text-[#C2D6CB] hover:bg-[#123E30] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#F0D585]' : 'text-[#C2D6CB]'}`} />
                  <span>{item.label}</span>
                </div>
                
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-[#F0D585] text-[#0C2B21]' : 'bg-[#123E30] text-[#C2D6CB]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Logout Action */}
      <div className="p-4 border-t border-[#154734] space-y-3">
        <div className="p-3 rounded-xl bg-[#123E30]/70 border border-[#1E5644] text-[11px] text-[#C2D6CB] space-y-1">
          <span className="text-white font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F0D585]" /> Live Sync Mode
          </span>
          <p className="text-[10px]">Real-time sync with Cart & Storefront</p>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-900/40 hover:bg-rose-900/80 border border-rose-800 text-rose-200 font-bold text-xs transition"
          >
            <LogOut className="w-4 h-4 text-rose-300" />
            <span>Sign Out Admin</span>
          </button>
        )}
      </div>
    </aside>
  );
}
