import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import AuthModal from './components/auth/AuthModal';

import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Wishlist from './pages/Wishlist';
import Account from './pages/Account';
import GiftingConcierge from './pages/GiftingConcierge';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';

// Scroll to Top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen bg-[#0B3D2E] text-[#F7F5EF] antialiased">
              <Navbar />
              <AuthModal />
              <CartDrawer />
              
              <main className="flex-1">
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
                  <Route path="/gifting-concierge" element={<GiftingConcierge />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </main>

              <Footer />
            </div>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
