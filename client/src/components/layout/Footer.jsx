import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Award, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { api } from '../../services/api';
import { COMPANY, companyAddressLines } from '../../config/company';

const ASSURANCES = [
  { icon: Truck, title: 'White-glove express', copy: 'Temperature-controlled nursery shipping' },
  { icon: ShieldCheck, title: '7-day health guarantee', copy: 'Replacement assurance on live plants' },
  { icon: Award, title: 'Master artisan arts', copy: 'Authentic heritage handicrafts' },
  { icon: Sparkles, title: 'Bespoke concierge', copy: 'Custom hampers and corporate styling' },
];

const LINK_GROUPS = [
  {
    heading: 'Shop',
    links: [
      { label: 'Plants', to: '/category/plants' },
      { label: 'Gifting Solutions', to: '/category/gifting-solutions' },
      { label: 'Balcony Makeover', to: '/category/balcony-makeover' },
      { label: 'Arts & Décor', to: '/category/arts-decor' },
    ],
  },
  {
    heading: 'Service',
    links: [
      { label: 'Bespoke Gifting', to: '/gifting-concierge' },
      { label: 'Your Account', to: '/account' },
      { label: 'Wishlist', to: '/wishlist' },
      { label: 'Track an Order', to: '/account' },
    ],
  },
  {
    heading: 'The House',
    links: [
      { label: 'Our Story', to: '/about' },
      { label: 'Craftsmanship', to: '/about' },
      { label: 'Plant Care', to: '/about' },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    setSaving(true);
    setError('');
    try {
      // Stored in newsletter_subscribers and visible in the admin portal.
      await api.newsletter.subscribe(email.trim());
      setSubscribed(true);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Could not subscribe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <footer className="bg-emerald-darker text-white">
      {/* Assurances */}
      <div className="border-b border-emerald-deep">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {ASSURANCES.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex gap-3.5">
              <Icon className="w-5 h-5 text-gold-mid shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="space-y-0.5">
                <p className="text-sm text-white">{title}</p>
                <p className="text-sm text-emerald-light/60 leading-relaxed">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-5">
          <Link to="/" aria-label="ORIVIDA home">
            <img src={logoImg} alt="ORIVIDA" className="h-14 w-auto object-contain brightness-0 invert" />
          </Link>
          <p className="text-sm text-emerald-light/70 leading-relaxed max-w-sm">
            Hand-nurtured rare botanicals, bespoke plant hampers and heritage Bastar bell metal craft — curated for
            homes that treat living things as heirlooms.
          </p>

          <address className="space-y-1.5 text-sm text-emerald-light/70 not-italic leading-relaxed">
            {companyAddressLines().map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="pt-2">
              <a href={COMPANY.phoneHref} className="hover:text-white transition-colors">{COMPANY.phone}</a>
            </p>
            <p>
              <a href={`mailto:${COMPANY.email}`} className="hover:text-white transition-colors">{COMPANY.email}</a>
            </p>
          </address>
        </div>

        {LINK_GROUPS.map((group) => (
          <nav key={group.heading} className="lg:col-span-2 space-y-4">
            <h3 className="type-eyebrow text-gold-mid">{group.heading}</h3>
            <ul className="space-y-2.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-emerald-light/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="lg:col-span-2 space-y-4">
          <h3 className="type-eyebrow text-gold-mid">Newsletter</h3>
          <p className="text-sm text-emerald-light/70 leading-relaxed">
            Rare specimen drops and private previews.
          </p>

          {subscribed ? (
            <p className="text-sm text-gold-light">Thank you — you are on the list.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="Email address"
                className="w-full bg-transparent border-b border-emerald-default py-2 text-sm text-white placeholder:text-emerald-light/40 focus:outline-none focus:border-gold-mid transition-colors"
              />
              {error && <p className="text-xs text-rose-300">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white hover:text-gold-mid disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Subscribe {!saving && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Legal */}
      <div className="border-t border-emerald-deep">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-emerald-light/50">
          <p>© {new Date().getFullYear()} {COMPANY.name}. {COMPANY.tagline}.</p>
          <p>Secure payments by Razorpay · UPI, cards, netbanking and wallets</p>
        </div>
      </div>
    </footer>
  );
}
