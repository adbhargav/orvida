import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Leaf, Check, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product, onQuickView }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [isHovered, setIsHovered] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isLiked = isInWishlist(product.id);
  const primaryImg = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80';
  const secondaryImg = product.images?.[1]?.url || primaryImg;

  const currentPrice = (product.discountPrice || product.price) + (selectedVariant?.priceDelta || 0);
  const originalPrice = product.price + (selectedVariant?.priceDelta || 0);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedVariant, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const potSwatches = product.variants?.filter(v => v.type === 'pot_style' || v.type === 'color') || [];

  return (
    <div
      className="group relative bg-[#FAF8F3] text-[#1B1B1B] rounded-2xl overflow-hidden border border-[#C9972B]/30 hover:border-[#F0D585] shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_rgba(201,151,43,0.2)] transition-all duration-500 flex flex-col h-full transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F2EFE6]">
        
        {/* Main & Secondary Image with Crossfade & Scale */}
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={primaryImg}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
              isHovered && secondaryImg !== primaryImg ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            }`}
          />
          {secondaryImg !== primaryImg && (
            <img
              src={secondaryImg}
              alt={`${product.name} angle`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          )}
        </Link>

        {/* Botanical Badges Pill (Top Left) */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10 pointer-events-none">
          {product.isNew && (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#0A3324]/90 text-[#F0D585] text-[8px] sm:text-[10px] font-bold uppercase tracking-wider border border-[#C9972B]/40 shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#F0D585]" /> NEW
            </span>
          )}
          {product.isBestseller && !product.isNew && (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#8A6A16]/90 text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm">
              ★ BESTSELLER
            </span>
          )}
        </div>

        {/* Wishlist Heart Icon (Top Right) */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-2 sm:p-2.5 rounded-full z-10 transition-all duration-300 shadow-md ${
            isLiked
              ? 'bg-[#0B3D2E] text-[#F0D585] border border-[#F0D585] scale-110'
              : 'bg-white/80 backdrop-blur-md text-[#8A6A16] hover:bg-white hover:text-[#C9972B] hover:scale-110'
          }`}
          aria-label="Add to Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiked ? 'fill-[#F0D585] text-[#F0D585] animate-pulse' : ''}`} />
        </button>

        {/* Quick View Button Overlay (Desktop) */}
        <div className="hidden sm:flex absolute inset-x-0 bottom-3 justify-center px-3 z-10 transition-all duration-300 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickView?.(product);
            }}
            className="w-full bg-[#0A3324]/90 backdrop-blur-md hover:bg-[#0A3324] text-[#F0D585] border border-[#C9972B] px-3 py-2 rounded-full text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition duration-200"
          >
            <Eye className="w-3.5 h-3.5" /> QUICK VIEW
          </button>
        </div>
      </div>

      {/* Product Information Body */}
      <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between bg-[#FAF8F3]">
        <div>
          {/* Micro-label Subcategory/Tag line */}
          <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#8A6A16] mb-1 truncate">
            {product.subcategoryName}
          </div>

          {/* Product Title */}
          <Link to={`/product/${product.slug}`} className="block mb-1.5">
            <h3 className="font-display font-semibold text-xs sm:text-sm text-[#1B1B1B] group-hover:text-[#8A6A16] transition line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Pot Variant Swatches Preview */}
          {potSwatches.length > 0 && (
            <div className="flex items-center gap-1 my-1.5">
              {potSwatches.slice(0, 4).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-all ${
                    selectedVariant?.id === v.id
                      ? 'ring-2 ring-[#C9972B] scale-125 border-white'
                      : 'border-gray-300 opacity-80'
                  }`}
                  style={{ backgroundColor: v.swatch || '#C9972B' }}
                  title={v.value}
                />
              ))}
            </div>
          )}

          {/* Pricing Row */}
          <div className="flex items-baseline gap-1.5 my-2">
            <span className="font-serif font-bold text-sm sm:text-lg text-[#0B3D2E]">
              ₹{currentPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through font-medium">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Pill-Shaped Animated Add-to-Cart Button */}
          <button
            onClick={handleAddToCart}
            className={`w-full py-2 sm:py-2.5 px-2 sm:px-4 rounded-full border border-[#C9972B] font-bold text-[10px] sm:text-xs tracking-wider flex items-center justify-center gap-1 sm:gap-2 transition-all duration-300 ${
              addedAnimation
                ? 'bg-[#0B3D2E] text-[#F0D585] border-[#F0D585]'
                : 'bg-transparent text-[#0B3D2E] hover:bg-gold-gradient hover:text-[#0A3324] hover:border-transparent shadow-sm'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-[#F0D585]" />
                <span>ADDED</span>
              </>
            ) : (
              <>
                <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>ADD TO CART</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
