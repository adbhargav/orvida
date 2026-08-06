import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown, Sparkles, Leaf, ArrowRight, PhoneCall, Gift } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, PRODUCTS } from '../../data/mockData';
import logoImg from '../../assets/logo.png';

export default function Navbar() {
  const navigate = useNavigate();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, setIsAuthModalOpen } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const searchResults = searchQuery.trim()
    ? PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subcategoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/plants?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      {/* Top Luxury Announcement Strip */}
      <div className="bg-[#154734] border-b border-[#103A2B] text-xs py-1.5 sm:py-2.5 px-3 sm:px-4 text-white font-medium tracking-wide shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F0D585] animate-pulse" />
            <span className="text-[10px] sm:text-xs">
              <span className="sm:hidden">Complimentary Express Shipping &gt; ₹1,999</span>
              <span className="hidden sm:inline">Complimentary Express Shipping on Luxury Hampers & Botanicals above ₹1,999</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[#E8F2EC] text-xs">
            <Link to="/gifting-concierge" className="hover:text-white transition flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#F0D585]" /> Gifting Concierge
            </Link>
            <span className="text-[#2A6A52]">|</span>
            <span className="flex items-center gap-1 font-medium">
              <PhoneCall className="w-3 h-3 text-[#F0D585]" /> VIP Support: +91 800-ORIVIDA
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-md py-1.5 sm:py-2.5'
            : 'bg-white border-b border-gray-100 py-2 sm:py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Left: Mobile menu toggle & Desktop Search */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-[#154734] transition rounded-full hover:bg-gray-100"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-xs text-slate-600 hover:border-[#154734] hover:bg-white transition w-56 xl:w-64 shadow-inner"
            >
              <Search className="w-4 h-4 text-[#154734]" />
              <span>Search Monstera, Hampers...</span>
            </button>
          </div>

          {/* Center: ORIVIDA Brand Logo Image */}
          <Link to="/" className="flex items-center group py-0.5">
            <img
              src={logoImg}
              alt="ORIVIDA - Our Passion, UR Luxury"
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain transition-transform duration-300 scale-110 sm:scale-105"
            />
          </Link>

          {/* Right: Actions (Search Mobile, Account, Wishlist, Cart) */}
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-[#154734] transition rounded-full hover:bg-gray-100"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => user ? navigate('/account') : navigate('/login')}
              className="flex items-center gap-2 p-1.5 sm:p-2 text-slate-700 hover:text-[#154734] transition rounded-full hover:bg-gray-100"
              aria-label="User Account"
            >
              {user ? (
                <img src={user.photoURL} alt={user.name} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[#154734]" />
              ) : (
                <User className="w-5 h-5 text-slate-700 hover:text-[#154734]" />
              )}
              <span className="hidden xl:inline text-xs font-semibold text-slate-800">
                {user ? user.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            <Link
              to="/wishlist"
              className="relative p-1.5 sm:p-2 text-slate-700 hover:text-[#154734] transition rounded-full hover:bg-gray-100"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 text-slate-700 hover:text-[#154734]" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#154734] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 bg-[#154734] hover:bg-[#0F3526] text-white font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md transition duration-300 hover:scale-105"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="hidden sm:inline text-xs tracking-wider">CART</span>
              <span className="bg-white/20 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">
                {totalItemsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Category Navigation & Mega-Menu */}
        <nav className="hidden lg:block border-t border-gray-100 mt-2 pt-2">
          <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-8">
            {CATEGORIES.map(cat => (
              <div
                key={cat.id}
                className="relative group py-2"
                onMouseEnter={() => setActiveCategory(cat.id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  to={`/category/${cat.slug}`}
                  className="font-body text-xs uppercase tracking-widest text-slate-700 font-semibold group-hover:text-[#154734] flex items-center gap-1.5 transition py-1"
                >
                  {cat.name}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#154734] group-hover:rotate-180 transition duration-300" />
                </Link>

                {/* Mega Menu Dropdown */}
                {activeCategory === cat.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[720px] bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 z-50 grid grid-cols-3 gap-6 transform transition duration-200">
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <div className="col-span-2 border-b border-gray-100 pb-2 mb-1 flex justify-between items-center">
                        <span className="font-serif italic text-sm text-[#154734] font-medium">{cat.tagline}</span>
                        <Link to={`/category/${cat.slug}`} className="text-xs text-[#154734] font-bold hover:underline flex items-center gap-1">
                          View All {cat.name} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      {cat.subcategories.map(sub => (
                        <Link
                          key={sub.id}
                          to={`/category/${cat.slug}/${sub.slug}`}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F0F5F2] transition border border-transparent hover:border-[#154734]/20 group/sub"
                        >
                          <img src={sub.image} alt={sub.name} className="w-12 h-12 rounded-lg object-cover group-hover/sub:scale-105 transition" />
                          <div>
                            <p className="text-xs font-bold text-slate-800 group-hover/sub:text-[#154734] transition">{sub.name}</p>
                            <p className="text-[10px] text-slate-500">{sub.count} items</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Featured Category Banner inside Mega Menu */}
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 group/banner">
                      <img src={cat.banner} alt={cat.name} className="w-full h-full object-cover group-hover/banner:scale-110 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                        <span className="text-[10px] text-[#F0D585] font-bold uppercase tracking-wider">Curated Collection</span>
                        <h4 className="font-serif text-sm text-white font-bold mb-1">{cat.name} Luxury</h4>
                        <Link to={`/category/${cat.slug}`} className="text-[11px] text-[#F0D585] font-bold underline">Explore Now &rarr;</Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Link
              to="/gifting-concierge"
              className="font-body text-xs uppercase tracking-widest text-[#154734] font-bold hover:text-[#0F3526] flex items-center gap-1 py-1 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C9972B]" /> Bespoke Gifting
            </Link>
            <Link
              to="/about"
              className="font-body text-xs uppercase tracking-widest text-slate-700 font-semibold hover:text-[#154734] py-1 transition"
            >
              Our Story
            </Link>
          </div>
        </nav>
      </header>

      {/* Live Search Overlay Drawer */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col p-4 md:p-8 animate-fadeIn">
          <div className="max-w-4xl mx-auto w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-[#154734]" />
                <span className="font-display font-bold text-lg text-slate-900">Search ORIVIDA</span>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative mb-6">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rare plants, bell metal arts, hampers, ceramics..."
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-full py-4 pl-14 pr-32 text-base text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#154734] focus:bg-white"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#154734]" />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#154734] text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-[#0F3526] transition"
              >
                Search
              </button>
            </form>

            {/* Quick Suggestions & Results */}
            {searchQuery.trim() === '' ? (
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Monstera Alba', 'Bastar Bell Metal', 'Plant Gift Hamper', 'Sansevieria', 'Ceramic Urn', 'Balcony Railing'].map((term, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(term)}
                      className="px-4 py-2 rounded-full bg-gray-100 hover:bg-[#F0F5F2] border border-gray-200 text-xs text-slate-700 hover:text-[#154734] hover:border-[#154734]/40 font-medium transition"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto pr-2">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">
                  Found {searchResults.length} results for "{searchQuery}"
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map(prod => (
                    <Link
                      key={prod.id}
                      to={`/product/${prod.slug}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200 hover:border-[#154734] transition hover:bg-[#F0F5F2]"
                    >
                      <img src={prod.images[0]?.url} alt={prod.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#154734]">{prod.categoryName}</span>
                        <h4 className="text-sm font-bold text-slate-900">{prod.name}</h4>
                        <p className="text-xs text-[#154734] font-bold mt-1">₹{(prod.discountPrice || prod.price).toLocaleString('en-IN')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Left-side Off-canvas Drawer Menu (Kyari Inspired Design) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fadeIn"
          />

          {/* Left-Side Off-Canvas Drawer Panel */}
          <div className="relative z-10 w-[88%] max-w-sm bg-white h-full p-5 flex flex-col justify-between overflow-y-auto shadow-2xl transition-transform duration-300 ease-out border-r border-gray-200">
            <div>
              {/* Top Header Bar: Close X on left, Log in on right */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-3.5 mb-2">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-800 hover:text-[#154734] transition"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    user ? navigate('/account') : navigate('/login');
                  }}
                  className="flex items-center gap-1.5 text-sm font-bold text-[#154734] hover:underline"
                >
                  <User className="w-5 h-5 text-[#154734]" />
                  <span>{user ? user.name.split(' ')[0] : 'Log in'}</span>
                </button>
              </div>

              {/* Navigation List Items (Matching Kyari Screenshot UI) */}
              <div className="divide-y divide-gray-200">
                
                {/* Categories with Subcategory Expansion */}
                {CATEGORIES.map(cat => (
                  <div key={cat.id} className="py-1">
                    <div className="flex items-center justify-between py-3.5 px-1 cursor-pointer">
                      <Link
                        to={`/category/${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-sm font-bold text-[#154734] uppercase tracking-wider flex-1"
                      >
                        {cat.name}
                      </Link>
                      <Link
                        to={`/category/${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-1 text-[#154734]"
                      >
                        <ArrowRight className="w-4 h-4 text-[#154734]" />
                      </Link>
                    </div>

                    {/* Subcategories preview chips */}
                    <div className="flex flex-wrap gap-1.5 pb-2 pl-1">
                      {cat.subcategories.map(sub => (
                        <Link
                          key={sub.id}
                          to={`/category/${cat.slug}/${sub.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-[11px] font-medium text-slate-600 bg-gray-100 hover:bg-[#E8F2EC] hover:text-[#154734] px-2.5 py-1 rounded-full border border-gray-200 transition"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Additional Menu Items */}
                <div className="py-3.5 px-1 flex justify-between items-center cursor-pointer">
                  <Link
                    to="/category/plants/rare-exotic-plants"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-bold text-[#154734] uppercase tracking-wider flex items-center gap-1.5"
                  >
                    ORIVIDA'S FAV <Sparkles className="w-3.5 h-3.5 text-[#F0D585]" /><Leaf className="w-3.5 h-3.5 text-[#154734]" />
                  </Link>
                </div>

                <div className="py-3.5 px-1 flex justify-between items-center cursor-pointer">
                  <Link
                    to="/gifting-concierge"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-bold text-[#154734] uppercase tracking-wider"
                  >
                    GIFT CARDS
                  </Link>
                </div>

                <div className="py-3.5 px-1 flex justify-between items-center cursor-pointer">
                  <Link
                    to="/gifting-concierge"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-bold text-[#154734] uppercase tracking-wider"
                  >
                    CORPORATE GIFTS
                  </Link>
                </div>

                <div className="py-3.5 px-1 flex justify-between items-center cursor-pointer">
                  <Link
                    to="/category/plants"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-bold text-[#154734] uppercase tracking-wider flex items-center gap-1"
                  >
                    OFFERS ⚡⚡
                  </Link>
                </div>

                <div className="py-3.5 px-1 flex justify-between items-center cursor-pointer">
                  <Link
                    to="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-bold text-[#154734] uppercase tracking-wider"
                  >
                    OUR STORY
                  </Link>
                </div>

                <div className="py-3.5 px-1 flex justify-between items-center cursor-pointer">
                  <Link
                    to="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-bold text-[#154734] uppercase tracking-wider"
                  >
                    LOCATE STORE
                  </Link>
                </div>

              </div>
            </div>

            {/* Bottom Feature Badges (Exact Kyari Screenshot items) */}
            <div className="pt-6 border-t border-gray-200 space-y-3.5 text-xs text-[#154734] font-semibold">
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-slate-800 hover:text-[#154734] transition"
              >
                <Leaf className="w-4 h-4 text-[#154734]" />
                <span>30-Day Plant Guarantee → <span className="underline text-[#154734] font-bold">Start Here</span></span>
              </Link>

              <Link
                to="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-slate-800 hover:text-[#154734] transition"
              >
                <Gift className="w-4 h-4 text-[#154734]" />
                <span>Plant Parent Rewards Club</span>
              </Link>

              <Link
                to="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-slate-800 hover:text-[#154734] transition"
              >
                <PhoneCall className="w-4 h-4 text-[#154734]" />
                <span className="underline">Track Order</span>
              </Link>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
