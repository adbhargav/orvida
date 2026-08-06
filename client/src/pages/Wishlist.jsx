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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#FAF9F6]">
      
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}

      <div className="border-b border-gray-200 pb-4 flex justify-between items-end">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Saved Favorites</span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900">Your Curated Wishlist ({wishlistProducts.length})</h1>
        </div>
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 space-y-4 max-w-xl mx-auto shadow-sm">
          <Heart className="w-12 h-12 text-[#154734] mx-auto opacity-40" />
          <h3 className="font-display font-bold text-xl text-slate-900">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500">Explore our catalog and click the heart icon on any botanical card to save items.</p>
          <Link
            to="/category/plants"
            className="inline-flex items-center gap-2 bg-[#154734] hover:bg-[#0F3526] text-white px-6 py-3 rounded-full font-bold text-xs shadow-md"
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
