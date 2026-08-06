import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLogin from './admin/AdminLogin';
import AdminSidebar from './admin/AdminSidebar';
import AdminOverview from './admin/AdminOverview';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminPayments from './admin/AdminPayments';
import AdminUsers from './admin/AdminUsers';
import AdminBanners from './admin/AdminBanners';
import AdminOffers from './admin/AdminOffers';
import AdminCoupons from './admin/AdminCoupons';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('orvida_admin_auth') === 'true';
  });
  
  const [adminUser, setAdminUser] = useState(() => {
    return user || { name: 'Master Atelier Admin', email: 'admin@orvida.com' };
  });

  const [activeTab, setActiveTab] = useState('overview');

  const handleLoginSuccess = (authenticatedUser) => {
    setIsAdminAuthenticated(true);
    setAdminUser(authenticatedUser);
    localStorage.setItem('orvida_admin_auth', 'true');
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('orvida_admin_auth');
  };

  if (!isAdminAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F6] text-slate-900 font-body">
      {/* Side Menu Bar Navigation */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={adminUser} onLogout={handleLogout} />

      {/* Main Admin Content Area */}
      <main className="flex-1 overflow-y-auto h-full">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'payments' && <AdminPayments />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'banners' && <AdminBanners />}
        {activeTab === 'offers' && <AdminOffers />}
        {activeTab === 'coupons' && <AdminCoupons />}
      </main>
    </div>
  );
}
