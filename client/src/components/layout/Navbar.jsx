import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { COMPANY } from '../../config/company';
import logoImg from '../../assets/logo.png';
const ANNOUNCEMENTS = [
  'Complimentary shipping on orders above ₹1,999',
  'Any 4 plants at ₹999 — limited botanical offer',
  '7-day plant health guarantee on every specimen',
];
const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function Navbar() {
  const navigate = useNavigate();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileCategory, setOpenMobileCategory] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  // Google avatar URLs regularly fail to load (their CDN rejects hotlinks),
  // so fall back to the member's initial rather than a broken image.
  const [photoFailed, setPhotoFailed] = useState(false);

  const searchInputRef = useRef(null);

  // Navigation is built purely from the live catalogue. The row below keeps a
  // fixed height, so an empty first paint does not shift the page.
  useEffect(() => {
    let cancelled = false;
    api.categories
      .getAll()
      .then((res) => {
        if (!cancelled) setCategories(res.categories || []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  // Lock body scroll while an overlay is open.
  useEffect(() => {
    const locked = isSearchOpen || isMobileMenuOpen;
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSearchOpen, isMobileMenuOpen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Debounced live search against the catalogue rather than bundled sample data.
  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await api.products.getAll({ search: term, limit: 6 });
        setSearchResults(res.products || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Collapse any expanded accordion so the menu reopens in a clean state.
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    setOpenMobileCategory(null);
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/category/plants?search=${encodeURIComponent(searchQuery.trim())}`);
    closeSearch();
  };

  const displayName = user?.name?.split(' ')[0] || user?.email?.split('@')[0];
  const avatarLetter = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <>
      {/* Announcement — a single rotating line rather than a scrolling ticker */}
      <div className="bg-emerald-default text-white">
        <div className="max-w-[1600px] mx-auto px-4 h-9 flex items-center justify-center overflow-hidden">
          <p key={announcementIndex} className="text-xs tracking-[0.08em] text-center animate-fadeIn">
            {ANNOUNCEMENTS[announcementIndex]}
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-line">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="h-[72px] sm:h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {/* Left */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 text-ink hover:text-emerald-default transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden lg:flex items-center gap-2.5 text-sm text-ink-soft hover:text-emerald-default transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>

            {/* Logo */}
            <Link to="/" className="justify-self-center" aria-label="ORIVIDA home">
              <img
                src={logoImg}
                alt="ORIVIDA"
                className="h-11 sm:h-14 w-auto object-contain"
              />
            </Link>

            {/* Right */}
            <div className="flex items-center justify-end gap-1 sm:gap-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="lg:hidden p-2 text-ink hover:text-emerald-default transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate(user ? '/account' : '/login')}
                className="flex items-center gap-2 p-2 text-ink hover:text-emerald-default transition-colors"
                aria-label={user ? 'Your account' : 'Sign in'}
              >
                {user?.photoURL && !photoFailed ? (
                  <img
                    src={user.photoURL} alt="" onError={() => setPhotoFailed(true)}
                    className="w-6 h-6 rounded-full object-cover border border-line"
                  />
                ) : user ? (
                  <span className="w-6 h-6 rounded-full bg-emerald-default text-white flex items-center justify-center text-[11px] font-medium">
                    {avatarLetter}
                  </span>
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="hidden xl:inline text-sm">{user ? displayName : 'Sign in'}</span>
              </button>

              <Link
                to="/wishlist"
                className="relative p-2 text-ink hover:text-emerald-default transition-colors"
                aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}`}
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-emerald-default text-white text-[10px] rounded-full flex items-center justify-center tabular">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-3 sm:px-4 py-2 text-ink hover:text-emerald-default transition-colors"
                aria-label={`Cart${totalItemsCount ? `, ${totalItemsCount} items` : ''}`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">Cart</span>
                {totalItemsCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-emerald-default text-white text-[10px] rounded-full flex items-center justify-center tabular">
                    {totalItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Category navigation */}
        <nav className="hidden lg:block border-t border-line" onMouseLeave={() => setActiveCategory(null)}>
          {/* min-h reserves the row so the header does not jump when the
              categories resolve. */}
          <div className="max-w-[1600px] mx-auto px-12 flex justify-center items-center gap-10 min-h-[46px]">
            {categories.map((cat) => (
              <div key={cat.id} className="relative" onMouseEnter={() => setActiveCategory(cat.id)}>
                <Link
                  to={`/category/${cat.slug}`}
                  className={`flex items-center gap-1.5 py-3.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                    activeCategory === cat.id ? 'text-emerald-default' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {cat.name}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-300 ${
                      activeCategory === cat.id ? 'rotate-180' : ''
                    }`}
                  />
                </Link>
              </div>
            ))}

            <Link
              to="/gifting-concierge"
              className="py-3.5 text-[11px] uppercase tracking-[0.16em] text-ink-soft hover:text-ink transition-colors"
            >
              Bespoke Gifting
            </Link>
            <Link
              to="/about"
              className="py-3.5 text-[11px] uppercase tracking-[0.16em] text-ink-soft hover:text-ink transition-colors"
            >
              Our Story
            </Link>
          </div>

          {/* Mega menu */}
          {activeCategory && (() => {
            const cat = categories.find((c) => c.id === activeCategory);
            if (!cat) return null;
            return (
              <div className="absolute inset-x-0 top-full bg-white border-t border-line shadow-lifted animate-fadeIn">
                <div className="max-w-[1600px] mx-auto px-12 py-10 grid grid-cols-12 gap-10">
                  <div className="col-span-3 space-y-2">
                    <p className="type-heading text-2xl text-ink">{cat.name}</p>
                    {cat.tagline && <p className="text-sm text-ink-soft italic leading-relaxed">{cat.tagline}</p>}
                    <Link
                      to={`/category/${cat.slug}`}
                      className="inline-flex items-center gap-1.5 pt-2 text-sm text-emerald-default link-underline"
                    >
                      Shop all {cat.name} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="col-span-6 grid grid-cols-2 gap-x-8 gap-y-1 content-start">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/category/${cat.slug}/${sub.slug}`}
                        className="group flex items-baseline justify-between py-2.5 border-b border-line text-sm text-ink-soft hover:text-emerald-default transition-colors"
                      >
                        <span>{sub.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                      </Link>
                    ))}
                  </div>

                  {cat.banner && (
                    <Link to={`/category/${cat.slug}`} className="col-span-3 group block">
                      <div className="aspect-[4/5] overflow-hidden bg-emerald-subtle">
                        <img
                          src={cat.banner}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[900ms] ease-out"
                        />
                      </div>
                      <p className="type-eyebrow text-ink-faint mt-3">Featured collection</p>
                    </Link>
                  )}
                </div>
              </div>
            );
          })()}
        </nav>
      </header>

      {/* Search overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm animate-fadeIn" onClick={closeSearch}>
          <div
            className="bg-white border-b border-line animate-riseIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
              <div className="flex justify-between items-center mb-6">
                <span className="type-eyebrow text-ink-faint">Search the collection</span>
                <button onClick={closeSearch} className="p-1 text-ink-soft hover:text-ink transition-colors" aria-label="Close search">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative border-b border-ink pb-3">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rare plants, bell metal art, hampers…"
                  className="w-full bg-transparent text-xl sm:text-2xl type-heading text-ink placeholder:text-ink-faint focus:outline-none pr-10"
                />
                <button type="submit" className="absolute right-0 top-1 text-ink-soft hover:text-emerald-default transition-colors" aria-label="Search">
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </form>

              <div className="mt-8">
                {searchQuery.trim().length < 2 ? (
                  <div className="space-y-3">
                    <p className="type-eyebrow text-ink-faint">Popular searches</p>
                    <div className="flex flex-wrap gap-2">
                      {['Monstera', 'Dhokra brass', 'Gift hamper', 'Succulents', 'Ceramic planter'].map((term) => (
                        <button
                          key={term}
                          onClick={() => setSearchQuery(term)}
                          className="px-3.5 py-1.5 border border-line text-sm text-ink-soft hover:border-emerald-default hover:text-emerald-default transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : searchResults.length === 0 && !searching ? (
                  <p className="text-sm text-ink-soft">
                    No matches for “{searchQuery}”. Try a broader term.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-[45vh] overflow-y-auto">
                    {searchResults.map((prod) => (
                      <Link
                        key={prod.id}
                        to={`/product/${prod.slug}`}
                        onClick={closeSearch}
                        className="flex items-center gap-4 p-2.5 hover:bg-emerald-subtle transition-colors"
                      >
                        <img
                          src={prod.images?.[0]?.url}
                          alt=""
                          className="w-14 h-14 object-cover border border-line shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="type-eyebrow text-ink-faint">{prod.categoryName}</p>
                          <p className="text-sm text-ink truncate">{prod.name}</p>
                        </div>
                        <span className="type-price text-sm text-ink shrink-0">
                          {formatPrice(prod.effectivePrice)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fadeIn" onClick={closeMobileMenu} />

          <div className="relative w-[86%] max-w-sm h-full bg-white flex flex-col animate-riseIn">
            <div className="flex justify-between items-center px-5 h-[72px] border-b border-line shrink-0">
              <button onClick={closeMobileMenu} className="p-1 -ml-1 text-ink" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={() => { closeMobileMenu(); navigate(user ? '/account' : '/login'); }}
                className="flex items-center gap-2 text-sm text-emerald-default"
              >
                <User className="w-4 h-4" />
                {user ? displayName : 'Sign in'}
              </button>
            </div>

            {/* Search entry, so the drawer is a full navigation surface */}
            <div className="px-5 py-4 border-b border-line shrink-0">
              <button
                onClick={() => { closeMobileMenu(); setIsSearchOpen(true); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 border border-line text-sm text-ink-faint hover:border-emerald-default transition-colors"
              >
                <Search className="w-4 h-4" />
                Search the collection
              </button>
            </div>

            {/* Categories collapse by default so the whole menu fits one screen */}
            <nav className="flex-1 overflow-y-auto px-5">
              {categories.map((cat) => {
                const isOpen = openMobileCategory === cat.id;
                return (
                  <div key={cat.id} className="border-b border-line">
                    <div className="flex items-stretch">
                      <Link
                        to={`/category/${cat.slug}`}
                        onClick={closeMobileMenu}
                        className="flex-1 py-4 text-[11px] uppercase tracking-[0.16em] text-ink"
                      >
                        {cat.name}
                      </Link>

                      {cat.subcategories.length > 0 && (
                        <button
                          onClick={() => setOpenMobileCategory(isOpen ? null : cat.id)}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${cat.name}`}
                          className="px-2 -mr-2 text-ink-faint hover:text-emerald-default transition-colors"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {isOpen && (
                      <ul className="pb-3 animate-fadeIn">
                        {cat.subcategories.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              to={`/category/${cat.slug}/${sub.slug}`}
                              onClick={closeMobileMenu}
                              className="flex items-center justify-between py-2.5 pl-3 border-l border-line text-sm text-ink-soft hover:text-emerald-default hover:border-emerald-default transition-colors"
                            >
                              {sub.name}
                              <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link
                            to={`/category/${cat.slug}`}
                            onClick={closeMobileMenu}
                            className="flex items-center gap-1.5 py-2.5 pl-3 border-l border-line text-sm text-emerald-default"
                          >
                            View all {cat.name} <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </li>
                      </ul>
                    )}
                  </div>
                );
              })}

              {[
                { to: '/gifting-concierge', label: 'Bespoke Gifting' },
                { to: '/about', label: 'Our Story' },
                { to: '/wishlist', label: 'Wishlist' },
                { to: user ? '/account' : '/login', label: user ? 'Your Orders' : 'Sign In' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className="block py-4 border-b border-line text-[11px] uppercase tracking-[0.16em] text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="px-5 py-4 border-t border-line space-y-2 shrink-0 text-sm text-ink-soft">
              <p>7-day plant health guarantee</p>
              <p>Complimentary shipping above ₹1,999</p>
              <a
                href={COMPANY.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-emerald-default link-underline w-fit pt-1"
              >
                Contact concierge
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
