import React, { useState, useEffect, useCallback } from 'react';
import { IndianRupee, Package, Users, ShoppingBag, Loader2, AlertCircle, Download } from 'lucide-react';
import { api } from '../../services/api';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_TONE = {
  Delivered: 'bg-emerald-light text-emerald-deep',
  Shipped: 'bg-sky-50 text-sky-800',
  'Out for Delivery': 'bg-sky-50 text-sky-800',
  Packed: 'bg-indigo-50 text-indigo-800',
  Processing: 'bg-amber-50 text-amber-800',
  Cancelled: 'bg-rose-50 text-rose-700',
};

export default function AdminOverview() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.dashboard.getMetrics();
      setMetrics(res.metrics);
    } catch (err) {
      // Previously this page displayed invented figures (₹14,82,900 revenue,
      // 1,420 customers) that were hard-coded into the markup. It now reports
      // only what the database actually holds.
      setError(err.message || 'Could not load store metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleExportCSV = () => {
    if (!metrics?.recentOrders?.length) return;
    const headers = ['Order', 'Customer', 'Total', 'Status', 'Payment', 'Placed'];
    const rows = metrics.recentOrders.map((o) => [
      o.order_number || o.id,
      `"${(o.customer_name || 'Guest').replace(/"/g, '""')}"`,
      o.total,
      o.status,
      o.payment_status,
      new Date(o.created_at).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ORIVIDA_Recent_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cards = metrics
    ? [
        { label: 'Revenue (paid orders)', value: money(metrics.totalRevenue), icon: IndianRupee },
        { label: 'Orders placed', value: metrics.totalOrders.toLocaleString('en-IN'), icon: ShoppingBag },
        { label: 'Products live', value: metrics.totalProducts.toLocaleString('en-IN'), icon: Package },
        { label: 'Registered customers', value: metrics.totalUsers.toLocaleString('en-IN'), icon: Users },
      ]
    : [];

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Store performance</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Overview</h1>
          <p className="text-sm text-ink-soft">Live figures from the ORIVIDA database</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!metrics?.recentOrders?.length}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-line bg-white text-sm font-medium text-ink hover:border-emerald-default hover:text-emerald-default disabled:opacity-40 transition"
        >
          <Download className="w-4 h-4" /> Export recent orders
        </button>
      </header>

      {loading ? (
        <div className="surface-card rounded-lg p-16 flex flex-col items-center gap-3 text-ink-soft">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Loading metrics…</p>
        </div>
      ) : error ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{error}</p>
          <button onClick={loadMetrics} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="surface-card rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="type-eyebrow text-ink-soft">{label}</span>
                  <Icon className="w-4 h-4 text-emerald-default shrink-0" />
                </div>
                <p className="type-price text-3xl text-ink">{value}</p>
              </div>
            ))}
          </div>

          <section className="surface-card rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-line">
              <h2 className="type-heading text-xl text-ink">Recent orders</h2>
              <p className="text-sm text-ink-soft mt-0.5">The five most recent orders across the store</p>
            </div>

            {metrics.recentOrders.length === 0 ? (
              <div className="p-16 text-center space-y-1.5">
                <p className="type-heading text-lg text-ink">No orders yet</p>
                <p className="text-sm text-ink-soft">Completed checkouts will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-emerald-subtle border-b border-line">
                    <tr className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                      <th className="py-3.5 px-6 font-semibold">Order</th>
                      <th className="py-3.5 px-6 font-semibold">Customer</th>
                      <th className="py-3.5 px-6 font-semibold text-right">Total</th>
                      <th className="py-3.5 px-6 font-semibold">Status</th>
                      <th className="py-3.5 px-6 font-semibold">Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {metrics.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-emerald-subtle/50 transition">
                        <td className="py-3.5 px-6 font-medium text-emerald-default tabular">
                          {order.order_number || `#${order.id}`}
                        </td>
                        <td className="py-3.5 px-6 text-ink">{order.customer_name || 'Guest checkout'}</td>
                        <td className="py-3.5 px-6 text-right type-price text-ink">{money(order.total)}</td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_TONE[order.status] || 'bg-emerald-subtle text-ink-soft'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-ink-soft">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
