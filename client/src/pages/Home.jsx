import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Star, Leaf, Award, ShieldCheck, Heart, ChevronLeft, ChevronRight, Gift, Eye } from 'lucide-react';
import { PRODUCTS, CATEGORIES, BRAND_STATS, REVIEWS } from '../data/mockData';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';
import heroBanner1 from '../assets/hero-banner-1.png';
import heroBanner2 from '../assets/hero-banner-2.png';

export default function Home() {
  const navigate = useNavigate();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const bestsellers = PRODUCTS.filter(p => p.isBestseller);
  const newArrivals = PRODUCTS.filter(p => p.isNew);
  const rarePick = PRODUCTS.find(p => p.id === 1);

  const heroSlides = [
    {
      id: 1,
      title: 'Add life to every room - Any 4 plants at ₹999/-',
      image: heroBanner1,
      link: '/category/plants',
      alt: 'Any 4 plants at ₹999/- Add life to every room'
    },
    {
      id: 2,
      title: 'Your space deserves more green - Up to 50% off extra 10% above ₹1999/-',
      image: heroBanner2,
      link: '/category/plants',
      alt: 'Your space deserves more green - Up to 50% off extra 10%'
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const featuredCategories = [
    {
      id: 1,
      name: 'Large Plants',
      link: '/category/plants/indoor-plants',
      bgColor: '#3B5998', // Muted Royal Blue
      image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 2,
      name: 'Medium Plants',
      link: '/category/plants/air-purifying-plants',
      bgColor: '#C05656', // Terracotta Red
      image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 3,
      name: 'Small Plants',
      link: '/category/plants/succulents-cacti',
      bgColor: '#8B5A3C', // Earth Brown
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 4,
      name: 'Ceramic Planters',
      link: '/category/arts-decor/pottery-ceramics',
      bgColor: '#6B7028', // Olive Green
      image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 5,
      name: 'Plant Stand',
      link: '/category/balcony-makeover/balcony-furniture-decor',
      bgColor: '#E6A119', // Warm Ochre Yellow
      image: 'https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 6,
      name: 'Gifting Hampers',
      link: '/category/gifting-solutions/plant-gift-hampers',
      bgColor: '#6B8E85', // Muted Sage Green
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-20 bg-[#FAF9F6]">
      
      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}

      {/* Hero Banner Carousel (Fitted to Exact Image Size & Aspect Ratio: 1024 x 323 -> 3.17:1 Ratio) */}
      <section className="relative w-full max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-6 pt-2 sm:pt-4 group">
        <div className="relative w-full aspect-[1024/323] overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 bg-[#F5F2EB]">
          
          {/* Banner Slides */}
          {heroSlides.map((slide, idx) => (
            <Link
              key={slide.id}
              to={slide.link}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out block ${
                idx === currentSlide ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="w-full h-full object-fill sm:object-cover transition-transform duration-700 hover:scale-[1.01]"
              />
            </Link>
          ))}

          {/* Carousel Navigation Arrows */}
          <button
            onClick={(e) => { e.preventDefault(); prevSlide(); }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3.5 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-gray-200"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-[#154734]" />
          </button>

          <button
            onClick={(e) => { e.preventDefault(); nextSlide(); }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3.5 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-gray-200"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-[#154734]" />
          </button>

          {/* Slide Indicator Dots Bar */}
          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.preventDefault(); setCurrentSlide(idx); }}
                className={`transition-all duration-300 ${
                  currentSlide === idx
                    ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-[#154734] rounded-full shadow-sm'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/70 hover:bg-white rounded-full'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Full-Width Luxury Botanical Marquee Ticker */}
      <section className="bg-[#154734] py-3.5 border-y border-[#0F3526] text-white overflow-hidden whitespace-nowrap shadow-md">
        <div className="animate-marquee flex items-center gap-12 font-display text-xs sm:text-sm font-bold uppercase tracking-widest">
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F0D585]" /> ANY 4 PLANTS AT ₹999/-
              </span>
              <span className="text-[#F0D585]">✦</span>
              <span className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-300" /> FREE EXPRESS NURSERY SHIPPING &gt; ₹1,999/-
              </span>
              <span className="text-[#F0D585]">✦</span>
              <span className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#F0D585]" /> UP TO 50% OFF + EXTRA 10% OFF ABOVE ₹1,999/-
              </span>
              <span className="text-[#F0D585]">✦</span>
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F0D585]" /> 100% REPLACEMENT HEALTH GUARANTEE
              </span>
              <span className="text-[#F0D585]">✦</span>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Trust Badges Strip Underneath Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs font-semibold text-slate-800">
          <div className="flex items-center justify-center gap-2.5 p-2">
            <Award className="w-5 h-5 text-[#154734]" />
            <span>100% Acclimatized Plants</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 p-2">
            <ShieldCheck className="w-5 h-5 text-[#154734]" />
            <span>7-Day Live Guarantee</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 p-2">
            <Leaf className="w-5 h-5 text-[#154734]" />
            <span>Organic Perlite Soil Mix</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 p-2">
            <Sparkles className="w-5 h-5 text-[#154734]" />
            <span>Artisan Bastar Craft</span>
          </div>
        </div>
      </div>

      {/* Brand Ticker */}
      <section className="bg-[#F0F5F2] py-6 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {BRAND_STATS.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <p className="font-display font-extrabold text-xl sm:text-3xl text-[#154734]">{stat.value}</p>
              <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kyari-Style Circular Floating Color Category Rail */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Shop By Category</span>
            <h2 className="font-display font-extrabold text-xl sm:text-3xl text-slate-900">Explore Collection</h2>
          </div>
          <Link to="/category/plants" className="text-xs text-[#154734] hover:underline font-bold flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Circular Category Row */}
        <div className="flex items-center justify-between gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-4 pt-2 scrollbar-none snap-x">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.link}
              className="flex flex-col items-center min-w-[105px] sm:min-w-[130px] md:min-w-[145px] group cursor-pointer text-center snap-center"
            >
              {/* Vibrant Colored Circle Container */}
              <div
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-md group-hover:shadow-xl border-4 border-white"
                style={{ backgroundColor: cat.bgColor }}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition duration-500"
                />
              </div>

              {/* Title Text Below */}
              <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-[#154734] mt-3 tracking-wide transition duration-200">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Horizontal Rail: Bestsellers - 2 columns on mobile */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-gray-200 pb-3">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Most Coveted</span>
            <h2 className="font-display font-extrabold text-xl sm:text-3xl text-slate-900">ORIVIDA Bestsellers</h2>
          </div>
          <Link to="/category/plants" className="text-xs text-[#154734] hover:underline font-bold flex items-center gap-1">
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
      <section className="relative overflow-hidden bg-[#F4F0E8] py-16 sm:py-20 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          
          <div className="space-y-5 sm:space-y-6">
            <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Ancestral Craftsmanship & Botanical Mastery</span>
            <h2 className="font-serif text-2xl sm:text-4xl text-slate-900 leading-tight">
              Where Botanical Passion Meets <br />
              <span className="text-[#154734] italic font-serif">Uncompromising Luxury</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-body">
              At ORIVIDA, we believe true luxury is organic, enduring, and deeply connected to nature. Our nursery botanists hand-nurture every variegated Monstera and Sansevieria for over 18 months in organic soil blends before they reach your residence.
            </p>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-body">
              Simultaneously, our Arts collection honors Chhattisgarh's 4,000-year-old Bastar bell metal metalworkers and Jaipur ceramic artists — crafting planters and sculptures that double as heirloom investment pieces.
            </p>

            <div className="pt-2 flex gap-4">
              <Link
                to="/about"
                className="bg-[#154734] hover:bg-[#0F3526] text-white px-6 py-3 rounded-full font-bold text-xs tracking-wider hover:scale-105 transition shadow-md"
              >
                READ OUR FULL STORY
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-gray-300 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80"
                alt="Craftsmanship Story"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-2xl border border-gray-200 max-w-xs shadow-xl hidden sm:block">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-[#154734]" />
                <div>
                  <h5 className="font-bold text-xs text-slate-900">4,000-Year Heritage Process</h5>
                  <p className="text-[10px] text-slate-500">Lost-Wax Dhokra Metal Casting</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Horizontal Rail: New Arrivals - 2 columns on mobile */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-gray-200 pb-3">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Fresh From Atelier</span>
            <h2 className="font-display font-extrabold text-xl sm:text-3xl text-slate-900">New Botanical Arrivals</h2>
          </div>
          <Link to="/category/plants" className="text-xs text-[#154734] hover:underline font-bold flex items-center gap-1">
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
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#154734]/30 bg-[#154734] p-6 sm:p-12 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-xl text-white">
          <div className="md:col-span-8 space-y-3 sm:space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">
              Bespoke Service
            </span>
            <h2 className="font-display font-bold text-xl sm:text-3xl text-white">
              Corporate & Private Gifting Concierge
            </h2>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
              Planning wedding favors, luxury corporate hamper distributions, or VIP client appreciation gifts? Our concierge designs tailored plant hampers with gold-embossed brand plaques.
            </p>
            <div className="pt-2">
              <Link
                to="/gifting-concierge"
                className="bg-white text-[#154734] px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-xs tracking-wider inline-flex items-center gap-2 shadow-lg hover:bg-gray-105 transition"
              >
                <span>REQUEST PROPOSAL</span>
                <ArrowRight className="w-4 h-4 text-[#154734]" />
              </Link>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center hidden sm:flex">
            <img
              src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80"
              alt="Gifting Trunk"
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover border-2 border-white/50 shadow-xl rotate-2"
            />
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Client Acclaim</span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">Loved by Botanical Connoisseurs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {REVIEWS.map(rev => (
            <div key={rev.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 space-y-3 shadow-sm">
              <div className="flex text-[#C9972B]">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9972B]" />
                ))}
              </div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900">{rev.title}</h4>
              <p className="text-xs text-slate-600 italic leading-relaxed">"{rev.comment}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <img src={rev.userAvatar} alt={rev.userName} className="w-8 h-8 rounded-full object-cover border border-[#154734]" />
                <div>
                  <p className="text-xs font-bold text-slate-900">{rev.userName}</p>
                  <p className="text-[10px] text-[#154734] font-semibold">Verified Luxury Purchaser</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
