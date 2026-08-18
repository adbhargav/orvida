import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Leaf, Award, ShieldCheck, Sparkles, Star } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';
import { api } from '../services/api';

const ASSURANCES = [
  { icon: Award, label: 'Acclimatised specimens' },
  { icon: ShieldCheck, label: '7-day health guarantee' },
  { icon: Leaf, label: 'Organic perlite soil mix' },
  { icon: Sparkles, label: 'Artisan Bastar craft' },
];

function SectionHeading({ eyebrow, title, href, linkLabel = 'View all' }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8 sm:mb-10">
      <div className="space-y-2">
        <span className="type-eyebrow text-emerald-default block">{eyebrow}</span>
        <h2 className="type-heading text-2xl sm:text-[2rem] text-ink">{title}</h2>
      </div>
      {href && (
        <Link
          to={href}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-emerald-default transition-colors shrink-0 link-underline"
        >
          {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [slides, setSlides] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ready, setReady] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Everything on this page comes from the API. There is deliberately no
  // bundled sample catalogue to fall back on: if a request fails the section
  // stays empty, so a broken store never masquerades as a healthy one.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [prodRes, catRes, bannerRes, reviewRes] = await Promise.allSettled([
        api.products.getAll({ limit: 24 }),
        api.categories.getAll(),
        api.banners.getAll(),
        api.reviews.getRecent(3),
      ]);

      if (cancelled) return;

      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.products || []);

      if (catRes.status === 'fulfilled') {
        // The collection rail is built from real subcategories and their own
        // imagery, rather than a hard-coded list of stock photographs.
        const rail = (catRes.value.categories || []).flatMap((cat) =>
          (cat.subcategories || [])
            .filter((sub) => sub.image)
            .map((sub) => ({
              key: `${cat.slug}-${sub.slug}`,
              name: sub.name,
              image: sub.image,
              link: `/category/${cat.slug}/${sub.slug}`,
            }))
        );
        setCollections(rail.slice(0, 6));
      }

      if (bannerRes.status === 'fulfilled') {
        setSlides(
          (bannerRes.value.banners || []).map((b) => ({
            id: b.id,
            image: b.image,
            link: b.link || '/category/plants',
            title: b.title,
          }))
        );
      }

      if (reviewRes.status === 'fulfilled') setReviews(reviewRes.value.reviews || []);

      setReady(true);
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setCurrentSlide((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = useCallback(
    (delta) => setCurrentSlide((i) => (i + delta + slides.length) % slides.length),
    [slides.length]
  );

  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);

  return (
    <div className="bg-canvas">
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}

      {/* Hero — the aspect box reserves its height so nothing shifts when the
          banner arrives, which removes the need for a loading placeholder. */}
      {slides.length > 0 && (
        <section className="relative group bg-cream-warm" aria-label="Featured collections">
          <div className="relative w-full aspect-[16/9] sm:aspect-[1024/323] overflow-hidden">
            {slides.map((slide, idx) => (
              <Link
                key={slide.id}
                to={slide.link}
                aria-hidden={idx !== currentSlide}
                tabIndex={idx === currentSlide ? 0 : -1}
                className={`absolute inset-0 block transition-opacity duration-[1200ms] ease-out ${
                  idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title || ''}
                  className="w-full h-full object-cover"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              </Link>
            ))}

            {slides.length > 1 && (
              <>
                <button
                  onClick={() => goToSlide(-1)}
                  aria-label="Previous slide"
                  className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/85 hover:bg-white text-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToSlide(1)}
                  aria-label="Next slide"
                  className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/85 hover:bg-white text-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      aria-current={currentSlide === idx}
                      className={`h-[3px] transition-all duration-500 ${
                        currentSlide === idx ? 'w-10 bg-emerald-default' : 'w-5 bg-white/80 hover:bg-white'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Assurances — static site copy, always safe to render immediately */}
      <section className="border-b border-line bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-4 divide-x divide-line">
          {ASSURANCES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-2.5 py-5 px-3 text-center">
              <Icon className="w-4 h-4 text-emerald-default shrink-0" />
              <span className="text-xs sm:text-sm text-ink-soft">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {collections.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-20 animate-fadeIn">
          <SectionHeading eyebrow="Shop by collection" title="Explore the catalogue" href="/category/plants" />

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6">
            {collections.map((cat) => (
              <Link key={cat.key} to={cat.link} className="group text-center">
                <div className="aspect-square rounded-full overflow-hidden border border-line group-hover:border-emerald-default transition-colors duration-300 mb-3">
                  <img
                    src={cat.image}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[900ms] ease-out"
                  />
                </div>
                <span className="text-xs sm:text-sm text-ink-soft group-hover:text-emerald-default transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {bestsellers.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 pb-16 sm:pb-20 animate-fadeIn">
          <SectionHeading eyebrow="Most coveted" title="Bestselling specimens" href="/category/plants" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Brand narrative */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-6 lg:pr-10">
            <span className="type-eyebrow text-emerald-default block">Ancestral craft, botanical mastery</span>
            <h2 className="type-display text-3xl sm:text-[2.75rem] text-ink">
              Where botanical passion meets{' '}
              <span className="italic text-emerald-default">uncompromising luxury</span>
            </h2>

            <div className="space-y-4 text-ink-soft leading-relaxed max-w-prose">
              <p>
                At ORIVIDA we believe true luxury is organic, enduring and deeply connected to nature. Our
                botanists hand-nurture every variegated Monstera and Sansevieria for more than eighteen months in
                organic soil blends before it reaches your home.
              </p>
              <p>
                Our arts collection honours Chhattisgarh's four-thousand-year-old Bastar bell metal tradition and
                Jaipur's ceramic artists — planters and sculptures made to be inherited.
              </p>
            </div>

            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.16em] transition-colors duration-200"
            >
              Read our story <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="hidden lg:block">
            <div className="aspect-[4/3] bg-emerald-subtle" aria-hidden="true" />
          </div>
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 pb-16 sm:pb-20 animate-fadeIn">
          <SectionHeading eyebrow="Fresh from the atelier" title="New arrivals" href="/category/plants" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Empty catalogue — an honest message rather than sample products */}
      {ready && products.length === 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-24 text-center space-y-3">
          <h2 className="type-heading text-2xl text-ink">The collection is being prepared</h2>
          <p className="text-sm text-ink-soft max-w-md mx-auto">
            New pieces are arriving shortly. Please check back soon, or contact our concierge for a private preview.
          </p>
          <Link to="/gifting-concierge" className="inline-block text-sm text-emerald-default link-underline">
            Speak to the concierge
          </Link>
        </section>
      )}

      {/* Gifting concierge */}
      <section className="bg-emerald-default text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-20 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7 space-y-5">
            <span className="type-eyebrow text-gold-light block">Bespoke service</span>
            <h2 className="type-display text-3xl sm:text-[2.5rem]">Corporate &amp; private gifting concierge</h2>
            <p className="text-emerald-light/85 leading-relaxed max-w-xl">
              Wedding favours, corporate hamper programmes, VIP client appreciation. Our concierge designs tailored
              plant hampers finished with gold-embossed brand plaques.
            </p>
            <Link
              to="/gifting-concierge"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-emerald-deep hover:bg-emerald-light text-[11px] uppercase tracking-[0.16em] transition-colors duration-200"
            >
              Request a proposal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials — only real, approved customer reviews. The section is
          omitted entirely until genuine ones exist. */}
      {reviews.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-20 sm:py-24 animate-fadeIn">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="type-eyebrow text-emerald-default block">Client acclaim</span>
            <h2 className="type-heading text-2xl sm:text-[2rem] text-ink">What our customers say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
            {reviews.map((review) => (
              <figure key={review.id} className="space-y-4">
                <div className="flex gap-0.5 text-gold-default" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                {review.title && (
                  <blockquote className="type-heading text-lg text-ink leading-snug">{review.title}</blockquote>
                )}
                <p className="text-sm text-ink-soft leading-relaxed">{review.comment}</p>

                <figcaption className="pt-3 border-t border-line space-y-0.5">
                  <p className="text-sm text-ink">{review.user_name}</p>
                  {review.verified_purchase && (
                    <p className="type-eyebrow text-ink-faint">Verified purchase</p>
                  )}
                  {review.product_slug && (
                    <Link
                      to={`/product/${review.product_slug}`}
                      className="inline-block text-xs text-emerald-default link-underline"
                    >
                      {review.product_name}
                    </Link>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
