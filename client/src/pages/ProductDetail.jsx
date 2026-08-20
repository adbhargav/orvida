import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import useRedirectFallback from '../hooks/useRedirectFallback';
import { useSeoSettings } from '../context/SeoContext';
import { generateProductMetadata, getImageAlt } from '../lib/seo';
import {
  Heart, Check, ShieldCheck, Truck, ChevronRight, ChevronDown, Minus, Plus,
  Loader2, MapPin, Star,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/product/ProductCard';
import { api } from '../services/api';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

// Metro pincodes served by the express nursery network.
const SERVICED_PREFIXES = ['11', '12', '20', '38', '40', '41', '50', '56', '60', '70', '80'];

function Accordion({ id, title, children, openId, setOpenId }) {
  const isOpen = openId === id;
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpenId(isOpen ? null : id)}
        aria-expanded={isOpen}
        className="w-full py-4 flex justify-between items-center text-left text-sm text-ink hover:text-emerald-default transition-colors"
      >
        <span className="type-eyebrow">{title}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-5 text-sm text-ink-soft leading-relaxed whitespace-pre-line animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const seoSettings = useSeoSettings();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState('description');
  const [addedSuccess, setAddedSuccess] = useState(false);

  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.products.getBySlug(slug);
      const found = res.product;
      setProduct(found);
      setSelectedVariant(found.variants?.[0] || null);
      setActiveImage(0);
      setQuantity(1);

      if (found.categorySlug) {
        const rel = await api.products.getAll({ category: found.categorySlug, limit: 5 });
        setRelated((rel.products || []).filter((p) => p.id !== found.id).slice(0, 4));
      }
    } catch (err) {
      setError(err.status === 404 ? 'notfound' : err.message || 'Could not load this product.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProduct();
  }, [loadProduct]);

  const handlePincodeCheck = (event) => {
    event.preventDefault();
    const clean = pincode.replace(/\D/g, '');
    if (clean.length !== 6) {
      setPincodeStatus({ ok: false, message: 'Please enter a valid 6-digit pincode.' });
      return;
    }
    const serviced = SERVICED_PREFIXES.some((p) => clean.startsWith(p));
    setPincodeStatus(
      serviced
        ? { ok: true, message: 'Delivers in 2–3 business days with white-glove nursery express.' }
        : { ok: false, message: 'Not yet on the express network. Standard dispatch takes 5–7 days.' }
    );
  };

  // A renamed slug should follow its 301 rather than dead-end.
  const redirecting = useRedirectFallback(Boolean(error === 'notfound'));

  // Metadata resolves admin overrides → product content → global defaults
  // in lib/seo, so this page stays declarative.
  usePageMeta(generateProductMetadata(product, seoSettings));

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedVariant, quantity);
    navigate('/checkout');
  };

  if (loading || redirecting) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-ink-soft">
        <Loader2 className="w-5 h-5 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="type-heading text-2xl text-ink">
          {error === 'notfound' ? 'This piece is no longer available' : 'Something went wrong'}
        </p>
        <p className="text-sm text-ink-soft max-w-md">
          {error === 'notfound'
            ? 'It may have sold out or been retired from the collection.'
            : error}
        </p>
        <Link
          to="/category/plants"
          className="px-7 py-3 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  const isLiked = isInWishlist(product.id);
  const variantDelta = selectedVariant?.priceDelta || 0;
  const currentPrice = (product.effectivePrice ?? product.price) + variantDelta;
  const originalPrice = product.price + variantDelta;
  const hasDiscount = Boolean(product.discountPrice);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="bg-canvas pb-28 lg:pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-soft mb-8 overflow-hidden">
          <Link to="/" className="hover:text-emerald-default transition-colors shrink-0">Home</Link>
          <ChevronRight className="w-3 h-3 text-ink-faint shrink-0" />
          <Link to={`/category/${product.categorySlug}`} className="hover:text-emerald-default transition-colors shrink-0">
            {product.categoryName}
          </Link>
          <ChevronRight className="w-3 h-3 text-ink-faint shrink-0" />
          <span className="text-ink truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Gallery */}
          <div className="lg:col-span-7 lg:sticky lg:top-28">
            <div className="flex flex-col-reverse md:flex-row gap-4">
              {product.images.length > 1 && (
                <div className="flex md:flex-col gap-3 overflow-x-auto scrollbar-none shrink-0">
                  {product.images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setActiveImage(idx)}
                      aria-label={`View image ${idx + 1}`}
                      aria-current={activeImage === idx}
                      className={`w-16 h-20 md:w-20 md:h-24 overflow-hidden border transition-colors shrink-0 ${
                        activeImage === idx ? 'border-ink' : 'border-line hover:border-line-strong'
                      }`}
                    >
                      <img src={img.url} alt={getImageAlt(product, idx)} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

              <div className="relative flex-1 aspect-[4/5] overflow-hidden bg-emerald-subtle border border-line">
                {/* The hero image is this route's LCP element, so it is
                    fetched eagerly and carries explicit dimensions. */}
                <img
                  src={product.images[activeImage]?.url}
                  alt={getImageAlt(product, activeImage)}
                  width="800"
                  height="1000"
                  fetchPriority="high"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`absolute top-4 right-4 p-2.5 rounded-full transition-colors ${
                    isLiked ? 'bg-emerald-default text-white' : 'bg-white/90 text-ink-soft hover:text-emerald-default'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="type-eyebrow text-ink-faint block">
                {[product.categoryName, product.subcategoryName].filter(Boolean).join(' · ')}
              </span>

              <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">{product.name}</h1>

              {product.reviewCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex gap-0.5 text-gold-default" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.avgRating) ? 'fill-current' : ''}`} />
                    ))}
                  </span>
                  <span className="text-ink-soft tabular">
                    {product.avgRating.toFixed(1)} · {product.reviewCount} reviews
                  </span>
                </div>
              )}

              {product.shortDescription && (
                <p className="text-ink-soft leading-relaxed pt-1">{product.shortDescription}</p>
              )}
            </div>

            <div className="flex items-baseline gap-3 pb-6 border-b border-line">
              <span className="type-price text-3xl text-ink">{formatPrice(currentPrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-base text-ink-faint line-through tabular">{formatPrice(originalPrice)}</span>
                  <span className="text-sm text-emerald-default">
                    Save {formatPrice(originalPrice - currentPrice)}
                  </span>
                </>
              )}
            </div>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="space-y-3">
                <span className="type-eyebrow text-ink-soft block">Size &amp; planter finish</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2.5 border text-sm transition-colors ${
                        selectedVariant?.id === v.id
                          ? 'border-ink bg-ink text-white'
                          : 'border-line text-ink-soft hover:border-ink hover:text-ink'
                      }`}
                    >
                      {v.value}
                      {v.priceDelta > 0 && <span className="ml-1.5 tabular opacity-70">+{formatPrice(v.priceDelta)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            {isOutOfStock ? (
              <p className="text-sm text-rose-600">Currently sold out — check back soon.</p>
            ) : isLowStock ? (
              <p className="text-sm text-amber-700">Only {product.stock} left in the nursery.</p>
            ) : null}

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex items-center border border-line shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-3.5 text-ink-soft hover:text-emerald-default transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-sm text-ink tabular min-w-[2rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    className="px-3.5 py-3.5 text-ink-soft hover:text-emerald-default transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3.5 px-6 text-[11px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors ${
                    isOutOfStock
                      ? 'bg-line text-ink-faint cursor-not-allowed'
                      : addedSuccess
                      ? 'bg-emerald-deep text-white'
                      : 'bg-emerald-default hover:bg-emerald-deep text-white'
                  }`}
                >
                  {isOutOfStock ? 'Sold out' : addedSuccess ? (
                    <><Check className="w-3.5 h-3.5" /> Added to cart</>
                  ) : (
                    <>Add to cart — {formatPrice(currentPrice * quantity)}</>
                  )}
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full py-3.5 border border-ink text-ink hover:bg-ink hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink text-[11px] uppercase tracking-[0.16em] transition-colors"
              >
                Buy it now
              </button>
            </div>

            {/* Pincode */}
            <div className="space-y-2.5 py-6 border-y border-line">
              <label htmlFor="pincode" className="type-eyebrow text-ink-soft flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Check delivery
              </label>
              <form onSubmit={handlePincodeCheck} className="flex gap-2">
                <input
                  id="pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value); setPincodeStatus(null); }}
                  placeholder="6-digit pincode"
                  className="flex-1 px-3.5 py-2.5 border border-line bg-white text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-emerald-default transition-colors tabular"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.14em] transition-colors"
                >
                  Check
                </button>
              </form>
              {pincodeStatus && (
                <p className={`text-sm ${pincodeStatus.ok ? 'text-emerald-default' : 'text-ink-soft'}`}>
                  {pincodeStatus.message}
                </p>
              )}
            </div>

            {/* Assurances */}
            <div className="grid grid-cols-2 gap-4 text-sm text-ink-soft">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-emerald-default shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>Temperature-controlled express transport</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-default shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>7-day live health guarantee</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="border-t border-line">
              {product.description && (
                <Accordion id="description" title="Description" openId={openAccordion} setOpenId={setOpenAccordion}>
                  {product.description}
                </Accordion>
              )}
              <Accordion id="care" title="Care instructions" openId={openAccordion} setOpenId={setOpenAccordion}>
                {product.careInstructions ||
                  'Water when the topsoil feels dry to a depth of two centimetres. Keep in bright, indirect light and rotate monthly for even growth.'}
              </Accordion>
              {product.craftsmanshipStory && (
                <Accordion id="craft" title="Origin & craftsmanship" openId={openAccordion} setOpenId={setOpenAccordion}>
                  {product.craftsmanshipStory}
                </Accordion>
              )}
              <Accordion id="shipping" title="Shipping & returns" openId={openAccordion} setOpenId={setOpenAccordion}>
                Complimentary express shipping on orders above ₹1,999. Live plants carry a 7-day replacement
                guarantee from the date of delivery. Artisan pieces may be returned within 7 days if unused and in
                original packaging.
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 pt-20 sm:pt-28">
          <div className="mb-8 space-y-2">
            <span className="type-eyebrow text-emerald-default block">You may also like</span>
            <h2 className="type-heading text-2xl sm:text-[2rem] text-ink">More from {product.categoryName}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line px-4 py-3 z-40 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-ink-soft truncate">{product.name}</p>
          <p className="type-price text-lg text-ink">{formatPrice(currentPrice * quantity)}</p>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="px-6 py-3 bg-emerald-default disabled:bg-line disabled:text-ink-faint text-white text-[11px] uppercase tracking-[0.16em] shrink-0 transition-colors"
        >
          {isOutOfStock ? 'Sold out' : addedSuccess ? 'Added' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
