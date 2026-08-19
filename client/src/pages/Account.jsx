import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, MapPin, LogOut, Plus, X, Truck, ArrowRight, Loader2, AlertCircle, Check, FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const STATUS_TONE = {
  Delivered: 'bg-emerald-light text-emerald-deep',
  Shipped: 'bg-sky-50 text-sky-800',
  'Out for Delivery': 'bg-sky-50 text-sky-800',
  Packed: 'bg-indigo-50 text-indigo-800',
  Processing: 'bg-amber-50 text-amber-800',
  Cancelled: 'bg-rose-50 text-rose-700',
};

const inputClass =
  'w-full px-3.5 py-2.5 border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default transition-colors';

const labelClass = 'type-eyebrow text-ink-soft block mb-1.5';

export default function Account() {
  const { user, logout, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('orders');
  // Google avatar URLs regularly fail to load (their CDN rejects hotlinks),
  // so fall back to the member's initial rather than a broken image.
  const [photoFailed, setPhotoFailed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [banner, setBanner] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressForm, setAddressForm] = useState({ fullName: '', phone: '', address: '', city: '', state: '', pincode: '' });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  };

  const loadOrders = useCallback(async () => {
    if (!user?.token) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    setOrdersError('');
    try {
      const res = await api.orders.getMyOrders();
      setOrders(res.orders || []);
    } catch (err) {
      setOrdersError(err.message || 'Could not load your orders.');
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.token]);

  const loadAddresses = useCallback(async () => {
    if (!user?.token) {
      setLoadingAddresses(false);
      return;
    }
    setLoadingAddresses(true);
    try {
      const res = await api.addresses.getMine();
      setAddresses(res.addresses || []);
    } catch {
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadOrders();
    loadAddresses();
  }, [loadOrders, loadAddresses]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileError('');
    setSavingProfile(true);
    try {
      await updateProfile({ name: profileForm.name.trim(), phone: profileForm.phone.trim() });
      setIsProfileModalOpen(false);
      notify('success', 'Your details have been updated.');
    } catch (err) {
      setProfileError(err.message || 'Could not save your details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (event) => {
    event.preventDefault();
    setAddressError('');
    setSavingAddress(true);
    try {
      await api.addresses.create(addressForm);
      setIsAddressModalOpen(false);
      setAddressForm({ fullName: '', phone: '', address: '', city: '', state: '', pincode: '' });
      notify('success', 'Address saved to your account.');
      await loadAddresses();
    } catch (err) {
      setAddressError(err.message || 'Could not save this address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleRemoveAddress = async (id) => {
    try {
      await api.addresses.remove(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      notify('success', 'Address removed.');
    } catch (err) {
      notify('error', err.message || 'Could not remove this address.');
    }
  };

  const handleOpenDocument = async (order, kind) => {
    try {
      await api.orders.openDocument(order.orderNumber, kind);
    } catch (err) {
      notify('error', err.message || `Could not open the ${kind}.`);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderNumber}?`)) return;
    try {
      await api.orders.cancelOrder(order.id);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'Cancelled' } : o)));
      notify('success', `${order.orderNumber} has been cancelled.`);
    } catch (err) {
      notify('error', err.message || 'Could not cancel this order.');
    }
  };

  // Signed out
  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 gap-5 bg-canvas">
        <div className="space-y-2">
          <span className="type-eyebrow text-emerald-default block">ORIVIDA membership</span>
          <h1 className="type-display text-3xl text-ink">Sign in to your account</h1>
          <p className="text-sm text-ink-soft max-w-md">
            Track orders, save delivery addresses and keep a wishlist of the pieces you are waiting for.
          </p>
        </div>
        <Link
          to="/login"
          className="px-8 py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const initial = (user.name || user.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="bg-canvas min-h-[60vh]">
      {/* Header */}
      <header className="bg-emerald-darker text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8">
            <div className="flex items-center gap-5">
              {user.photoURL && !photoFailed ? (
                <img
                  src={user.photoURL} alt="" onError={() => setPhotoFailed(true)}
                  className="w-16 h-16 rounded-full object-cover border border-emerald-default"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-deep border border-emerald-default flex items-center justify-center type-heading text-2xl text-gold-light">
                  {initial}
                </div>
              )}

              <div className="space-y-1">
                <span className="type-eyebrow text-gold-mid block">
                  {user.isAdmin ? 'Administrator' : 'Member account'}
                </span>
                <h1 className="type-display text-3xl text-white">{user.name || 'Valued member'}</h1>
                <p className="text-sm text-emerald-light/70">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {user.isAdmin && (
                <Link
                  to="/admin"
                  className="px-5 py-2.5 border border-emerald-default text-emerald-light hover:bg-emerald-deep text-sm transition-colors"
                >
                  Admin portal
                </Link>
              )}
              <button
                onClick={() => { setProfileForm({ name: user.name || '', phone: user.phone || '' }); setProfileError(''); setIsProfileModalOpen(true); }}
                className="px-5 py-2.5 border border-emerald-default text-emerald-light hover:bg-emerald-deep text-sm transition-colors"
              >
                Edit details
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-emerald-light/70 hover:text-white text-sm transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-line bg-white sticky top-[72px] sm:top-20 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 flex gap-8">
          {[
            { id: 'orders', label: 'Orders', icon: Package, count: orders.length },
            { id: 'addresses', label: 'Addresses', icon: MapPin, count: addresses.length },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`flex items-center gap-2 py-4 border-b-2 text-sm transition-colors ${
                activeTab === id
                  ? 'border-emerald-default text-emerald-default'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className="text-ink-faint tabular">({count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14 space-y-6">
        {banner && (
          <div role="status" className={`flex items-center gap-2.5 px-4 py-3 border text-sm ${
            banner.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-light border-emerald-default/25 text-emerald-deep'
          }`}>
            <Check className="w-4 h-4 shrink-0" />
            {banner.text}
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          loadingOrders ? (
            <div className="surface-card p-16 flex flex-col items-center gap-3 text-ink-soft">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-sm">Loading your orders…</p>
            </div>
          ) : ordersError ? (
            <div className="surface-card p-16 text-center space-y-3">
              <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
              <p className="text-sm text-ink">{ordersError}</p>
              <button onClick={loadOrders} className="text-sm text-emerald-default link-underline">Try again</button>
            </div>
          ) : orders.length === 0 ? (
            <div className="surface-card p-16 text-center space-y-4">
              <Package className="w-10 h-10 text-ink-faint mx-auto" strokeWidth={1} />
              <div className="space-y-1.5">
                <p className="type-heading text-2xl text-ink">No orders yet</p>
                <p className="text-sm text-ink-soft max-w-md mx-auto">
                  When you place an order it will appear here with live tracking.
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
            <div className="space-y-4">
              {orders.map((order) => {
                const canCancel = ['Processing', 'Pending'].includes(order.status);
                return (
                  <article key={order.id} className="surface-card p-6 sm:p-8 space-y-5">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="type-price text-lg text-ink">{order.orderNumber}</h2>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_TONE[order.status] || 'bg-emerald-subtle text-ink-soft'}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-ink-soft">
                          Placed{' '}
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                            : '—'}
                          {order.deliverySlot ? ` · ${order.deliverySlot}` : ''}
                        </p>
                      </div>

                      <div className="sm:text-right space-y-1">
                        <span className="type-eyebrow text-ink-soft block">Total</span>
                        <p className="type-price text-xl text-ink">{formatPrice(order.total)}</p>
                      </div>
                    </div>

                    {order.items.length > 0 && (
                      <ul className="space-y-3 pt-4 border-t border-line">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3.5">
                            {item.image && (
                              <img src={item.image} alt="" className="w-12 h-14 object-cover border border-line shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm text-ink truncate">{item.name}</p>
                              <p className="text-xs text-ink-faint">
                                Qty {item.quantity}{item.variantName ? ` · ${item.variantName}` : ''}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {order.delhiveryAwb ? (
                      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-emerald-subtle text-sm">
                        <Truck className="w-4 h-4 text-emerald-default shrink-0" />
                        <span className="text-ink-soft">
                          Delhivery AWB:{' '}
                          <span className="text-ink tabular">{order.delhiveryAwb}</span>
                          {order.deliveryStatus && (
                            <span className="text-ink-faint"> · {order.deliveryStatus}</span>
                          )}
                        </span>
                        {order.trackingUrl && (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-default link-underline ml-auto"
                          >
                            Track parcel
                          </a>
                        )}
                      </div>
                    ) : order.trackingNumber ? (
                      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-emerald-subtle text-sm">
                        <Truck className="w-4 h-4 text-emerald-default shrink-0" />
                        <span className="text-ink-soft">
                          {order.courierName || 'India Post'} tracking:{' '}
                          <span className="text-ink tabular">{order.trackingNumber}</span>
                        </span>
                        <a
                          href="https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-default link-underline ml-auto"
                        >
                          Track parcel
                        </a>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-line">
                      <Link
                        to={`/orders/${order.orderNumber}`}
                        className="px-5 py-2.5 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.14em] transition-colors"
                      >
                        View receipt
                      </Link>
                      <button
                        onClick={() => handleOpenDocument(order, 'invoice')}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-line text-ink hover:border-ink text-[11px] uppercase tracking-[0.14em] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> Invoice
                      </button>
                      {order.refundedAmount > 0 && (
                        <span className="inline-flex items-center px-3 py-2.5 text-sm text-emerald-default">
                          {formatPrice(order.refundedAmount)} refunded
                        </span>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="px-5 py-2.5 text-sm text-ink-soft hover:text-rose-600 transition-colors"
                        >
                          Cancel order
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )
        )}

        {/* Addresses */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-ink-soft">Saved to your account and available at checkout on any device.</p>
              <button
                onClick={() => { setAddressError(''); setIsAddressModalOpen(true); }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.14em] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add address
              </button>
            </div>

            {loadingAddresses ? (
              <div className="surface-card p-16 flex flex-col items-center gap-3 text-ink-soft">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-sm">Loading your addresses…</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="surface-card p-16 text-center space-y-2">
                <MapPin className="w-9 h-9 text-ink-faint mx-auto" strokeWidth={1} />
                <p className="type-heading text-xl text-ink">No saved addresses</p>
                <p className="text-sm text-ink-soft">Add one now to speed up your next checkout.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="surface-card p-6 space-y-3 relative">
                    {addr.is_primary && (
                      <span className="type-eyebrow text-emerald-default">Primary</span>
                    )}
                    <button
                      onClick={() => handleRemoveAddress(addr.id)}
                      className="absolute top-4 right-4 p-1 text-ink-faint hover:text-rose-600 transition-colors"
                      aria-label={`Remove address for ${addr.full_name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-sm text-ink">{addr.full_name}</p>
                    <address className="text-sm text-ink-soft not-italic leading-relaxed">
                      {addr.address}<br />
                      {addr.city}, {addr.state} {addr.pincode}
                      {addr.phone && <span className="block tabular mt-1">{addr.phone}</span>}
                    </address>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-line max-w-md w-full shadow-overlay">
            <div className="flex justify-between items-center p-6 border-b border-line">
              <h2 className="type-heading text-xl text-ink">Your details</h2>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-1 text-ink-faint hover:text-ink transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              {profileError && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {profileError}
                </div>
              )}

              <div>
                <label className={labelClass}>Full name</label>
                <input type="text" required value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Phone number</label>
                <input type="tel" value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className={inputClass} placeholder="98765 43210" />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3 bg-emerald-default hover:bg-emerald-deep disabled:opacity-60 text-white text-[11px] uppercase tracking-[0.16em] inline-flex items-center justify-center gap-2 transition-colors"
              >
                {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Address modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-line max-w-md w-full my-8 shadow-overlay">
            <div className="flex justify-between items-center p-6 border-b border-line">
              <h2 className="type-heading text-xl text-ink">Add an address</h2>
              <button onClick={() => setIsAddressModalOpen(false)} className="p-1 text-ink-faint hover:text-ink transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="p-6 space-y-4">
              {addressError && (
                <div role="alert" className="flex items-start gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {addressError}
                </div>
              )}
              <div>
                <label className={labelClass}>Full name</label>
                <input type="text" required value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Phone</label>
                <input type="tel" required value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Street address</label>
                <input type="text" required value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" required value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input type="text" required value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Pincode</label>
                <input type="text" required inputMode="numeric" maxLength={6} value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  className={`${inputClass} tabular`} />
              </div>

              <button
                type="submit"
                disabled={savingAddress}
                className="w-full py-3 bg-emerald-default hover:bg-emerald-deep disabled:opacity-60 text-white text-[11px] uppercase tracking-[0.16em] inline-flex items-center justify-center gap-2 transition-colors"
              >
                {savingAddress && <Loader2 className="w-4 h-4 animate-spin" />}
                Save address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
