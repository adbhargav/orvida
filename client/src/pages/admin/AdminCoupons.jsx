import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, Loader2, AlertCircle, Ticket } from 'lucide-react';
import { api } from '../../services/api';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft';

const EMPTY = { code: '', discountType: 'percentage', discountValue: '', minSpend: '', maxDiscount: '', validUntil: '' };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  };

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.coupons.getAllAdmin();
      setCoupons(res.coupons || []);
    } catch (err) {
      setError(err.message || 'Could not load coupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError('');

    const discountValue = Number(form.discountValue);
    if (!form.code.trim()) return setFormError('Enter a coupon code.');
    if (!Number.isFinite(discountValue) || discountValue <= 0) return setFormError('Enter a valid discount value.');
    if (form.discountType === 'percentage' && discountValue > 100) {
      return setFormError('A percentage discount cannot exceed 100%.');
    }

    setSaving(true);
    try {
      await api.coupons.create({
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue,
        minSpend: Number(form.minSpend) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        validUntil: form.validUntil || null,
      });
      setIsModalOpen(false);
      setForm(EMPTY);
      notify('success', 'Coupon created and live on the storefront.');
      await loadCoupons();
    } catch (err) {
      setFormError(err.message || 'Could not create this coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      await api.coupons.remove(coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      notify('success', `${coupon.code} deleted.`);
    } catch (err) {
      notify('error', err.message || 'Could not delete this coupon.');
    }
  };

  const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const isExpired = (c) => c.valid_until && new Date(c.valid_until) < new Date();

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Promotions</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Coupons</h1>
          <p className="text-sm text-ink-soft">Codes here are validated at checkout against the live cart total</p>
        </div>

        <button
          onClick={() => { setFormError(''); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep transition"
        >
          <Plus className="w-4 h-4" /> New coupon
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

      {loading ? (
        <div className="surface-card rounded-lg p-16 flex flex-col items-center gap-3 text-ink-soft">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Loading coupons…</p>
        </div>
      ) : error ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{error}</p>
          <button onClick={loadCoupons} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      ) : coupons.length === 0 ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-2">
          <Ticket className="w-7 h-7 text-ink-faint mx-auto" />
          <p className="type-heading text-lg text-ink">No coupons yet</p>
          <p className="text-sm text-ink-soft">Create a code to offer a discount at checkout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const expired = isExpired(c);
            return (
              <div key={c.id} className={`surface-card rounded-lg p-5 space-y-4 ${expired ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <p className="type-price text-xl text-ink tracking-wide">{c.code}</p>
                    <p className="text-sm text-ink-soft">
                      {c.discount_type === 'percentage'
                        ? `${Number(c.discount_value)}% off`
                        : `${money(c.discount_value)} off`}
                      {c.max_discount ? ` · up to ${money(c.max_discount)}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-2 -mr-1 -mt-1 rounded-md text-ink-faint hover:bg-rose-600 hover:text-white transition shrink-0"
                    aria-label={`Delete ${c.code}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <dl className="text-sm space-y-1.5 pt-3 border-t border-line">
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Minimum spend</dt>
                    <dd className="text-ink tabular">{Number(c.min_spend) > 0 ? money(c.min_spend) : 'None'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Times used</dt>
                    <dd className="text-ink tabular">{c.usage_count ?? 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Valid until</dt>
                    <dd className={expired ? 'text-rose-600' : 'text-ink'}>
                      {c.valid_until
                        ? new Date(c.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'No expiry'}
                    </dd>
                  </div>
                </dl>

                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                  expired ? 'bg-rose-50 text-rose-700' : c.is_active ? 'bg-emerald-light text-emerald-deep' : 'bg-emerald-subtle text-ink-soft'
                }`}>
                  {expired ? 'Expired' : c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-md w-full shadow-overlay border border-line">
            <div className="flex justify-between items-start p-6 border-b border-line">
              <div className="space-y-1">
                <span className="type-eyebrow text-emerald-default">Promotions</span>
                <h2 className="type-heading text-xl text-ink">New coupon</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 -mt-2 text-ink-faint hover:text-ink transition" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className={labelClass}>Coupon code</label>
                <input type="text" required placeholder="ORVIDA10" value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className={`${inputClass} uppercase tracking-wide`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Discount type</label>
                  <select value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })} className={inputClass}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>{form.discountType === 'percentage' ? 'Percent off' : 'Amount off (₹)'}</label>
                  <input type="number" required min="1" step="0.01" value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Minimum spend (₹)</label>
                  <input type="number" min="0" placeholder="0" value={form.minSpend}
                    onChange={(e) => setForm({ ...form, minSpend: e.target.value })} className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Max discount (₹)</label>
                  <input type="number" min="0" placeholder="Optional" value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    className={inputClass} disabled={form.discountType !== 'percentage'} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Valid until</label>
                <input type="date" value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className={inputClass} />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 mt-4 rounded-md border border-line text-sm font-medium text-ink hover:bg-emerald-subtle transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 mt-4 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep disabled:opacity-50 transition inline-flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
