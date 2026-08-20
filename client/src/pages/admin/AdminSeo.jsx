import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, AlertCircle, Check, ExternalLink, Wand2, ArrowRight, Trash2, Plus,
} from 'lucide-react';
import { api } from '../../services/api';
import { SITE_URL } from '../../lib/seo';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft';

const scoreTone = (score) =>
  score >= 80 ? 'text-emerald-default' : score >= 50 ? 'text-amber-600' : 'text-rose-600';

/** One fill-the-gaps action. Only ever writes fields that are still empty. */
const BULK_ACTIONS = [
  { action: 'alt', label: 'Fill missing image alt text', detail: 'Uses the product name where alt text is blank.' },
  { action: 'description', label: 'Fill missing meta descriptions', detail: 'Uses the product’s own description text.' },
  { action: 'slug', label: 'Generate missing URL slugs', detail: 'Only for products without a slug.' },
];

export default function AdminSeo() {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(null);

  const [missingFilter, setMissingFilter] = useState('title');
  const [missingList, setMissingList] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const [redirects, setRedirects] = useState([]);
  const [redirectForm, setRedirectForm] = useState({ source: '', destination: '' });
  const [redirectError, setRedirectError] = useState('');

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 5000);
  };

  const loadAudit = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [auditRes, redirectRes] = await Promise.all([
        api.seo.audit(),
        api.seo.listRedirects().catch(() => ({ redirects: [] })),
      ]);
      setAudit(auditRes);
      setRedirects(redirectRes.redirects || []);
    } catch (err) {
      setError(err.message || 'Could not load the SEO report.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMissing = useCallback(async (filter) => {
    setListLoading(true);
    try {
      const res = await api.seo.listProducts(filter);
      setMissingList(res.products || []);
    } catch {
      setMissingList([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  useEffect(() => {
    loadMissing(missingFilter);
  }, [missingFilter, loadMissing]);

  const runBulk = async (action) => {
    setBusy(action);
    try {
      const res = await api.seo.bulk(action);
      notify('success', res.message || 'Done.');
      await loadAudit();
      await loadMissing(missingFilter);
    } catch (err) {
      notify('error', err.message || 'That bulk action could not be completed.');
    } finally {
      setBusy(null);
    }
  };

  const handleAddRedirect = async (event) => {
    event.preventDefault();
    setRedirectError('');
    try {
      await api.seo.createRedirect(redirectForm.source.trim(), redirectForm.destination.trim());
      setRedirectForm({ source: '', destination: '' });
      notify('success', 'Redirect saved.');
      const res = await api.seo.listRedirects();
      setRedirects(res.redirects || []);
    } catch (err) {
      setRedirectError(err.message || 'Could not save this redirect.');
    }
  };

  const handleRemoveRedirect = async (id) => {
    try {
      await api.seo.removeRedirect(id);
      setRedirects((prev) => prev.filter((r) => r.id !== id));
      notify('success', 'Redirect removed.');
    } catch (err) {
      notify('error', err.message || 'Could not remove this redirect.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas p-10 flex flex-col items-center justify-center gap-3 text-ink-soft">
        <Loader2 className="w-5 h-5 animate-spin" />
        <p className="text-sm">Auditing your storefront…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Search performance</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">SEO</h1>
          <p className="text-sm text-ink-soft">
            How complete your search metadata is, and what is still worth filling in.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={audit?.sitemapUrl || `${SITE_URL}/sitemap.xml`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-line text-sm text-ink hover:bg-emerald-subtle transition"
          >
            Sitemap <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href={audit?.robotsUrl || `${SITE_URL}/robots.txt`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-line text-sm text-ink hover:bg-emerald-subtle transition"
          >
            robots.txt <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {banner && (
        <div role="status" className={`flex items-center gap-2.5 px-4 py-3 rounded-md border text-sm ${
          banner.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-light border-emerald-default/25 text-emerald-deep'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {banner.text}
        </div>
      )}

      {error ? (
        <div className="surface-card rounded-lg p-10 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{error}</p>
          <button onClick={loadAudit} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      ) : (
        <>
          {/* Health score + checks */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="surface-card rounded-lg p-6 flex flex-col items-center justify-center text-center gap-1">
              <span className="type-eyebrow text-ink-soft">SEO health</span>
              <p className={`type-price text-6xl ${scoreTone(audit.healthScore)}`}>{audit.healthScore}%</p>
              <p className="text-xs text-ink-faint mt-1">
                {audit.products.total} products · {audit.categories.total} categories
              </p>
            </div>

            <div className="surface-card rounded-lg p-6 lg:col-span-2 space-y-2.5">
              <span className="type-eyebrow text-ink-soft">Checks</span>
              <ul className="space-y-1.5">
                {audit.checks.map((check) => (
                  <li key={check.key} className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      {check.score === 100 ? (
                        <Check className="w-3.5 h-3.5 text-emerald-default shrink-0" />
                      ) : (
                        <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${check.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`} />
                      )}
                      <span className={check.score === 100 ? 'text-ink' : 'text-ink-soft'}>{check.label}</span>
                    </span>
                    <span className="text-xs text-ink-faint tabular shrink-0">{check.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Bulk fixes */}
          <section className="surface-card rounded-lg p-6 sm:p-8 space-y-4">
            <div className="space-y-1">
              <h2 className="type-heading text-xl text-ink flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-emerald-default" /> Fill the gaps
              </h2>
              <p className="text-sm text-ink-soft">
                Each action only writes fields that are still empty — anything you wrote by hand is left untouched.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {BULK_ACTIONS.map((item) => (
                <div key={item.action} className="p-4 rounded-md border border-line space-y-2.5">
                  <p className="text-sm text-ink">{item.label}</p>
                  <p className="text-xs text-ink-faint leading-relaxed">{item.detail}</p>
                  <button
                    onClick={() => runBulk(item.action)}
                    disabled={busy === item.action}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-default text-white text-xs font-medium hover:bg-emerald-deep disabled:opacity-50 transition"
                  >
                    {busy === item.action && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Run
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Products still missing something */}
          <section className="surface-card rounded-lg p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap justify-between items-end gap-4">
              <div className="space-y-1">
                <h2 className="type-heading text-xl text-ink flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-default" /> Needs attention
                </h2>
                <p className="text-sm text-ink-soft">Open a product from Products to edit its SEO section.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'title', label: `SEO title (${audit.products.missing_title})` },
                  { value: 'description', label: `Description (${audit.products.missing_description})` },
                  { value: 'alt', label: `Alt text (${audit.products.missing_alt})` },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setMissingFilter(f.value)}
                    className={`px-3.5 py-2 rounded-full text-xs transition ${
                      missingFilter === f.value
                        ? 'bg-emerald-default text-white'
                        : 'border border-line text-ink-soft hover:border-ink'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {listLoading ? (
              <p className="text-sm text-ink-soft flex items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </p>
            ) : missingList.length === 0 ? (
              <p className="text-sm text-emerald-default flex items-center gap-2 py-4">
                <Check className="w-4 h-4" /> Nothing missing here.
              </p>
            ) : (
              <ul className="divide-y divide-line border-y border-line max-h-80 overflow-y-auto">
                {missingList.map((product) => (
                  <li key={product.id} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                    <span className="text-ink truncate">{product.name}</span>
                    <a
                      href={`${SITE_URL}/product/${product.slug}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs text-ink-faint hover:text-emerald-default shrink-0 font-mono"
                    >
                      /{product.slug}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Redirects */}
          <section className="surface-card rounded-lg p-6 sm:p-8 space-y-4">
            <div className="space-y-1">
              <h2 className="type-heading text-xl text-ink flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-default" /> Redirects
              </h2>
              <p className="text-sm text-ink-soft">
                Renaming a product or category URL records one automatically. {audit.redirects.total} active
                {audit.redirects.hits > 0 ? ` · ${audit.redirects.hits} visits rescued` : ''}.
              </p>
            </div>

            <form onSubmit={handleAddRedirect} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <label className={labelClass}>Old path</label>
                <input
                  type="text" value={redirectForm.source}
                  onChange={(e) => setRedirectForm({ ...redirectForm, source: e.target.value })}
                  placeholder="/product/old-slug" className={`${inputClass} font-mono text-[13px]`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>New path</label>
                <input
                  type="text" value={redirectForm.destination}
                  onChange={(e) => setRedirectForm({ ...redirectForm, destination: e.target.value })}
                  placeholder="/product/new-slug" className={`${inputClass} font-mono text-[13px]`}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep transition"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
            {redirectError && <p className="text-xs text-rose-600">{redirectError}</p>}

            {redirects.length > 0 && (
              <ul className="divide-y divide-line border-y border-line max-h-72 overflow-y-auto">
                {redirects.map((r) => (
                  <li key={r.id} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                    <span className="font-mono text-[13px] text-ink-soft truncate">
                      {r.source} <ArrowRight className="w-3 h-3 inline text-ink-faint" /> {r.destination}
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-ink-faint tabular">{r.status_code} · {r.hits} hits</span>
                      <button
                        onClick={() => handleRemoveRedirect(r.id)}
                        className="p-1.5 rounded-md text-ink-faint hover:bg-rose-600 hover:text-white transition"
                        aria-label="Remove redirect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
