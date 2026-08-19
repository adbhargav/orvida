import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Loader2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';
import { api } from '../services/api';
import usePageMeta from '../hooks/usePageMeta';

export default function Wishlist() {
  usePageMeta({ title: 'Your Wishlist | ORIVIDA', path: '/wishlist', robots: 'noindex, follow' });

  const { wishlistIds } = useWishlist();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolve saved ids against the live catalogue — the previous build only
  // matched against bundled sample data, so real products never appeared.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.products.getAll({ limit: 200 });
        if (!cancelled) setProducts(res.products || []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="bg-canvas min-h-[60vh]">
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
        <header className="border-b border-line pb-6 mb-10 space-y-2">
          <span className="type-eyebrow text-emerald-default block">Saved for later</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">
            Your wishlist
            {!loading && wishlistProducts.length > 0 && (
              <span className="text-ink-faint tabular text-2xl ml-3">({wishlistProducts.length})</span>
            )}
          </h1>
        </header>

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-ink-soft">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm">Loading your saved pieces…</p>
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="py-24 text-center space-y-4 max-w-md mx-auto">
            <Heart className="w-10 h-10 text-ink-faint mx-auto" strokeWidth={1} />
            <div className="space-y-1.5">
              <p className="type-heading text-2xl text-ink">Nothing saved yet</p>
              <p className="text-sm text-ink-soft">
                Tap the heart on any piece to keep it here while you decide.
              </p>
            </div>
            <Link
              to="/category/plants"
              className="inline-flex items-center gap-2 px-7 py-3 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
            >
              Browse the collection <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
