import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown, Sparkles, Leaf, ArrowRight, PhoneCall } from 'lucide-react';
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
      <div className="bg-[#0A3324] border-b border-[#8A6A16]/30 text-xs py-2 px-4 text-[#F7F5EF] font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#F0D585] animate-pulse" />
            <span>Complimentary Express Shipping on Luxury Hampers & Botanicals above ₹1,999</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[#F0D585]">
            <Link to="/gifting-concierge" className="hover:text-white transition flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Gifting Concierge
            </Link>
            <span className="text-[#8A6A16]">|</span>
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3 h-3" /> VIP Support: +91 800-ORIVIDA
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'glass-dark border-b border-[#8A6A16]/30 shadow-2xl py-3'
            : 'bg-[#0B3D2E] border-b border-[#8A6A16]/20 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Left: Mobile menu toggle & Desktop Search */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#F0D585] hover:text-white transition"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#8A6A16]/40 bg-[#0A3324]/60 text-sm text-[#F7F5EF]/80 hover:border-[#F0D585] hover:bg-[#0A3324] transition w-56 xl:w-64"
            >
              <Search className="w-4 h-4 text-[#F0D585]" />
              <span>Search Monstera, Hampers...</span>
            </button>
          </div>

          {/* Center: ORIVIDA Brand Logo Image */}
          <Link to="/" className="flex items-center group py-0.5">
            <img
              src={logoImg}
              alt="ORIVIDA - Our Passion, UR Luxury"
              className="h-16 sm:h-20 md:h-24 w-auto object-contain scale-110 sm:scale-125 group-hover:scale-130 transition duration-300 drop-shadow-[0_4px_20px_rgba(201,151,43,0.5)] my-[-8px]"
            />
          </Link>

          {/* Right: Actions (Search Mobile, Account, Wishlist, Cart) */}
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden p-2 text-[#F0D585] hover:text-white transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => user ? navigate('/account') : setIsAuthModalOpen(true)}
              className="flex items-center gap-2 p-2 text-[#F7F5EF] hover:text-[#F0D585] transition"
              aria-label="User Account"
            >
              {user ? (
                <img src={user.photoURL} alt={user.name} className="w-7 h-7 rounded-full border border-[#F0D585]" />
              ) : (
                <User className="w-5 h-5 text-[#F0D585]" />
              )}
              <span className="hidden xl:inline text-xs font-medium">
                {user ? user.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            <Link
              to="/wishlist"
              className="relative p-2 text-[#F7F5EF] hover:text-[#F0D585] transition"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 text-[#F0D585]" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#C9972B] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-gold-gradient hover:bg-gold-gradient-hover text-[#0A3324] font-bold px-4 py-2 rounded-full shadow-lg transition duration-300 hover:scale-105"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#0A3324]" />
              <span className="text-xs tracking-wider">CART</span>
              <span className="bg-[#0A3324] text-[#F0D585] text-xs px-2 py-0.5 rounded-full font-semibold">
                {totalItemsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Category Navigation & Mega-Menu */}
        <nav className="hidden lg:block border-t border-[#8A6A16]/20 mt-3 pt-2">
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
                  className="font-body text-xs uppercase tracking-widest text-[#F7F5EF]/90 group-hover:text-[#F0D585] flex items-center gap-1.5 transition py-1"
                >
                  {cat.name}
                  <ChevronDown className="w-3.5 h-3.5 text-[#8A6A16] group-hover:text-[#F0D585] group-hover:rotate-180 transition duration-300" />
                </Link>

                {/* Mega Menu Dropdown */}
                {activeCategory === cat.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[720px] bg-[#0A3324] border border-[#8A6A16]/40 rounded-2xl shadow-2xl p-6 glass-dark z-50 grid grid-cols-3 gap-6 transform transition duration-200">
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <div className="col-span-2 border-b border-[#8A6A16]/20 pb-2 mb-1 flex justify-between items-center">
                        <span className="font-serif italic text-sm text-[#F0D585]">{cat.tagline}</span>
                        <Link to={`/category/${cat.slug}`} className="text-xs text-[#C9972B] hover:text-[#FFE9A8] flex items-center gap-1">
                          View All {cat.name} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      {cat.subcategories.map(sub => (
                        <Link
                          key={sub.id}
                          to={`/category/${cat.slug}/${sub.slug}`}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#0B3D2E] transition border border-transparent hover:border-[#8A6A16]/30 group/sub"
                        >
                          <img src={sub.image} alt={sub.name} className="w-12 h-12 rounded-lg object-cover group-hover/sub:scale-105 transition" />
                          <div>
                            <p className="text-xs font-semibold text-[#F7F5EF] group-hover/sub:text-[#F0D585] transition">{sub.name}</p>
                            <p className="text-[10px] text-[#F7F5EF]/60">{sub.count} items</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Featured Category Banner inside Mega Menu */}
                    <div className="relative rounded-xl overflow-hidden border border-[#8A6A16]/30 group/banner">
                      <img src={cat.banner} alt={cat.name} className="w-full h-full object-cover group-hover/banner:scale-110 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
                        <span className="text-[10px] text-[#F0D585] font-bold uppercase tracking-wider">Curated Collection</span>
                        <h4 className="font-serif text-sm text-white font-bold mb-1">{cat.name} Luxury</h4>
                        <Link to={`/category/${cat.slug}`} className="text-[11px] text-[#F0D585] underline">Explore Now &rarr;</Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Link
              to="/gifting-concierge"
              className="font-body text-xs uppercase tracking-widest text-[#F0D585] hover:text-white flex items-center gap-1 py-1 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Bespoke Gifting
            </Link>
            <Link
              to="/about"
              className="font-body text-xs uppercase tracking-widest text-[#F7F5EF]/90 hover:text-[#F0D585] py-1 transition"
            >
              Our Story
            </Link>
          </div>
        </nav>
      </header>

      {/* Live Search Overlay Drawer */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 glass-dark bg-black/75 backdrop-blur-md flex flex-col p-4 md:p-8 animate-fadeIn">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-[#F0D585]" />
                <span className="font-display font-semibold text-lg text-gold-gradient">ORIVIDA Search</span>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 text-[#F7F5EF]/70 hover:text-white transition"
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
                className="w-full bg-[#0A3324] border-2 border-[#C9972B] rounded-full py-4 pl-14 pr-32 text-lg text-[#F7F5EF] placeholder-[#F7F5EF]/50 focus:outline-none focus:ring-4 focus:ring-[#C9972B]/30"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#F0D585]" />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-gold-gradient text-[#0A3324] px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition"
              >
                Search
              </button>
            </form>

            {/* Quick Suggestions & Results */}
            {searchQuery.trim() === '' ? (
              <div>
                <p className="text-xs uppercase tracking-wider text-[#F0D585] mb-3">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Monstera Alba', 'Bastar Bell Metal', 'Plant Gift Hamper', 'Sansevieria', 'Ceramic Urn', 'Balcony Railing'].map((term, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(term)}
                      className="px-4 py-2 rounded-full bg-[#0A3324] border border-[#8A6A16]/40 text-xs text-[#F7F5EF] hover:border-[#F0D585] transition"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <p className="text-xs uppercase tracking-wider text-[#F0D585] mb-3">
                  Found {searchResults.length} results for "{searchQuery}"
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map(prod => (
                    <Link
                      key={prod.id}
                      to={`/product/${prod.slug}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-4 bg-[#0A3324] p-3 rounded-xl border border-[#8A6A16]/30 hover:border-[#F0D585] transition"
                    >
                      <img src={prod.images[0]?.url} alt={prod.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#F0D585]">{prod.categoryName}</span>
                        <h4 className="text-sm font-semibold text-white">{prod.name}</h4>
                        <p className="text-xs text-[#F0D585] font-bold mt-1">₹{prod.discountPrice || prod.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 glass-dark bg-black/80 flex flex-col p-6 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-[#8A6A16]/30 pb-4 mb-6">
            <img src={logoImg} alt="ORIVIDA" className="h-12 sm:h-14 w-auto object-contain scale-110 origin-left drop-shadow-[0_2px_10px_rgba(201,151,43,0.4)]" />
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F7F5EF]/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto">
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="border-b border-[#8A6A16]/20 pb-3">
                <Link
                  to={`/category/${cat.slug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-bold text-[#F0D585] block mb-2"
                >
                  {cat.name}
                </Link>
                <div className="grid grid-cols-2 gap-2 pl-2">
                  {cat.subcategories.map(sub => (
                    <Link
                      key={sub.id}
                      to={`/category/${cat.slug}/${sub.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs text-[#F7F5EF]/80 hover:text-white py-1"
                    >
                      • {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <Link
              to="/gifting-concierge"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-[#F0D585] flex items-center gap-2 py-2"
            >
              <Sparkles className="w-4 h-4" /> Gifting Concierge
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm text-[#F7F5EF] py-2"
            >
              Our Story
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
