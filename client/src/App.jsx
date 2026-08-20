import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { SeoProvider } from './context/SeoContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';

import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import NotFound from './pages/NotFound';

// Split out of the storefront bundle: shoppers never load the admin portal,
// and these routes are not on the critical path.
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Account = lazy(() => import('./pages/Account'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const About = lazy(() => import('./pages/About'));
const GiftingConcierge = lazy(() => import('./pages/GiftingConcierge'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <span className="w-5 h-5 border-2 border-line border-t-emerald-default rounded-full animate-spin" role="status" aria-label="Loading" />
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink antialiased">
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <CartDrawer />}

      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/category/:slug/:subSlug" element={<CategoryPage />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders/:id" element={<OrderConfirmation />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<Account />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/gifting-concierge" element={<GiftingConcierge />} />
            <Route path="/about" element={<About />} />
            <Route path="/policies/:slug" element={<PolicyPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SeoProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AppContent />
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </SeoProvider>
    </AuthProvider>
  );
}
