import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, Tag, TrendingDown } from 'lucide-react';
import { api } from '../../services/api';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminOffers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // "Offers" are simply the products currently priced below their retail
  // price. This page used to show an invented list unconnected to the store.
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.products.getAll({ limit: 200 });
      setProducts(res.products || []);
    } catch (err) {
      setError(err.message || 'Could not load the catalogue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const offers = useMemo(
    () =>
      products
        .filter((p) => p.discountPrice)
        .map((p) => ({
          ...p,
          saving: p.price - p.discountPrice,
          percentOff: Math.round(((p.price - p.discountPrice) / p.price) * 100),
        }))
        .sort((a, b) => b.percentOff - a.percentOff),
    [products]
  );

  const deepest = offers[0];

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="space-y-1.5 border-b border-line pb-6">
        <span className="type-eyebrow text-emerald-default">Merchandising</span>
        <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Active offers</h1>
        <p className="text-sm text-ink-soft">
          Every product currently selling below its retail price. Edit a price in{' '}
          <span className="text-ink">Products</span> to change an offer.
        </p>
      </header>

      {loading ? (
        <div className="surface-card rounded-lg p-16 flex flex-col items-center gap-3 text-ink-soft">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Loading offers…</p>
        </div>
      ) : error ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{error}</p>
          <button onClick={loadProducts} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      ) : offers.length === 0 ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-2">
          <Tag className="w-7 h-7 text-ink-faint mx-auto" />
          <p className="type-heading text-lg text-ink">No active offers</p>
          <p className="text-sm text-ink-soft">Set an offer price on a product to feature it here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="surface-card rounded-lg p-6 space-y-2.5">
              <span className="type-eyebrow text-ink-soft block">Products on offer</span>
              <p className="type-price text-3xl text-ink">{offers.length}</p>
            </div>
            <div className="surface-card rounded-lg p-6 space-y-2.5">
              <span className="type-eyebrow text-ink-soft block">Deepest discount</span>
              <p className="type-price text-3xl text-ink">{deepest.percentOff}%</p>
              <p className="text-sm text-ink-soft truncate">{deepest.name}</p>
            </div>
            <div className="surface-card rounded-lg p-6 space-y-2.5">
              <span className="type-eyebrow text-ink-soft block">Average discount</span>
              <p className="type-price text-3xl text-ink">
                {Math.round(offers.reduce((s, o) => s + o.percentOff, 0) / offers.length)}%
              </p>
            </div>
          </div>

          <div className="surface-card rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-emerald-subtle border-b border-line">
                  <tr className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                    <th className="py-3.5 px-6 font-semibold">Product</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Retail</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Offer</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Customer saves</th>
                    <th className="py-3.5 px-6 font-semibold text-center">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {offers.map((p) => (
                    <tr key={p.id} className="hover:bg-emerald-subtle/50 transition">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3.5">
                          {p.images[0]?.url && (
                            <img src={p.images[0].url} alt="" className="w-11 h-11 rounded-md object-cover border border-line shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate max-w-[20rem]">{p.name}</p>
                            <p className="text-xs text-ink-faint">{p.categoryName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right text-ink-faint line-through tabular">{money(p.price)}</td>
                      <td className="py-3.5 px-6 text-right type-price text-ink">{money(p.discountPrice)}</td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="inline-flex items-center gap-1.5 text-emerald-deep">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span className="tabular">{money(p.saving)}</span>
                          <span className="text-xs text-ink-soft">({p.percentOff}%)</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium tabular ${
                          p.stock === 0 ? 'bg-rose-50 text-rose-700'
                          : p.stock <= 5 ? 'bg-amber-50 text-amber-800'
                          : 'bg-emerald-light text-emerald-deep'
                        }`}>
                          {p.stock === 0 ? 'Out of stock' : p.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
