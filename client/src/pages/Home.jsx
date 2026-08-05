import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Star, Leaf, Award, ShieldCheck, Heart, ChevronLeft, ChevronRight, Gift, Eye } from 'lucide-react';
import { PRODUCTS, CATEGORIES, BRAND_STATS, REVIEWS } from '../data/mockData';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';

export default function Home() {
  const navigate = useNavigate();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const bestsellers = PRODUCTS.filter(p => p.isBestseller);
  const newArrivals = PRODUCTS.filter(p => p.isNew);
  const rarePick = PRODUCTS.find(p => p.id === 1);

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      
      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}

      {/* Hero Section */}
      <section className="relative min-h-[80vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#062319]">
        {/* Background Image with Emerald Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=2000&q=80"
            alt="ORIVIDA Luxury Nursery"
            className="w-full h-full object-cover scale-105 filter brightness-75 animate-pulse"
            style={{ animationDuration: '10s' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A3324]/95 via-[#0B3D2E]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B3D2E] via-transparent to-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className="lg:col-span-8 space-y-5 sm:space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A3324]/90 border border-[#C9972B] backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#F0D585]" />
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-[#F0D585]">
                Botanical Fine Jewelry & Rare Flora
              </span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-white leading-tight">
              Elevate Your Haven with <br />
              <span className="text-gold-gradient italic font-serif">Living Splendor</span>
            </h1>

            <p className="text-xs sm:text-base text-[#F7F5EF]/90 max-w-2xl leading-relaxed font-body">
              Hand-nurtured variegated botanicals, bespoke gifting hampers, and heritage Bastar bell metal artistry. Designed for individuals who view living plants as fine art.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
              <Link
                to="/category/plants"
                className="bg-gold-gradient hover:bg-gold-gradient-hover text-[#0A3324] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-xs sm:text-sm tracking-widest shadow-2xl hover:scale-105 transition duration-300 flex items-center gap-2"
              >
                <span>EXPLORE BOTANICALS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                to="/gifting-concierge"
                className="glass-emerald text-[#F0D585] border border-[#C9972B] hover:bg-[#0A3324] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-xs sm:text-sm tracking-widest transition duration-300 flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                <span>BESPOKE GIFTING</span>
              </Link>
            </div>

            {/* Quick Trust Badges */}
            <div className="pt-6 border-t border-[#8A6A16]/30 flex flex-wrap gap-4 sm:gap-6 text-[11px] sm:text-xs text-[#F7F5EF]/80">
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-[#F0D585]" /> 100% Organic Certified Nurseries</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#F0D585]" /> 7-Day Live Plant Guarantee</span>
            </div>
          </div>

          {/* Featured Hero Product Card */}
          {rarePick && (
            <div className="lg:col-span-4 hidden lg:block">
              <div className="glass-dark p-6 rounded-3xl border border-[#C9972B] shadow-2xl space-y-4 transform hover:scale-[1.02] transition duration-500">
                <div className="relative aspect-square rounded-2xl overflow-hidden">
                  <img src={rarePick.images[0].url} alt={rarePick.name} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#0A3324]/90 text-[#F0D585] text-[10px] font-bold tracking-wider border border-[#C9972B]">
                    RARE SPECIMEN OF THE MONTH
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#F0D585]">{rarePick.subcategoryName}</span>
                  <h3 className="font-display font-bold text-base text-white">{rarePick.name}</h3>
                  <div className="flex justify-between items-center mt-3">
                    <span className="font-serif font-bold text-xl text-[#F0D585]">₹{rarePick.discountPrice.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => setQuickViewProduct(rarePick)}
                      className="bg-gold-gradient text-[#0A3324] px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Brand Ticker */}
      <section className="bg-[#0A3324] py-6 border-y border-[#8A6A16]/30">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {BRAND_STATS.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <p className="font-display font-extrabold text-xl sm:text-3xl text-gold-gradient">{stat.value}</p>
              <p className="text-[10px] sm:text-xs uppercase font-medium tracking-wider text-[#F7F5EF]/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category Grid Section - 2 columns on mobile */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 sm:gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#F0D585]">Curated Ecosystems</span>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white">Explore Categories</h2>
          </div>
          <p className="text-xs text-[#F7F5EF]/70 max-w-md">
            From rare variegated foliage to hand-cast bell metal sculptures, each pillar is curated for luxury living.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#8A6A16]/40 hover:border-[#F0D585] shadow-xl aspect-[3/4] flex flex-col justify-end p-4 sm:p-6 transition duration-500 transform hover:-translate-y-1"
            >
              <img
                src={cat.banner}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700 filter brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#062319] via-[#0B3D2E]/40 to-transparent" />
              
              <div className="relative z-10 space-y-1.5">
                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-[#F0D585] bg-[#0A3324]/80 px-2 py-0.5 rounded-full border border-[#8A6A16] inline-block">
                  {cat.subcategories.length} Subcategories
                </span>
                <h3 className="font-display font-bold text-base sm:text-2xl text-white group-hover:text-[#F0D585] transition leading-snug">{cat.name}</h3>
                <p className="hidden sm:block text-xs text-[#F7F5EF]/80 line-clamp-2">{cat.tagline}</p>
                <div className="pt-1 flex items-center gap-1 text-[10px] sm:text-xs font-bold text-[#F0D585] group-hover:translate-x-1 transition">
                  <span>Browse</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Horizontal Rail: Bestsellers - 2 columns on mobile */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-[#8A6A16]/30 pb-3">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#F0D585]">Most Coveted</span>
            <h2 className="font-display font-extrabold text-xl sm:text-3xl text-white">ORIVIDA Bestsellers</h2>
          </div>
          <Link to="/category/plants" className="text-xs text-[#F0D585] hover:underline font-semibold flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {bestsellers.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* Brand Narrative Section ("Our Passion, UR Luxury") */}
      <section className="relative overflow-hidden bg-[#0A3324] py-16 sm:py-20 border-y border-[#8A6A16]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          
          <div className="space-y-5 sm:space-y-6">
            <span className="text-xs uppercase font-bold tracking-widest text-[#F0D585]">Ancestral Craftsmanship & Botanical Mastery</span>
            <h2 className="font-serif text-2xl sm:text-4xl text-white leading-tight">
              Where Botanical Passion Meets <br />
              <span className="text-gold-gradient italic">Uncompromising Luxury</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#F7F5EF]/80 leading-relaxed font-body">
              At ORIVIDA, we believe true luxury is organic, enduring, and deeply connected to nature. Our nursery botanists hand-nurture every variegated Monstera and Sansevieria for over 18 months in organic soil blends before they reach your residence.
            </p>

            <p className="text-xs sm:text-sm text-[#F7F5EF]/80 leading-relaxed font-body">
              Simultaneously, our Arts collection honors Chhattisgarh's 4,000-year-old Bastar bell metal metalworkers and Jaipur ceramic artists — crafting planters and sculptures that double as heirloom investment pieces.
            </p>

            <div className="pt-2 flex gap-4">
              <Link
                to="/about"
                className="bg-gold-gradient text-[#0A3324] px-6 py-3 rounded-full font-bold text-xs tracking-wider hover:scale-105 transition"
              >
                READ OUR FULL STORY
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#C9972B] shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80"
                alt="Craftsmanship Story"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 glass-dark p-4 rounded-2xl border border-[#C9972B] max-w-xs shadow-xl hidden sm:block">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-[#F0D585]" />
                <div>
                  <h5 className="font-semibold text-xs text-white">4,000-Year Heritage Process</h5>
                  <p className="text-[10px] text-[#F7F5EF]/70">Lost-Wax Dhokra Metal Casting</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Horizontal Rail: New Arrivals - 2 columns on mobile */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-[#8A6A16]/30 pb-3">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#F0D585]">Fresh From Atelier</span>
            <h2 className="font-display font-extrabold text-xl sm:text-3xl text-white">New Botanical Arrivals</h2>
          </div>
          <Link to="/category/plants" className="text-xs text-[#F0D585] hover:underline font-semibold flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {newArrivals.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* Bespoke Gifting Concierge Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#C9972B] bg-[#0A3324] p-6 sm:p-12 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-2xl">
          <div className="md:col-span-8 space-y-3 sm:space-y-4">
            <span className="px-3 py-1 rounded-full bg-[#8A6A16] text-white text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">
              Bespoke Service
            </span>
            <h2 className="font-display font-bold text-xl sm:text-3xl text-white">
              Corporate & Private Gifting Concierge
            </h2>
            <p className="text-xs sm:text-sm text-[#F7F5EF]/80 max-w-xl leading-relaxed">
              Planning wedding favors, luxury corporate hamper distributions, or VIP client appreciation gifts? Our concierge designs tailored plant hampers with gold-embossed brand plaques.
            </p>
            <div className="pt-2">
              <Link
                to="/gifting-concierge"
                className="bg-gold-gradient text-[#0A3324] px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-xs tracking-wider inline-flex items-center gap-2 shadow-lg hover:scale-105 transition"
              >
                <span>REQUEST PROPOSAL</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center hidden sm:flex">
            <img
              src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80"
              alt="Gifting Trunk"
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover border-2 border-[#F0D585] shadow-xl rotate-2"
            />
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs uppercase font-bold tracking-widest text-[#F0D585]">Client Acclaim</span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Loved by Botanical Connoisseurs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {REVIEWS.map(rev => (
            <div key={rev.id} className="glass-dark p-5 sm:p-6 rounded-2xl border border-[#8A6A16]/30 space-y-3">
              <div className="flex text-[#C9972B]">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9972B]" />
                ))}
              </div>
              <h4 className="font-display font-semibold text-xs sm:text-sm text-white">{rev.title}</h4>
              <p className="text-xs text-[#F7F5EF]/80 italic leading-relaxed">"{rev.comment}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-[#8A6A16]/20">
                <img src={rev.userAvatar} alt={rev.userName} className="w-8 h-8 rounded-full object-cover border border-[#F0D585]" />
                <div>
                  <p className="text-xs font-bold text-white">{rev.userName}</p>
                  <p className="text-[10px] text-[#F0D585]">Verified Luxury Purchaser</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
