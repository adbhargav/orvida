import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { PRODUCTS } from '../data/mockData';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';

export default function Wishlist() {
  const { wishlistIds } = useWishlist();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const wishlistProducts = PRODUCTS.filter(p => wishlistIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}

      <div className="border-b border-[#8A6A16]/30 pb-4 flex justify-between items-end">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#F0D585]">Saved Favorites</span>
          <h1 className="font-display font-extrabold text-3xl text-white">Your Curated Wishlist ({wishlistProducts.length})</h1>
        </div>
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#0A3324] rounded-3xl border border-[#8A6A16]/30 p-8 space-y-4 max-w-xl mx-auto">
          <Heart className="w-12 h-12 text-[#F0D585] mx-auto opacity-40" />
          <h3 className="font-display font-bold text-xl text-white">Your Wishlist is Empty</h3>
          <p className="text-xs text-[#F7F5EF]/70">Explore our catalog and click the heart icon on any botanical card to save items.</p>
          <Link
            to="/category/plants"
            className="inline-flex items-center gap-2 bg-gold-gradient text-[#0A3324] px-6 py-3 rounded-full font-bold text-xs shadow-lg"
          >
            <span>EXPLORE CATALOG</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {wishlistProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
