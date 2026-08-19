import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Check, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import usePageMeta from '../hooks/usePageMeta';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const STAGES = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function OrderConfirmation() {
  usePageMeta({ title: 'Your Order | ORIVIDA', path: '/orders', robots: 'noindex, follow' });

  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Read the real order rather than trusting whatever the browser
        // happened to cache after checkout.
        const res = await api.orders.getById(id);
        if (cancelled) return;
        setOrder(res.order);

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.5 },
            colors: ['#154734', '#A8823C', '#E8D5A6', '#FFFFFF'],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.status === 401
              ? 'Please sign in to view this order.'
              : err.status === 403 || err.status === 404
              ? 'We could not find that order on your account.'
              : err.message || 'Could not load this order.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-ink-soft">
        <Loader2 className="w-5 h-5 animate-spin" />
        <p className="text-sm">Confirming your order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <AlertCircle className="w-8 h-8 text-ink-faint" strokeWidth={1.5} />
        <div className="space-y-1.5">
          <p className="type-heading text-2xl text-ink">Order unavailable</p>
          <p className="text-sm text-ink-soft max-w-md">{error}</p>
        </div>
        <Link
          to="/account"
          className="px-7 py-3 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
        >
          Go to your account
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'Cancelled';
  const currentStage = STAGES.indexOf(order.status);

  return (
    <div className="bg-canvas">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 sm:py-20 space-y-10">
        {/* Confirmation */}
        <header className="text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-light border border-emerald-default/30 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-emerald-default" />
          </div>

          <div className="space-y-2">
            <span className="type-eyebrow text-emerald-default block">Order confirmed</span>
            <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Thank you for your order</h1>
            <p className="text-ink-soft max-w-md mx-auto leading-relaxed">
              Your pieces are being prepared at our nursery atelier. A confirmation has been sent to{' '}
              <span className="text-ink">{order.shippingAddress?.email}</span>.
            </p>
          </div>

          <p className="type-price text-lg text-ink">{order.orderNumber}</p>
        </header>

        {/* Progress */}
        {!isCancelled && (
          <div className="surface-card p-6 sm:p-8">
            <div className="flex justify-between relative">
              <div className="absolute top-[7px] left-0 right-0 h-px bg-line" aria-hidden="true" />
              <div
                className="absolute top-[7px] left-0 h-px bg-emerald-default transition-all duration-700"
                style={{ width: `${(Math.max(0, currentStage) / (STAGES.length - 1)) * 100}%` }}
                aria-hidden="true"
              />
              {STAGES.map((stage, idx) => (
                <div key={stage} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                      idx <= currentStage
                        ? 'bg-emerald-default border-emerald-default'
                        : 'bg-white border-line-strong'
                    }`}
                  />
                  <span className={`text-[10px] text-center leading-tight ${idx <= currentStage ? 'text-ink' : 'text-ink-faint'}`}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="px-5 py-4 bg-rose-50 border border-rose-200 text-sm text-rose-800">
            This order was cancelled. Any payment will be refunded to the original method within 5–7 business days.
          </div>
        )}

        {/* Summary */}
        <section className="surface-card">
          <div className="px-6 sm:px-8 py-5 border-b border-line">
            <h2 className="type-heading text-lg text-ink">Order summary</h2>
          </div>

          <ul className="divide-y divide-line">
            {order.items.map((item, idx) => (
              <li key={idx} className="px-6 sm:px-8 py-4 flex items-center gap-4">
                {item.image && (
                  <img src={item.image} alt="" className="w-14 h-16 object-cover border border-line shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink">{item.name}</p>
                  <p className="text-xs text-ink-faint">
                    Qty {item.quantity}{item.variantName ? ` · ${item.variantName}` : ''}
                  </p>
                </div>
                <span className="type-price text-sm text-ink shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="px-6 sm:px-8 py-5 space-y-2 text-sm border-t border-line">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="text-ink tabular">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Discount</dt>
                <dd className="text-emerald-default tabular">−{formatPrice(order.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd className="text-ink tabular">
                {order.shippingFee === 0 ? 'Complimentary' : formatPrice(order.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between pt-3 border-t border-line">
              <dt className="type-heading text-base text-ink">Total paid</dt>
              <dd className="type-price text-lg text-ink">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        {/* Delivery */}
        <section className="surface-card p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <span className="type-eyebrow text-ink-soft">Delivering to</span>
            <address className="text-sm text-ink not-italic leading-relaxed">
              {order.shippingAddress?.fullName}<br />
              {order.shippingAddress?.address}<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
              {order.shippingAddress?.phone && (
                <span className="block text-ink-soft tabular mt-1">{order.shippingAddress.phone}</span>
              )}
            </address>
          </div>

          <div className="space-y-1.5">
            {order.delhiveryAwb && (
              <>
                <span className="type-eyebrow text-ink-soft">Courier</span>
                <p className="text-sm text-ink">
                  Delhivery · AWB <span className="tabular">{order.delhiveryAwb}</span>
                </p>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl} target="_blank" rel="noreferrer"
                    className="text-sm text-emerald-default link-underline"
                  >
                    Track your shipment
                  </a>
                )}
              </>
            )}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
          <Link
            to="/account"
            className="px-7 py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] text-center transition-colors"
          >
            View your orders
          </Link>
          <Link
            to="/category/plants"
            className="px-7 py-3.5 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.16em] text-center inline-flex items-center justify-center gap-2 transition-colors"
          >
            Continue shopping <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
