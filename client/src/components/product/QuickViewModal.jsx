import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Check, Star, ArrowRight, Minus, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const variantDelta = selectedVariant?.priceDelta || 0;
  const currentPrice = (product.effectivePrice ?? product.price) + variantDelta;
  const originalPrice = product.price + variantDelta;
  const hasDiscount = Boolean(product.discountPrice);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
    setAdded(true);
    setTimeout(onClose, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view: ${product.name}`}
    >
      <div
        className="bg-white border border-line max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-overlay animate-riseIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Image */}
          <div className="relative bg-emerald-subtle">
            <div className="aspect-square sm:aspect-auto sm:h-full">
              <img
                src={product.images?.[activeImage]?.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images?.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {product.images.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    aria-label={`Image ${idx + 1}`}
                    className={`h-[3px] transition-all duration-300 ${
                      activeImage === idx ? 'w-7 bg-emerald-default' : 'w-4 bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col">
            <div className="flex justify-between items-start gap-4 mb-4">
              <span className="type-eyebrow text-ink-faint">
                {[product.categoryName, product.subcategoryName].filter(Boolean).join(' · ')}
              </span>
              <button
                onClick={onClose}
                className="p-1 -mr-1 -mt-1 text-ink-faint hover:text-ink transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="type-heading text-2xl text-ink mb-3">{product.name}</h2>

            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 text-sm mb-4">
                <span className="flex gap-0.5 text-gold-default" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.round(product.avgRating) ? 'fill-current' : ''}`} />
                  ))}
                </span>
                <span className="text-ink-soft tabular">
                  {product.avgRating.toFixed(1)} · {product.reviewCount} reviews
                </span>
              </div>
            )}

            <div className="flex items-baseline gap-2.5 pb-5 mb-5 border-b border-line">
              <span className="type-price text-2xl text-ink">{formatPrice(currentPrice)}</span>
              {hasDiscount && (
                <span className="text-sm text-ink-faint line-through tabular">{formatPrice(originalPrice)}</span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-sm text-ink-soft leading-relaxed mb-5 line-clamp-3">
                {product.shortDescription}
              </p>
            )}

            {product.variants?.length > 0 && (
              <div className="space-y-2.5 mb-5">
                <span className="type-eyebrow text-ink-soft block">Options</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-2 border text-sm transition-colors ${
                        selectedVariant?.id === v.id
                          ? 'border-ink bg-ink text-white'
                          : 'border-line text-ink-soft hover:border-ink hover:text-ink'
                      }`}
                    >
                      {v.value}
                      {v.priceDelta > 0 && <span className="ml-1 tabular opacity-70">+{formatPrice(v.priceDelta)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto space-y-3">
              <div className="flex gap-3">
                <div className="flex items-center border border-line shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-3 text-ink-soft hover:text-emerald-default transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-1.5 text-sm text-ink tabular min-w-[1.75rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    className="px-3 py-3 text-ink-soft hover:text-emerald-default transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 text-[11px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors ${
                    isOutOfStock
                      ? 'bg-line text-ink-faint cursor-not-allowed'
                      : added
                      ? 'bg-emerald-deep text-white'
                      : 'bg-emerald-default hover:bg-emerald-deep text-white'
                  }`}
                >
                  {isOutOfStock ? 'Sold out' : added ? <><Check className="w-3.5 h-3.5" /> Added</> : 'Add to cart'}
                </button>
              </div>

              <Link
                to={`/product/${product.slug}`}
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 py-2 text-sm text-ink-soft hover:text-emerald-default transition-colors"
              >
                View full details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
