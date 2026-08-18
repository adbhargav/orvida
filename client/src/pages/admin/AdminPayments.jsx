import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, Download, CreditCard, Search } from 'lucide-react';
import { api } from '../../services/api';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

export default function AdminPayments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Payments are derived from the orders ledger rather than a separate
  // hard-coded list, so the figures always reconcile with the store.
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.orders.getAllOrdersAdmin();
      setOrders(res.orders || []);
    } catch (err) {
      setError(err.message || 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const totals = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === 'Paid');
    const collected = paid.reduce((sum, o) => sum + o.total, 0);
    const refundable = orders
      .filter((o) => o.status === 'Cancelled' && o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.total, 0);
    return {
      collected,
      transactions: paid.length,
      averageOrder: paid.length ? Math.round(collected / paid.length) : 0,
      refundable,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.razorpay_payment_id || '').toLowerCase().includes(q) ||
        (o.customerEmail || '').toLowerCase().includes(q)
    );
  }, [orders, search]);

  const handleExportCSV = () => {
    const headers = ['Order', 'Razorpay Payment ID', 'Customer', 'Amount', 'Payment Status', 'Order Status', 'Date'];
    const rows = filtered.map((o) => [
      o.orderNumber,
      o.razorpay_payment_id || '',
      `"${(o.customerEmail || o.shippingAddress?.email || 'Guest').replace(/"/g, '""')}"`,
      o.total,
      o.paymentStatus,
      o.status,
      o.createdAt ? new Date(o.createdAt).toISOString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ORIVIDA_Payments_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: 'Total collected', value: money(totals.collected) },
    { label: 'Successful transactions', value: totals.transactions.toLocaleString('en-IN') },
    { label: 'Average order value', value: money(totals.averageOrder) },
    { label: 'Cancelled after payment', value: money(totals.refundable) },
  ];

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Financial ledger</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Payments</h1>
          <p className="text-sm text-ink-soft">Razorpay settlements reconciled against the orders table</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-line bg-white text-sm font-medium text-ink hover:border-emerald-default hover:text-emerald-default disabled:opacity-40 transition"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>

      {loading ? (
        <div className="surface-card rounded-lg p-16 flex flex-col items-center gap-3 text-ink-soft">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Loading payments…</p>
        </div>
      ) : error ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{error}</p>
          <button onClick={loadOrders} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map(({ label, value }) => (
              <div key={label} className="surface-card rounded-lg p-6 space-y-2.5">
                <span className="type-eyebrow text-ink-soft block">{label}</span>
                <p className="type-price text-3xl text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              placeholder="Search order, payment ID or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>

          <div className="surface-card rounded-lg overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <CreditCard className="w-7 h-7 text-ink-faint mx-auto" />
                <p className="type-heading text-lg text-ink">No transactions</p>
                <p className="text-sm text-ink-soft">Completed payments will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-emerald-subtle border-b border-line">
                    <tr className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                      <th className="py-3.5 px-6 font-semibold">Order</th>
                      <th className="py-3.5 px-6 font-semibold">Payment reference</th>
                      <th className="py-3.5 px-6 font-semibold">Customer</th>
                      <th className="py-3.5 px-6 font-semibold text-right">Amount</th>
                      <th className="py-3.5 px-6 font-semibold">Status</th>
                      <th className="py-3.5 px-6 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filtered.map((o) => (
                      <tr key={o.id} className="hover:bg-emerald-subtle/50 transition">
                        <td className="py-3.5 px-6 font-medium text-emerald-default tabular">{o.orderNumber}</td>
                        <td className="py-3.5 px-6 text-ink-soft text-xs tabular">{o.razorpay_payment_id || '—'}</td>
                        <td className="py-3.5 px-6 text-ink truncate max-w-[16rem]">
                          {o.customerEmail || o.shippingAddress?.email || 'Guest checkout'}
                        </td>
                        <td className="py-3.5 px-6 text-right type-price text-ink">{money(o.total)}</td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            o.paymentStatus === 'Paid' ? 'bg-emerald-light text-emerald-deep'
                            : o.paymentStatus === 'Failed' ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                          }`}>
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-ink-soft">
                          {o.createdAt
                            ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
