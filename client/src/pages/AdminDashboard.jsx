import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLogin from './admin/AdminLogin';
import AdminSidebar from './admin/AdminSidebar';
import AdminOverview from './admin/AdminOverview';
import AdminOrders from './admin/AdminOrders';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminPayments from './admin/AdminPayments';
import AdminUsers from './admin/AdminUsers';
import AdminBanners from './admin/AdminBanners';
import AdminOffers from './admin/AdminOffers';
import AdminCoupons from './admin/AdminCoupons';
import AdminEnquiries from './admin/AdminEnquiries';
import AdminNewsletter from './admin/AdminNewsletter';
import AdminSiteContent from './admin/AdminSiteContent';
import AdminSeo from './admin/AdminSeo';

const PANELS = {
  overview: AdminOverview,
  orders: AdminOrders,
  products: AdminProducts,
  categories: AdminCategories,
  payments: AdminPayments,
  users: AdminUsers,
  banners: AdminBanners,
  offers: AdminOffers,
  coupons: AdminCoupons,
  enquiries: AdminEnquiries,
  newsletter: AdminNewsletter,
  content: AdminSiteContent,
  seo: AdminSeo,
};

export default function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // The gate is the signed-in user's admin claim, verified server-side on
  // every request. It used to be a localStorage flag, which anyone could set
  // from the console.
  if (!user || !isAdmin) {
    return <AdminLogin currentUser={user} />;
  }

  const ActivePanel = PANELS[activeTab] || AdminOverview;

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink font-body">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={logout} />
      <main className="flex-1 overflow-y-auto h-full">
        <ActivePanel />
      </main>
    </div>
  );
}
