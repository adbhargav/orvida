import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function ProductCard({ product, onQuickView }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [justAdded, setJustAdded] = useState(false);

  const isLiked = isInWishlist(product.id);
  // No stand-in photograph: a product without imagery shows a plain tile
  // rather than an unrelated stock image that misrepresents what is for sale.
  const primaryImg = product.images?.[0]?.url || null;
  const secondaryImg = product.images?.[1]?.url || null;

  const variantDelta = selectedVariant?.priceDelta || 0;
  const currentPrice = (product.effectivePrice ?? product.price) + variantDelta;
  const originalPrice = product.price + variantDelta;
  const hasDiscount = Boolean(product.discountPrice);
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const isOutOfStock = product.stock === 0;

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, selectedVariant, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const handleWishlistClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(product.id);
  };

  const swatches = product.variants?.filter((v) => v.type === 'pot_style' || v.type === 'color') || [];

  return (
    <article className="group relative flex flex-col h-full bg-white border border-line hover:border-line-strong transition-colors duration-300">
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-emerald-subtle">
        <Link to={`/product/${product.slug}`} className="block w-full h-full" tabIndex={-1} aria-hidden="true">
          {primaryImg && (
            <img
              src={primaryImg}
              alt={product.imageAltText || product.name}
              loading="lazy"
              width="600"
              height="750"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-[900ms] ease-out ${
                secondaryImg ? 'group-hover:opacity-0' : ''
              } group-hover:scale-[1.03]`}
            />
          )}
          {secondaryImg && (
            <img
              src={secondaryImg}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-[900ms] ease-out"
            />
          )}
        </Link>

        {/* Badges — at most one, so the corner stays quiet */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 bg-white/95 text-ink text-[10px] uppercase tracking-[0.14em]">
              Sold out
            </span>
          ) : product.isNew ? (
            <span className="px-2.5 py-1 bg-emerald-default text-white text-[10px] uppercase tracking-[0.14em]">
              New
            </span>
          ) : hasDiscount ? (
            <span className="px-2.5 py-1 bg-white/95 text-emerald-deep text-[10px] uppercase tracking-[0.14em]">
              {discountPercent}% off
            </span>
          ) : product.isBestseller ? (
            <span className="px-2.5 py-1 bg-white/95 text-emerald-deep text-[10px] uppercase tracking-[0.14em]">
              Bestseller
            </span>
          ) : null}
        </div>

        <button
          onClick={handleWishlistClick}
          aria-pressed={isLiked}
          aria-label={isLiked ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-colors duration-200 ${
            isLiked
              ? 'bg-emerald-default text-white'
              : 'bg-white/90 text-ink-soft hover:bg-white hover:text-emerald-default'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {/* Quick view slides up on hover */}
        {onQuickView && (
          <div className="hidden sm:block absolute inset-x-0 bottom-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <button
              onClick={(e) => { e.preventDefault(); onQuickView(product); }}
              className="w-full bg-white/95 backdrop-blur-sm text-ink hover:text-emerald-default py-3 text-[11px] uppercase tracking-[0.16em] transition-colors"
            >
              Quick view
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 p-3 sm:p-5">
        {product.subcategoryName && (
          // Tighter tracking on phones so the label fits a two-column card
          // instead of being cut off mid-word.
          <span className="type-eyebrow text-ink-soft mb-1.5 truncate tracking-[0.1em] sm:tracking-[0.18em]">
            {product.subcategoryName}
          </span>
        )}

        <h3 className="mb-2">
          <Link
            to={`/product/${product.slug}`}
            className="type-heading text-sm sm:text-base text-ink hover:text-emerald-default transition-colors line-clamp-2"
          >
            {product.name}
          </Link>
        </h3>

        {swatches.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            {swatches.slice(0, 4).map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                aria-label={v.value}
                title={v.value}
                className={`w-4 h-4 rounded-full border transition-all ${
                  selectedVariant?.id === v.id
                    ? 'ring-1 ring-offset-2 ring-emerald-default border-white'
                    : 'border-line-strong hover:border-ink-soft'
                }`}
                style={{ backgroundColor: v.swatch || '#154734' }}
              />
            ))}
          </div>
        )}

        <div className="mt-auto space-y-2.5 sm:space-y-3.5">
          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
            <span className="type-price text-base sm:text-lg text-ink">{formatPrice(currentPrice)}</span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-ink-faint line-through tabular">{formatPrice(originalPrice)}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.16em] border transition-colors duration-200 ${
              isOutOfStock
                ? 'border-line text-ink-faint cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-default border-emerald-default text-white'
                : 'border-ink text-ink hover:bg-ink hover:text-white'
            }`}
          >
            {isOutOfStock ? (
              'Sold out'
            ) : justAdded ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Added
              </span>
            ) : (
              'Add to cart'
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
