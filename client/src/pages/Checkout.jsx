import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const inputClass =
  'w-full px-3.5 py-3 border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default transition-colors';

const labelClass = 'type-eyebrow text-ink-soft block mb-1.5';

const STEPS = [
  { num: 1, label: 'Shipping' },
  { num: 2, label: 'Payment' },
];

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) return resolve(true);

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems, clearCart, subtotal, shippingFee, discountAmount,
    appliedPromo, getPricingPayload,
  } = useCart();

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Live courier quote for the entered pincode: null until a valid pincode is
  // typed, then { status: 'loading' | 'ok' | 'unserviceable', fee, source }.
  const [shipQuote, setShipQuote] = useState(null);

  const [formData, setFormData] = useState(() => {
    const base = {
      fullName: user?.name || '', email: user?.email || '', phone: user?.phone || '',
      address: '', city: '', state: '', pincode: '',
    };
    try {
      const saved = JSON.parse(localStorage.getItem('orvida_saved_address'));
      return saved ? { ...base, ...saved, email: saved.email || base.email } : base;
    } catch {
      return base;
    }
  });

  useEffect(() => { loadRazorpayScript(); }, []);

  // Quote delivery through the backend (which asks Delhivery) as soon as a
  // complete pincode is present. Debounced so typing doesn't spam the API.
  const pincodeDigits = formData.pincode.replace(/\D/g, '');
  useEffect(() => {
    if (pincodeDigits.length !== 6 || cartItems.length === 0) {
      setShipQuote(null);
      return;
    }

    let cancelled = false;
    setShipQuote({ status: 'loading' });
    const handle = setTimeout(async () => {
      try {
        const res = await api.shipping.quote(getPricingPayload(), pincodeDigits);
        if (cancelled) return;
        if (!res.serviceable) {
          setShipQuote({ status: 'unserviceable' });
        } else {
          setShipQuote({ status: 'ok', fee: Number(res.shippingFee) || 0, source: res.source, city: res.city });
        }
      } catch {
        // A failed quote falls back to the standard estimate; the server
        // recomputes the authoritative figure at payment time anyway.
        if (!cancelled) setShipQuote(null);
      }
    }, 450);

    return () => { cancelled = true; clearTimeout(handle); };
  }, [pincodeDigits, cartItems.length, getPricingPayload]);

  const quotedShipping = shipQuote?.status === 'ok' ? shipQuote.fee : shippingFee;
  const payableTotal = Math.max(0, Math.round(subtotal - discountAmount + quotedShipping));

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone || '',
    }));
  }, [user]);

  const validate = () => {
    const { fullName, email, phone, pincode, address, city, state } = formData;
    if (!fullName.trim() || fullName.trim().length < 2) return 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.';
    if (phone.replace(/\D/g, '').length < 10) return 'Please enter a valid 10-digit phone number.';
    if (pincode.replace(/\D/g, '').length !== 6) return 'Please enter a valid 6-digit pincode.';
    if (address.trim().length < 5) return 'Please enter your complete street address.';
    if (city.trim().length < 2) return 'Please enter your city.';
    if (state.trim().length < 2) return 'Please enter your state.';
    return null;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const updated = { ...formData, [name]: value };
    setErrorMessage('');
    setFormData(updated);
    try {
      localStorage.setItem('orvida_saved_address', JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const goToStep = (next) => {
    if (next > 1) {
      const problem = validate();
      if (problem) return setErrorMessage(problem);
      if (shipQuote?.status === 'unserviceable') {
        return setErrorMessage('Delivery is not available to this pincode yet. Please try another address.');
      }
    }
    setErrorMessage('');
    setStep(next);
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    const problem = validate();
    if (problem) return setErrorMessage(problem);

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error('The payment gateway could not load. Please check your connection.');
      }

      // The server prices the cart and opens the Razorpay order.
      const razorOrderRes = await api.orders.createRazorpayOrder(getPricingPayload(), {
        couponCode: appliedPromo || null,
        pincode: pincodeDigits,
        notes: { email: formData.email, customerName: formData.fullName },
      });

      const { order: razorpayOrder, key } = razorOrderRes;

      const rzp = new window.Razorpay({
        key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'ORIVIDA',
        description: 'Luxury botanicals and artisan craft',
        order_id: razorpayOrder.id,
        prefill: { name: formData.fullName, email: formData.email, contact: formData.phone },
        theme: { color: '#154734' },
        handler: async (response) => {
          try {
            const verifyRes = await api.orders.verifyPayment({
              razorpayOrderId: response.razorpay_order_id || razorpayOrder.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              items: getPricingPayload(),
              couponCode: appliedPromo || null,
              // Older saved addresses may still carry a deliverySlot key.
              shippingAddress: (({ deliverySlot, ...rest }) => rest)(formData),
            });

            const ref = verifyRes.order?.orderNumber || verifyRes.order?.order_number || verifyRes.order?.id;
            clearCart();
            setIsProcessing(false);
            navigate(`/orders/${ref}`);
          } catch (err) {
            setErrorMessage(
              `${err.message || 'We could not confirm your payment.'} Your payment reference is ${response.razorpay_payment_id} — please contact support if you were charged.`
            );
            setIsProcessing(false);
          }
        },
        modal: { ondismiss: () => setIsProcessing(false) },
      });

      rzp.on('payment.failed', (response) => {
        setIsProcessing(false);
        setErrorMessage(response.error?.description || 'The payment did not go through. Please try again.');
      });

      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Could not start the payment.');
    }
  };

  // Purchasing requires an account: orders, invoices and cancellations are
  // all owner-scoped, and the server rejects anonymous checkouts anyway.
  if (!user) {
    return (
      <div className="min-h-[60vh] bg-canvas flex flex-col items-center justify-center text-center px-6 gap-5">
        <Lock className="w-8 h-8 text-emerald-default" strokeWidth={1.5} />
        <h1 className="type-display text-3xl text-ink">Sign in to check out</h1>
        <p className="text-sm text-ink-soft max-w-sm">
          Your cart is saved. Sign in or create an account to place your order and track it afterwards.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/login?redirect=/checkout"
            className="px-8 py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup?redirect=/checkout"
            className="px-8 py-3.5 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] bg-canvas flex flex-col items-center justify-center text-center px-6 gap-5">
        <h1 className="type-display text-3xl text-ink">Nothing to check out</h1>
        <p className="text-sm text-ink-soft">Your cart is empty.</p>
        <Link
          to="/category/plants"
          className="px-8 py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-canvas min-h-[60vh]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
        {/* Steps */}
        <div className="max-w-md mx-auto mb-12">
          <ol className="flex justify-between relative">
            <div className="absolute top-[13px] left-0 right-0 h-px bg-line" aria-hidden="true" />
            <div
              className="absolute top-[13px] left-0 h-px bg-emerald-default transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              aria-hidden="true"
            />
            {STEPS.map((s) => (
              <li key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                    step >= s.num
                      ? 'bg-emerald-default text-white'
                      : 'bg-white border border-line text-ink-faint'
                  }`}
                >
                  {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </span>
                <span className={`type-eyebrow ${step >= s.num ? 'text-emerald-default' : 'text-ink-faint'}`}>
                  {s.label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {errorMessage && (
          <div role="alert" className="max-w-xl mx-auto mb-8 flex items-start gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 text-sm text-rose-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Form */}
          <div className="lg:col-span-7">
            {step === 1 && (
              <section className="surface-card p-6 sm:p-8 space-y-6 animate-fadeIn">
                <h2 className="type-heading text-xl text-ink">Shipping address</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="fullName" className={labelClass}>Full name</label>
                    <input id="fullName" name="fullName" type="text" required autoComplete="name"
                      value={formData.fullName} onChange={handleChange} className={inputClass} placeholder="Your name" />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input id="email" name="email" type="email" required autoComplete="email"
                      value={formData.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>Phone</label>
                    <input id="phone" name="phone" type="tel" required inputMode="numeric" maxLength={10} autoComplete="tel"
                      value={formData.phone} onChange={handleChange} className={`${inputClass} tabular`} placeholder="9876543210" />
                  </div>
                  <div>
                    <label htmlFor="pincode" className={labelClass}>Pincode</label>
                    <input id="pincode" name="pincode" type="text" required inputMode="numeric" maxLength={6} autoComplete="postal-code"
                      value={formData.pincode} onChange={handleChange} className={`${inputClass} tabular`} placeholder="560038" />
                    {shipQuote?.status === 'loading' && (
                      <p className="text-xs text-ink-faint flex items-center gap-1.5 mt-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking delivery to this pincode…
                      </p>
                    )}
                    {shipQuote?.status === 'ok' && (
                      <p className="text-xs text-emerald-default mt-1.5">
                        Delivery available{shipQuote.city ? ` to ${shipQuote.city}` : ''} —{' '}
                        {shipQuote.fee === 0 ? 'complimentary shipping' : `${formatPrice(shipQuote.fee)} shipping`}
                      </p>
                    )}
                    {shipQuote?.status === 'unserviceable' && (
                      <p className="text-xs text-rose-600 mt-1.5">
                        We cannot deliver to this pincode yet.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className={labelClass}>Street address</label>
                  <input id="address" name="address" type="text" required autoComplete="street-address"
                    value={formData.address} onChange={handleChange} className={inputClass}
                    placeholder="Flat, building, street, area" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="city" className={labelClass}>City</label>
                    <input id="city" name="city" type="text" required autoComplete="address-level2"
                      value={formData.city} onChange={handleChange} className={inputClass} placeholder="Bengaluru" />
                  </div>
                  <div>
                    <label htmlFor="state" className={labelClass}>State</label>
                    <input id="state" name="state" type="text" required autoComplete="address-level1"
                      value={formData.state} onChange={handleChange} className={inputClass} placeholder="Karnataka" />
                  </div>
                </div>

                <button
                  onClick={() => goToStep(2)}
                  className="w-full py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
                >
                  Continue to payment
                </button>
              </section>
            )}

            {step === 2 && (
              <section className="surface-card p-6 sm:p-8 space-y-6 animate-fadeIn">
                <h2 className="type-heading text-xl text-ink">Payment</h2>

                <div className="p-4 border border-emerald-default bg-emerald-subtle space-y-1">
                  <p className="text-sm text-ink">Razorpay secure checkout</p>
                  <p className="text-sm text-ink-soft">UPI, cards, netbanking and wallets</p>
                </div>

                <div className="text-sm text-ink-soft space-y-1">
                  <p className="text-ink">Delivering to</p>
                  <address className="not-italic leading-relaxed">
                    {formData.fullName}, {formData.address}, {formData.city}, {formData.state} {formData.pincode}
                  </address>
                  <button onClick={() => goToStep(1)} className="text-emerald-default link-underline">Edit</button>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-3">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 bg-emerald-default hover:bg-emerald-deep disabled:opacity-60 text-white text-[11px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                      <><Lock className="w-3.5 h-3.5" /> Pay {formatPrice(payableTotal)}</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="w-full py-3 text-sm text-ink-soft hover:text-ink transition-colors"
                  >
                    Back to shipping
                  </button>
                </form>

                <p className="text-xs text-ink-faint text-center">
                  Your order total is calculated on our servers at the moment of payment.
                </p>
              </section>
            )}
          </div>

          {/* Summary */}
          <aside className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="surface-card p-6 sm:p-8 space-y-5">
              <h2 className="type-heading text-lg text-ink border-b border-line pb-4">
                Order summary <span className="text-ink-faint tabular text-base">({cartItems.length})</span>
              </h2>

              <ul className="space-y-4 max-h-72 overflow-y-auto">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3.5">
                    {item.image && (
                      <img src={item.image} alt="" className="w-14 h-16 object-cover border border-line shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink line-clamp-1">{item.name}</p>
                      <p className="text-xs text-ink-faint">
                        Qty {item.quantity}{item.variant && item.variant !== 'Standard' ? ` · ${item.variant}` : ''}
                      </p>
                    </div>
                    <span className="type-price text-sm text-ink shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="space-y-2.5 text-sm pt-4 border-t border-line">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="text-ink tabular">{formatPrice(subtotal)}</dd>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Discount{appliedPromo ? ` (${appliedPromo})` : ''}</dt>
                    <dd className="text-emerald-default tabular">−{formatPrice(discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-soft">
                    Shipping
                    {shipQuote?.status === 'ok' && shipQuote.source?.startsWith('delhivery') && (
                      <span className="block text-[11px] text-ink-faint">via Delhivery</span>
                    )}
                  </dt>
                  <dd className="text-ink tabular">
                    {shipQuote?.status === 'loading'
                      ? '…'
                      : quotedShipping === 0 ? 'Complimentary' : formatPrice(quotedShipping)}
                  </dd>
                </div>
                <div className="flex justify-between pt-3 border-t border-line">
                  <dt className="type-heading text-base text-ink">Total</dt>
                  <dd className="type-price text-xl text-ink">{formatPrice(payableTotal)}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
