import React, { useState } from 'react';
import { X, Star, Leaf, Check, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const currentPrice = (product.discountPrice || product.price) + (selectedVariant?.priceDelta || 0);

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 glass-dark bg-black/80 flex items-center justify-center p-4 md:p-6 animate-fadeIn">
      <div className="bg-[#FAF8F3] text-[#1B1B1B] w-full max-w-4xl rounded-3xl overflow-hidden border border-[#C9972B] shadow-2xl relative grid grid-cols-1 md:grid-cols-2 max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#0A3324] text-[#F0D585] hover:text-white transition shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery Preview Left Column */}
        <div className="p-6 bg-[#F2EFE6] flex flex-col justify-between overflow-y-auto">
          <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 border border-[#C9972B]/30 shadow-md">
            <img
              src={product.images[activeImgIndex]?.url || product.images[0]?.url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail Selector */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images?.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setActiveImgIndex(idx)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                  activeImgIndex === idx ? 'border-[#C9972B] scale-105 shadow-md' : 'border-transparent opacity-70'
                }`}
              >
                <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info Right Column */}
        <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-[#FAF8F3]">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A6A16]">
              {product.categoryName} · {product.subcategoryName}
            </span>

            <h2 className="font-display font-bold text-xl md:text-2xl text-[#0B3D2E] mt-1 mb-2">
              {product.name}
            </h2>

            {/* Rating Stars */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-[#C9972B]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9972B]" />
                ))}
              </div>
              <span className="text-xs font-semibold text-[#1B1B1B]">
                {product.avgRating} ({product.reviewCount} luxury reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-serif font-bold text-2xl text-[#0B3D2E]">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {product.discountPrice && (
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <p className="text-xs text-[#1B1B1B]/80 leading-relaxed mb-6">
              {product.shortDescription}
            </p>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="mb-6 space-y-3">
                <label className="text-xs font-bold text-[#8A6A16] uppercase tracking-wider block">
                  Select Specification / Finish:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        selectedVariant?.id === v.id
                          ? 'bg-[#0B3D2E] text-[#F0D585] border-[#F0D585] shadow-md'
                          : 'bg-white text-[#1B1B1B] border-gray-300 hover:border-[#C9972B]'
                      }`}
                    >
                      {v.value} {v.priceDelta > 0 ? `(+₹${v.priceDelta})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            {/* Quantity Stepper & Add to Cart */}
            <div className="flex gap-4 mb-4">
              <div className="flex items-center border border-[#8A6A16]/40 rounded-full bg-white px-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2 py-1 text-base font-bold text-[#8A6A16]"
                >
                  -
                </button>
                <span className="px-3 text-sm font-bold text-[#1B1B1B]">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2 py-1 text-base font-bold text-[#8A6A16]"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-6 rounded-full font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition duration-300 ${
                  addedSuccess
                    ? 'bg-[#0B3D2E] text-[#F0D585]'
                    : 'bg-gold-gradient hover:bg-gold-gradient-hover text-[#0A3324] shadow-lg hover:scale-105'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-[#F0D585]" />
                    <span>ADDED TO CART!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO CART · ₹{(currentPrice * quantity).toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>
            </div>

            <Link
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="text-xs text-[#8A6A16] hover:text-[#0B3D2E] font-semibold flex items-center justify-center gap-1 text-center"
            >
              View Full Product Details & Craftsmanship Story <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
