import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Loader2, AlertCircle, Download, Truck, Package, ChevronDown, X,
  FileText, Tag, IndianRupee,
} from 'lucide-react';
import { api } from '../../services/api';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUSES = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const STATUS_TONE = {
  Delivered: 'bg-emerald-light text-emerald-deep',
  Shipped: 'bg-sky-50 text-sky-800',
  'Out for Delivery': 'bg-sky-50 text-sky-800',
  Packed: 'bg-indigo-50 text-indigo-800',
  Processing: 'bg-amber-50 text-amber-800',
  Cancelled: 'bg-rose-50 text-rose-700',
};

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [trackingDrafts, setTrackingDrafts] = useState({});
  const [refundOrder, setRefundOrder] = useState(null);
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' });
  const [refundError, setRefundError] = useState('');
  const [refunding, setRefunding] = useState(false);

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.orders.getAllOrdersAdmin();
      setOrders(res.orders || []);
    } catch (err) {
      setError(err.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (order, nextStatus) => {
    if (nextStatus === order.status) return;
    setBusyId(order.id);
    try {
      await api.orders.updateStatus(order.id, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));
      notify('success', `${order.orderNumber} marked as ${nextStatus}. The customer has been emailed.`);
    } catch (err) {
      notify('error', err.message || 'Could not update this order.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveTracking = async (order) => {
    const trackingNumber = (trackingDrafts[order.id] ?? '').trim();
    if (!trackingNumber) return;

    setBusyId(order.id);
    try {
      await api.orders.updateTracking(order.id, trackingNumber);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, trackingNumber } : o)));
      setTrackingDrafts((prev) => ({ ...prev, [order.id]: undefined }));
      notify('success', `Tracking saved for ${order.orderNumber}.`);
    } catch (err) {
      notify('error', err.message || 'Could not save the tracking number.');
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenDocument = async (order, kind) => {
    try {
      await api.orders.openDocument(order.orderNumber, kind);
    } catch (err) {
      notify('error', err.message || `Could not open the ${kind}.`);
    }
  };

  const openRefundModal = (order) => {
    const refundable = order.total - (order.refundedAmount || 0);
    setRefundOrder(order);
    setRefundForm({ amount: String(refundable), reason: '' });
    setRefundError('');
  };

  const handleRefund = async (event) => {
    event.preventDefault();
    setRefundError('');

    const amount = Number(refundForm.amount);
    const refundable = refundOrder.total - (refundOrder.refundedAmount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return setRefundError('Enter a valid refund amount.');
    }
    if (amount > refundable) {
      return setRefundError(`The refundable balance is ${money(refundable)}.`);
    }

    setRefunding(true);
    try {
      const res = await api.payments.refund(refundOrder.id, {
        amount,
        reason: refundForm.reason,
      });
      setRefundOrder(null);
      notify('success', res.message || 'Refund initiated.');
      await loadOrders();
    } catch (err) {
      setRefundError(err.message || 'The refund could not be processed.');
    } finally {
      setRefunding(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Payment', 'Tracking', 'Placed'];
    const rows = filtered.map((o) => [
      o.orderNumber,
      `"${(o.customerName || o.shippingAddress?.fullName || 'Guest').replace(/"/g, '""')}"`,
      o.customerEmail || o.shippingAddress?.email || '',
      o.items.reduce((n, i) => n + i.quantity, 0),
      o.total,
      o.status,
      o.paymentStatus,
      o.trackingNumber || '',
      o.createdAt ? new Date(o.createdAt).toISOString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ORIVIDA_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const counts = useMemo(() => {
    const map = { ALL: orders.length };
    STATUSES.forEach((s) => { map[s] = orders.filter((o) => o.status === s).length; });
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchesQuery =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.customerEmail || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.email || '').toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Fulfilment</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Orders</h1>
          <p className="text-sm text-ink-soft">
            {loading ? 'Loading…' : `${orders.length} order${orders.length === 1 ? '' : 's'} in the ledger`}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-line bg-white text-sm font-medium text-ink hover:border-emerald-default hover:text-emerald-default disabled:opacity-40 transition"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>

      {banner && (
        <div role="status" className={`flex items-center gap-2.5 px-4 py-3 rounded-md border text-sm ${
          banner.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-light border-emerald-default/25 text-emerald-deep'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {banner.text}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['ALL', ...STATUSES].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2 rounded-full text-sm transition ${
                statusFilter === status
                  ? 'bg-emerald-default text-white'
                  : 'bg-white border border-line text-ink-soft hover:border-emerald-default hover:text-emerald-default'
              }`}
            >
              {status === 'ALL' ? 'All' : status}
              <span className="ml-1.5 text-xs opacity-70 tabular">{counts[status] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            placeholder="Search order number, customer or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      {loading ? (
        <div className="surface-card rounded-lg p-16 flex flex-col items-center gap-3 text-ink-soft">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Loading orders…</p>
        </div>
      ) : error ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{error}</p>
          <button onClick={loadOrders} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-2">
          <Package className="w-7 h-7 text-ink-faint mx-auto" />
          <p className="type-heading text-lg text-ink">No orders here</p>
          <p className="text-sm text-ink-soft">
            {orders.length === 0 ? 'Completed checkouts will appear in this ledger.' : 'Try a different filter or search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const customerName = order.customerName || order.shippingAddress?.fullName || 'Guest checkout';
            const customerEmail = order.customerEmail || order.shippingAddress?.email || '';
            const isBusy = busyId === order.id;
            const draft = trackingDrafts[order.id];

            return (
              <article key={order.id} className="surface-card rounded-lg p-5 sm:p-6 space-y-5">
                <div className="flex flex-col lg:flex-row justify-between gap-5">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="type-price text-lg text-emerald-default">{order.orderNumber}</h2>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_TONE[order.status] || 'bg-emerald-subtle text-ink-soft'}`}>
                        {order.status}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'Paid' ? 'bg-emerald-light text-emerald-deep' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </div>

                    <p className="text-sm text-ink">
                      {customerName}
                      {customerEmail && <span className="text-ink-soft"> · {customerEmail}</span>}
                    </p>

                    <p className="text-xs text-ink-faint">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
                          })
                        : '—'}
                      {order.deliverySlot ? ` · ${order.deliverySlot}` : ''}
                    </p>

                    {order.items.length > 0 && (
                      <ul className="text-sm text-ink-soft pt-1 space-y-0.5">
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            {item.quantity} × {item.name}
                            {item.variantName ? ` (${item.variantName})` : ''}
                            <span className="text-ink-faint"> — {money(item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="lg:text-right space-y-3 shrink-0">
                    <div>
                      <span className="type-eyebrow text-ink-soft block">Order total</span>
                      <p className="type-price text-2xl text-ink">{money(order.total)}</p>
                      {order.refundedAmount > 0 && (
                        <p className="text-sm text-rose-600 tabular">−{money(order.refundedAmount)} refunded</p>
                      )}
                    </div>

                    <div className="flex flex-wrap lg:justify-end gap-2">
                      <button
                        onClick={() => handleOpenDocument(order, 'invoice')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-line text-sm text-ink hover:border-emerald-default hover:text-emerald-default transition"
                      >
                        <FileText className="w-3.5 h-3.5" /> Invoice
                      </button>

                      <button
                        onClick={() => handleOpenDocument(order, 'label')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-line text-sm text-ink hover:border-emerald-default hover:text-emerald-default transition"
                      >
                        <Tag className="w-3.5 h-3.5" /> Label
                      </button>

                      {order.paymentStatus !== 'Failed' && order.refundedAmount < order.total && (
                        <button
                          onClick={() => openRefundModal(order)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-line text-sm text-ink hover:border-rose-500 hover:text-rose-600 transition"
                        >
                          <IndianRupee className="w-3.5 h-3.5" /> Refund
                        </button>
                      )}

                      <div className="relative">
                        <select
                          value={order.status}
                          disabled={isBusy}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          className="appearance-none pl-3.5 pr-9 py-2 rounded-md border border-line bg-white text-sm text-ink hover:border-emerald-default focus:outline-none focus:border-emerald-default disabled:opacity-50 transition cursor-pointer"
                          aria-label={`Change status for ${order.orderNumber}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {isBusy
                          ? <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-faint pointer-events-none" />
                          : <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping address + tracking */}
                <div className="pt-4 border-t border-line grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <span className="type-eyebrow text-ink-soft">Ship to</span>
                    <address className="text-sm text-ink not-italic leading-relaxed">
                      {order.shippingAddress?.address}
                      {order.shippingAddress?.city && <>, {order.shippingAddress.city}</>}
                      {order.shippingAddress?.state && <>, {order.shippingAddress.state}</>}
                      {order.shippingAddress?.pincode && <> — {order.shippingAddress.pincode}</>}
                      {order.shippingAddress?.phone && (
                        <span className="block text-ink-soft tabular">{order.shippingAddress.phone}</span>
                      )}
                    </address>
                  </div>

                  <div className="space-y-1.5">
                    <span className="type-eyebrow text-ink-soft flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Tracking
                    </span>
                    {order.trackingNumber && draft === undefined ? (
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-ink tabular">{order.trackingNumber}</p>
                        <button
                          onClick={() => setTrackingDrafts((p) => ({ ...p, [order.id]: order.trackingNumber }))}
                          className="text-sm text-emerald-default link-underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="India Post AWB number"
                          value={draft ?? ''}
                          onChange={(e) => setTrackingDrafts((p) => ({ ...p, [order.id]: e.target.value }))}
                          className={inputClass}
                        />
                        <button
                          onClick={() => handleSaveTracking(order)}
                          disabled={isBusy || !(draft ?? '').trim()}
                          className="px-4 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep disabled:opacity-40 transition shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Refund */}
      {refundOrder && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-md w-full shadow-overlay border border-line">
            <div className="flex justify-between items-start p-6 border-b border-line">
              <div className="space-y-1">
                <span className="type-eyebrow text-emerald-default">Refund</span>
                <h2 className="type-heading text-xl text-ink">{refundOrder.orderNumber}</h2>
              </div>
              <button
                onClick={() => setRefundOrder(null)}
                className="p-2 -mr-2 -mt-2 text-ink-faint hover:text-ink transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefund} className="p-6 space-y-4">
              {refundError && (
                <div role="alert" className="flex items-start gap-2.5 px-4 py-3 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {refundError}
                </div>
              )}

              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Order total</dt>
                  <dd className="text-ink tabular">{money(refundOrder.total)}</dd>
                </div>
                {refundOrder.refundedAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Already refunded</dt>
                    <dd className="text-rose-600 tabular">−{money(refundOrder.refundedAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-line">
                  <dt className="text-ink">Refundable now</dt>
                  <dd className="type-price text-ink">{money(refundOrder.total - (refundOrder.refundedAmount || 0))}</dd>
                </div>
              </dl>

              <div className="space-y-1.5">
                <label htmlFor="refund-amount" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Amount to refund (₹)
                </label>
                <input
                  id="refund-amount"
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  className={`${inputClass} tabular`}
                />
                <p className="text-xs text-ink-faint">Enter a smaller figure to issue a partial refund.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="refund-reason" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Reason (internal)
                </label>
                <textarea
                  id="refund-reason"
                  rows={3}
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  className={`${inputClass} resize-y`}
                  placeholder="Damaged in transit, customer request…"
                />
              </div>

              <p className="text-xs text-ink-soft">
                The refund is sent to Razorpay immediately and returns to the customer&rsquo;s original payment method.
                This cannot be undone.
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setRefundOrder(null)}
                  className="px-5 py-2.5 mt-4 rounded-md border border-line text-sm font-medium text-ink hover:bg-emerald-subtle transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refunding}
                  className="px-6 py-2.5 mt-4 rounded-md bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50 transition inline-flex items-center gap-2"
                >
                  {refunding && <Loader2 className="w-4 h-4 animate-spin" />}
                  Issue refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
