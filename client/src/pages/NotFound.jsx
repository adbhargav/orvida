import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';
import useRedirectFallback from '../hooks/useRedirectFallback';

const SUGGESTIONS = [
  { label: 'Plants', to: '/category/plants' },
  { label: 'Gifting Solutions', to: '/category/gifting-solutions' },
  { label: 'Balcony Makeover', to: '/category/balcony-makeover' },
  { label: 'Arts & Décor', to: '/category/arts-decor' },
];

export default function NotFound() {
  usePageMeta({ title: 'Page Not Found | ORIVIDA', path: '/404', robots: 'noindex, follow' });

  // An indexed URL that has since moved should still reach its destination.
  const redirecting = useRedirectFallback(true);
  if (redirecting) return null;

  return (
    <div className="min-h-[70vh] bg-canvas flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-3">
          <span className="type-eyebrow text-emerald-default block">Error 404</span>
          <h1 className="type-display text-4xl sm:text-5xl text-ink">
            This path has grown over
          </h1>
          <p className="text-ink-soft leading-relaxed">
            The page you were looking for has been moved, retired, or never existed. Let us guide you back to the
            collection.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return home
          </Link>
          <Link
            to="/category/plants"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
          >
            Browse the collection <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="pt-8 border-t border-line space-y-4">
          <p className="type-eyebrow text-ink-faint">Or explore</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="px-4 py-2 border border-line text-sm text-ink-soft hover:border-emerald-default hover:text-emerald-default transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
