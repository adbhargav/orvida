import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { COMPANY } from '../config/company';
import usePageMeta from '../hooks/usePageMeta';

const inputClass =
  'w-full px-3.5 py-3 border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default transition-colors';

const labelClass = 'type-eyebrow text-ink-soft block mb-1.5';

const OCCASIONS = [
  'Corporate VIP gifting',
  'Wedding favours',
  'Employee appreciation',
  'Client onboarding',
  'Festive hampers',
  'Other',
];

const QUANTITIES = ['Under 25 hampers', '25 – 50 hampers', '50 – 150 hampers', '150 – 500 hampers', '500+ hampers'];

const BUDGETS = ['₹2,000 – ₹5,000', '₹5,000 – ₹10,000', '₹10,000 – ₹25,000', '₹25,000 and above'];

const SERVICES = [
  { title: 'Curated selection', copy: 'We compose each hamper around your recipients, occasion and budget.' },
  { title: 'Brand finishing', copy: 'Gold-embossed plaques, custom ribbon and printed lineage cards.' },
  { title: 'Coordinated dispatch', copy: 'Multi-address delivery scheduled across cities on a date you choose.' },
];

export default function GiftingConcierge() {
  usePageMeta({ title: 'Bespoke Gifting Concierge | ORIVIDA', path: '/gifting-concierge', description: 'Corporate gifting and bespoke plant hampers curated by ORIVIDA — tell us the occasion and our concierge will design it.' });

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '',
    occasion: OCCASIONS[0], quantity: QUANTITIES[1], budgetPerHamper: BUDGETS[1], notes: '',
  });

  const update = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Persisted to the enquiries table, acknowledged by email, and surfaced
      // in the admin portal for the concierge team to work.
      await api.enquiries.create(formData);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'We could not send your enquiry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-canvas">
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
          <div className="max-w-2xl space-y-5">
            <span className="type-eyebrow text-emerald-default block">Private concierge service</span>
            <h1 className="type-display text-4xl sm:text-[3rem] text-ink">
              Bespoke gifting, composed for you
            </h1>
            <p className="text-ink-soft text-lg leading-relaxed">
              Wedding favours, corporate hamper programmes and VIP client appreciation — designed, branded and
              delivered by our concierge team.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          {/* Services */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-8">
              {SERVICES.map((service, idx) => (
                <div key={service.title} className="space-y-2">
                  <span className="type-price text-xl text-emerald-default">0{idx + 1}</span>
                  <h2 className="type-heading text-lg text-ink">{service.title}</h2>
                  <p className="text-ink-soft leading-relaxed">{service.copy}</p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-emerald-subtle space-y-2">
              <p className="type-eyebrow text-emerald-default">Prefer to talk?</p>
              <p className="text-sm text-ink-soft">
                Reach the concierge directly on{' '}
                <a href={COMPANY.phoneHref} className="text-emerald-default link-underline">{COMPANY.phone}</a>{' '}
                or{' '}
                <a
                  href={COMPANY.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-default link-underline"
                >
                  WhatsApp
                </a>.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="surface-card p-10 sm:p-14 text-center space-y-5">
                <div className="w-14 h-14 rounded-full bg-emerald-light border border-emerald-default/30 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-emerald-default" />
                </div>
                <div className="space-y-2">
                  <h2 className="type-display text-2xl text-ink">Your enquiry is with us</h2>
                  <p className="text-ink-soft max-w-md mx-auto leading-relaxed">
                    A concierge will be in touch within one business day at{' '}
                    <span className="text-ink">{formData.email}</span> with a tailored proposal.
                  </p>
                </div>
                <Link
                  to="/category/gifting-solutions"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
                >
                  Browse gifting <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="surface-card p-6 sm:p-10 space-y-6">
                <h2 className="type-heading text-xl text-ink pb-4 border-b border-line">Request a proposal</h2>

                {error && (
                  <div role="alert" className="flex items-start gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 text-sm text-rose-800">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className={labelClass}>Your name</label>
                    <input id="name" type="text" required value={formData.name} onChange={update('name')} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="company" className={labelClass}>Company (optional)</label>
                    <input id="company" type="text" value={formData.company} onChange={update('company')} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input id="email" type="email" required value={formData.email} onChange={update('email')} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>Phone</label>
                    <input id="phone" type="tel" required inputMode="numeric" value={formData.phone} onChange={update('phone')} className={`${inputClass} tabular`} />
                  </div>
                </div>

                <div>
                  <label htmlFor="occasion" className={labelClass}>Occasion</label>
                  <select id="occasion" value={formData.occasion} onChange={update('occasion')} className={inputClass}>
                    {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="quantity" className={labelClass}>Quantity</label>
                    <select id="quantity" value={formData.quantity} onChange={update('quantity')} className={inputClass}>
                      {QUANTITIES.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="budget" className={labelClass}>Budget per hamper</label>
                    <select id="budget" value={formData.budgetPerHamper} onChange={update('budgetPerHamper')} className={inputClass}>
                      {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className={labelClass}>Anything else we should know?</label>
                  <textarea
                    id="notes" rows={4} value={formData.notes} onChange={update('notes')}
                    className={`${inputClass} resize-y`}
                    placeholder="Delivery cities, branding requirements, dates…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 bg-emerald-default hover:bg-emerald-deep disabled:opacity-60 text-white text-[11px] uppercase tracking-[0.16em] inline-flex items-center justify-center gap-2 transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Sending…' : 'Send enquiry'}
                </button>

                <p className="text-xs text-ink-faint text-center">
                  We reply within one business day. No obligation.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
