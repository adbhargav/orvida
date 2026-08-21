import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Loader2, Save, Eye, Plus, Trash2, Check, AlertCircle, Search,
  FileText, Share2, Settings2, Link2, ChevronDown,
} from 'lucide-react';
import { api } from '../../services/api';
import { GooglePreview, SocialPreview } from './SeoFields';
import { calculateSeoScore, scoreBandTone, RECOMMENDED } from '../../lib/seoScore';
import { slugify, SITE_URL } from '../../lib/seo';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft';

const EMPTY_PAGE = {
  name: '', slug: '', status: 'draft', template: '', scheduledAt: '',
  h1: '', intro: '', content: '', faqs: [], cta: {}, internalLinks: [], breadcrumbs: [],
  seoTitle: '', metaDescription: '', focusKeyword: '', secondaryKeywords: '', seoKeywords: '',
  canonicalUrl: '', featuredImage: '', imageAltText: '',
  ogTitle: '', ogDescription: '', ogImage: '', twitterTitle: '', twitterDescription: '', twitterImage: '',
  robotsIndex: true, robotsFollow: true,
  includeInSitemap: true, sitemapPriority: 0.7, sitemapChangefreq: 'monthly',
  schemaType: 'WebPage',
};

const SCHEMA_TYPES = [
  { value: 'WebPage', label: 'Web page', hint: 'The safe default for most landing pages.' },
  { value: 'CollectionPage', label: 'Collection page', hint: 'A curated list of products or categories.' },
  { value: 'Article', label: 'Article', hint: 'A guide or explainer with a publish date.' },
  { value: 'FAQPage', label: 'FAQ page', hint: 'Needs at least one question to be valid.' },
  { value: 'LocalBusiness', label: 'Local business', hint: 'For a location or store page.' },
];

const CHANGEFREQS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

const TABS = [
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'seo', label: 'Search', icon: Search },
  { id: 'social', label: 'Social', icon: Share2 },
  { id: 'links', label: 'Links & FAQ', icon: Link2 },
  { id: 'advanced', label: 'Advanced', icon: Settings2 },
];

/** Maps an API row (snake_case) to the editor's camelCase form state. */
const rowToForm = (row) => ({
  ...EMPTY_PAGE,
  name: row.name || '',
  slug: row.slug || '',
  status: row.status || 'draft',
  template: row.template || '',
  scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString().slice(0, 16) : '',
  h1: row.h1 || '',
  intro: row.intro || '',
  content: row.content || '',
  faqs: row.faqs || [],
  cta: row.cta || {},
  internalLinks: row.internal_links || [],
  breadcrumbs: row.breadcrumbs || [],
  seoTitle: row.seo_title || '',
  metaDescription: row.meta_description || '',
  focusKeyword: row.focus_keyword || '',
  secondaryKeywords: row.secondary_keywords || '',
  seoKeywords: row.seo_keywords || '',
  canonicalUrl: row.canonical_url || '',
  featuredImage: row.featured_image || '',
  imageAltText: row.image_alt_text || '',
  ogTitle: row.og_title || '',
  ogDescription: row.og_description || '',
  ogImage: row.og_image || '',
  twitterTitle: row.twitter_title || '',
  twitterDescription: row.twitter_description || '',
  twitterImage: row.twitter_image || '',
  robotsIndex: row.robots_index !== false,
  robotsFollow: row.robots_follow !== false,
  includeInSitemap: row.include_in_sitemap !== false,
  sitemapPriority: row.sitemap_priority != null ? Number(row.sitemap_priority) : 0.7,
  sitemapChangefreq: row.sitemap_changefreq || 'monthly',
  schemaType: row.schema_type || 'WebPage',
});

function Counter({ value, min, max }) {
  const length = (value || '').length;
  const tone =
    length === 0 ? 'text-ink-faint' : length < min || length > max ? 'text-amber-700' : 'text-emerald-default';
  return <p className={`text-xs ${tone}`}>{length}/{max} characters · recommended {min}–{max}</p>;
}

/** Repeatable rows of { [labelKey], url } — used for links and breadcrumbs. */
function LinkRows({ items, onChange, labelKey, labelText, urlPlaceholder, addText }) {
  const update = (idx, patch) =>
    onChange(items.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text" value={item[labelKey] || ''}
            onChange={(e) => update(idx, { [labelKey]: e.target.value })}
            placeholder={labelText} className={inputClass}
          />
          <input
            type="text" value={item.url || ''}
            onChange={(e) => update(idx, { url: e.target.value })}
            placeholder={urlPlaceholder} className={`${inputClass} font-mono text-[13px]`}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            className="p-2.5 rounded-md text-ink-faint hover:bg-rose-600 hover:text-white transition shrink-0 self-start"
            aria-label="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { [labelKey]: '', url: '' }])}
        className="inline-flex items-center gap-1.5 text-sm text-emerald-default link-underline"
      >
        <Plus className="w-3.5 h-3.5" /> {addText}
      </button>
    </div>
  );
}

function ImagePicker({ label, value, onChange, hint, aspect = 'aspect-[16/9]' }) {
  const [uploading, setUploading] = useState(false);
  const id = `page-img-${label.replace(/\W+/g, '-').toLowerCase()}`;

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    try {
      const res = await api.uploads.images([files[0]]);
      if (res.urls?.[0]) onChange(res.urls[0]);
    } catch {
      /* the form banner reports failures */
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className={labelClass}>{label}</label>
      <div className="flex gap-2">
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a URL or upload" className={inputClass} />
        <input type="file" accept="image/*" id={id} onChange={handleUpload} className="hidden" />
        <label htmlFor={id}
          className="px-3.5 py-2.5 rounded-md border border-line text-sm text-ink hover:bg-emerald-subtle cursor-pointer shrink-0 inline-flex items-center">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Upload'}
        </label>
      </div>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      {value && (
        <div className={`${aspect} rounded-md overflow-hidden border border-line mt-1`}>
          <img src={value} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

/**
 * Full-page editor for one SEO landing page.
 *
 * Layout mirrors the tools admins already know: sections on the left, a
 * permanent scoring and preview rail on the right, so the effect of an edit
 * is visible while typing rather than after saving.
 */
export default function SeoPageEditor({ pageId, templates, onClose, onSaved, notify }) {
  const [form, setForm] = useState(EMPTY_PAGE);
  const [initial, setInitial] = useState(EMPTY_PAGE);
  const [tab, setTab] = useState('content');
  const [loading, setLoading] = useState(Boolean(pageId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slugTouched, setSlugTouched] = useState(Boolean(pageId));

  const set = useCallback((patch) => setForm((prev) => ({ ...prev, ...patch })), []);

  useEffect(() => {
    if (!pageId) return;
    let cancelled = false;
    api.seo
      .getPageAdmin(pageId)
      .then((res) => {
        if (cancelled) return;
        const loaded = rowToForm(res.page);
        setForm(loaded);
        setInitial(loaded);
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load this page.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [pageId]);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  // Losing a half-written page to a stray tab close is the one mistake worth
  // interrupting for.
  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const effectiveSlug = form.slug || slugify(form.name);
  const { score, band, checks, warnings } = useMemo(() => calculateSeoScore(form), [form]);

  const handleNameChange = (name) => {
    // The slug tracks the name until an admin edits it themselves.
    set(slugTouched ? { name } : { name, slug: slugify(name) });
  };

  const applyTemplate = (templateName) => {
    const template = templates.find((t) => t.name === templateName);
    if (!template) return set({ template: '' });
    const defaults = template.defaults || {};
    set({
      template: templateName,
      schemaType: defaults.schemaType || form.schemaType,
      sitemapPriority: defaults.sitemapPriority ?? form.sitemapPriority,
      sitemapChangefreq: defaults.sitemapChangefreq || form.sitemapChangefreq,
    });
  };

  const handleSave = async (overrideStatus) => {
    setError('');
    if (!form.name.trim()) {
      setTab('content');
      return setError('Give the page a name.');
    }
    const status = overrideStatus || form.status;
    if (status === 'scheduled' && !form.scheduledAt) {
      setTab('advanced');
      return setError('Pick a date and time to schedule this page.');
    }

    const payload = { ...form, status, slug: effectiveSlug };
    setSaving(true);
    try {
      const res = pageId
        ? await api.seo.updatePage(pageId, payload)
        : await api.seo.createPage(payload);
      const saved = rowToForm(res.page);
      setForm(saved);
      setInitial(saved);
      notify('success', pageId ? 'Page saved.' : 'Page created.');
      onSaved(res.page);
    } catch (err) {
      setError(err.message || 'Could not save this page.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
    onClose();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 text-ink-soft">
        <Loader2 className="w-5 h-5 animate-spin" />
        <p className="text-sm">Loading page…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sticky action bar */}
      <header className="sticky top-0 z-20 bg-canvas/95 backdrop-blur border-b border-line">
        <div className="px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 rounded-md text-ink-soft hover:text-ink hover:bg-emerald-subtle transition"
              aria-label="Back to pages"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="type-heading text-lg text-ink truncate">
                {form.name || 'New landing page'}
              </p>
              <p className="text-xs text-ink-faint font-mono truncate">
                /{effectiveSlug || 'page-slug'}
                {isDirty && <span className="ml-2 text-amber-600 font-sans">• unsaved</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pageId && form.status === 'published' && (
              <a
                href={`${SITE_URL}/${effectiveSlug}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-line text-sm text-ink hover:bg-emerald-subtle transition"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </a>
            )}
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="px-4 py-2.5 rounded-md border border-line text-sm text-ink hover:bg-emerald-subtle disabled:opacity-50 transition"
            >
              Save draft
            </button>
            <button
              onClick={() => handleSave(form.status === 'draft' ? 'published' : undefined)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep disabled:opacity-50 transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {form.status === 'published' ? 'Save changes' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-10 flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 whitespace-nowrap transition ${
                tab === id
                  ? 'border-emerald-default text-emerald-default font-medium'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 sm:px-10 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Form */}
        <div className="xl:col-span-2 space-y-5">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 px-4 py-3 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {/* ---------------- Content ---------------- */}
          {tab === 'content' && (
            <div className="surface-card rounded-lg p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Page name</label>
                  <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Rare Indoor Plants" className={inputClass} />
                  <p className="text-xs text-ink-faint">Used in the admin list and as a fallback title.</p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>URL slug</label>
                  <input
                    type="text" value={form.slug}
                    onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value }); }}
                    placeholder={slugify(form.name) || 'page-slug'}
                    className={`${inputClass} font-mono text-[13px]`}
                  />
                  <p className="text-xs text-ink-faint truncate">
                    {SITE_URL.replace(/^https?:\/\//, '')}/{effectiveSlug || 'page-slug'}
                  </p>
                </div>
              </div>

              {!pageId && templates.length > 0 && (
                <div className="space-y-1.5">
                  <label className={labelClass}>Start from a template</label>
                  <select value={form.template} onChange={(e) => applyTemplate(e.target.value)} className={inputClass}>
                    <option value="">No template — start blank</option>
                    {templates.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                  {form.template && (
                    <p className="text-xs text-ink-faint">
                      {templates.find((t) => t.name === form.template)?.description}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className={labelClass}>H1 heading</label>
                <input type="text" value={form.h1} onChange={(e) => set({ h1: e.target.value })}
                  placeholder="The single main heading visitors see" className={inputClass} />
                <p className="text-xs text-ink-faint">One per page. Include your focus keyword naturally.</p>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Introduction</label>
                <textarea rows={3} value={form.intro} onChange={(e) => set({ intro: e.target.value })}
                  placeholder="One or two sentences that set up the page" className={`${inputClass} resize-y`} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Main content</label>
                <textarea rows={14} value={form.content} onChange={(e) => set({ content: e.target.value })}
                  placeholder="Write for the reader first. Blank lines separate paragraphs."
                  className={`${inputClass} resize-y leading-relaxed`} />
                <p className="text-xs text-ink-faint">
                  {String(form.content || '').trim().split(/\s+/).filter(Boolean).length} words ·
                  {' '}aim for {RECOMMENDED.contentMinWords}+ on a page meant to rank
                </p>
              </div>
            </div>
          )}

          {/* ---------------- Search ---------------- */}
          {tab === 'seo' && (
            <div className="surface-card rounded-lg p-5 sm:p-6 space-y-5">
              <div className="space-y-1.5">
                <label className={labelClass}>SEO title</label>
                <input type="text" value={form.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })}
                  placeholder={form.name || 'Title shown in Google'} className={inputClass} />
                <Counter value={form.seoTitle} min={RECOMMENDED.titleMin} max={RECOMMENDED.titleMax} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Meta description</label>
                <textarea rows={3} value={form.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })}
                  placeholder="The sentence shown under the title in search results"
                  className={`${inputClass} resize-y`} />
                <Counter value={form.metaDescription} min={RECOMMENDED.descriptionMin} max={RECOMMENDED.descriptionMax} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Focus keyword</label>
                  <input type="text" value={form.focusKeyword} onChange={(e) => set({ focusKeyword: e.target.value })}
                    placeholder="rare indoor plants" className={inputClass} />
                  <p className="text-xs text-ink-faint">The one phrase this page should win.</p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Secondary keywords</label>
                  <input type="text" value={form.secondaryKeywords} onChange={(e) => set({ secondaryKeywords: e.target.value })}
                    placeholder="Comma separated" className={inputClass} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Canonical URL</label>
                <input type="text" value={form.canonicalUrl} onChange={(e) => set({ canonicalUrl: e.target.value })}
                  placeholder={`${SITE_URL}/${effectiveSlug || 'page-slug'} (generated automatically)`}
                  className={inputClass} />
                <p className="text-xs text-ink-faint">
                  Leave blank unless this page deliberately duplicates another one.
                </p>
              </div>
            </div>
          )}

          {/* ---------------- Social ---------------- */}
          {tab === 'social' && (
            <div className="surface-card rounded-lg p-5 sm:p-6 space-y-5">
              <ImagePicker label="Featured image" value={form.featuredImage}
                onChange={(v) => set({ featuredImage: v })}
                hint="Shown at the top of the page and used as the share image when no OG image is set." />

              <div className="space-y-1.5">
                <label className={labelClass}>Image alt text</label>
                <input type="text" value={form.imageAltText} onChange={(e) => set({ imageAltText: e.target.value })}
                  placeholder="Describe the image for search and screen readers" className={inputClass} />
              </div>

              <div className="pt-4 border-t border-line space-y-4">
                <p className="type-eyebrow text-emerald-default">Open Graph (Facebook, WhatsApp, LinkedIn)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>OG title</label>
                    <input type="text" value={form.ogTitle} onChange={(e) => set({ ogTitle: e.target.value })}
                      placeholder={form.seoTitle || form.name} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>OG description</label>
                    <input type="text" value={form.ogDescription} onChange={(e) => set({ ogDescription: e.target.value })}
                      placeholder={(form.metaDescription || '').slice(0, 50)} className={inputClass} />
                  </div>
                </div>
                <ImagePicker label="OG image" value={form.ogImage} onChange={(v) => set({ ogImage: v })}
                  hint="1200×630 works best. Falls back to the featured image." aspect="aspect-[1200/630]" />
              </div>

              <div className="pt-4 border-t border-line space-y-4">
                <p className="type-eyebrow text-emerald-default">Twitter / X</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Twitter title</label>
                    <input type="text" value={form.twitterTitle} onChange={(e) => set({ twitterTitle: e.target.value })}
                      placeholder={form.ogTitle || form.seoTitle || form.name} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Twitter description</label>
                    <input type="text" value={form.twitterDescription} onChange={(e) => set({ twitterDescription: e.target.value })}
                      placeholder={(form.ogDescription || form.metaDescription || '').slice(0, 50)} className={inputClass} />
                  </div>
                </div>
                <ImagePicker label="Twitter image" value={form.twitterImage} onChange={(v) => set({ twitterImage: v })}
                  hint="Falls back to the OG image." aspect="aspect-[1200/630]" />
              </div>
            </div>
          )}

          {/* ---------------- Links & FAQ ---------------- */}
          {tab === 'links' && (
            <div className="space-y-5">
              <div className="surface-card rounded-lg p-5 sm:p-6 space-y-3">
                <div>
                  <h3 className="type-heading text-lg text-ink">Internal links</h3>
                  <p className="text-sm text-ink-soft">
                    Point visitors (and crawlers) at your products and collections. Use descriptive text,
                    not “click here”.
                  </p>
                </div>
                <LinkRows
                  items={form.internalLinks} onChange={(v) => set({ internalLinks: v })}
                  labelKey="text" labelText="Link text — e.g. Shop rare plants"
                  urlPlaceholder="/category/plants" addText="Add internal link"
                />
              </div>

              <div className="surface-card rounded-lg p-5 sm:p-6 space-y-3">
                <div>
                  <h3 className="type-heading text-lg text-ink">Breadcrumbs</h3>
                  <p className="text-sm text-ink-soft">
                    The trail shown above the heading. The page itself is added automatically at the end.
                  </p>
                </div>
                <LinkRows
                  items={form.breadcrumbs} onChange={(v) => set({ breadcrumbs: v })}
                  labelKey="label" labelText="Label — e.g. Plants"
                  urlPlaceholder="/category/plants" addText="Add breadcrumb"
                />
              </div>

              <div className="surface-card rounded-lg p-5 sm:p-6 space-y-3">
                <div>
                  <h3 className="type-heading text-lg text-ink">Frequently asked questions</h3>
                  <p className="text-sm text-ink-soft">
                    Answer what customers actually ask. Choose the FAQ page schema in Advanced to make
                    these eligible for rich results.
                  </p>
                </div>
                <div className="space-y-3">
                  {form.faqs.map((faq, idx) => (
                    <div key={idx} className="p-4 rounded-md border border-line space-y-2.5">
                      <div className="flex gap-2.5">
                        <input
                          type="text" value={faq.question || ''}
                          onChange={(e) => set({ faqs: form.faqs.map((f, i) => (i === idx ? { ...f, question: e.target.value } : f)) })}
                          placeholder="Question" className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => set({ faqs: form.faqs.filter((_, i) => i !== idx) })}
                          className="p-2.5 rounded-md text-ink-faint hover:bg-rose-600 hover:text-white transition shrink-0"
                          aria-label="Remove question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        rows={3} value={faq.answer || ''}
                        onChange={(e) => set({ faqs: form.faqs.map((f, i) => (i === idx ? { ...f, answer: e.target.value } : f)) })}
                        placeholder="Answer" className={`${inputClass} resize-y`}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => set({ faqs: [...form.faqs, { question: '', answer: '' }] })}
                    className="inline-flex items-center gap-1.5 text-sm text-emerald-default link-underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add question
                  </button>
                </div>
              </div>

              <div className="surface-card rounded-lg p-5 sm:p-6 space-y-4">
                <div>
                  <h3 className="type-heading text-lg text-ink">Call to action</h3>
                  <p className="text-sm text-ink-soft">The closing block at the bottom of the page.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Heading</label>
                    <input type="text" value={form.cta.heading || ''}
                      onChange={(e) => set({ cta: { ...form.cta, heading: e.target.value } })}
                      placeholder="Begin your collection" className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Supporting text</label>
                    <input type="text" value={form.cta.text || ''}
                      onChange={(e) => set({ cta: { ...form.cta, text: e.target.value } })}
                      className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Button text</label>
                    <input type="text" value={form.cta.buttonText || ''}
                      onChange={(e) => set({ cta: { ...form.cta, buttonText: e.target.value } })}
                      placeholder="Browse plants" className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Button link</label>
                    <input type="text" value={form.cta.buttonUrl || ''}
                      onChange={(e) => set({ cta: { ...form.cta, buttonUrl: e.target.value } })}
                      placeholder="/category/plants" className={`${inputClass} font-mono text-[13px]`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- Advanced ---------------- */}
          {tab === 'advanced' && (
            <div className="space-y-5">
              <div className="surface-card rounded-lg p-5 sm:p-6 space-y-4">
                <h3 className="type-heading text-lg text-ink">Publishing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Status</label>
                    <select value={form.status} onChange={(e) => set({ status: e.target.value })} className={inputClass}>
                      <option value="draft">Draft — not public</option>
                      <option value="published">Published — live now</option>
                      <option value="scheduled">Scheduled — goes live later</option>
                    </select>
                  </div>
                  {form.status === 'scheduled' && (
                    <div className="space-y-1.5">
                      <label className={labelClass}>Publish at</label>
                      <input type="datetime-local" value={form.scheduledAt}
                        onChange={(e) => set({ scheduledAt: e.target.value })} className={inputClass} />
                      <p className="text-xs text-ink-faint">The page appears automatically at this time.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="surface-card rounded-lg p-5 sm:p-6 space-y-4">
                <h3 className="type-heading text-lg text-ink">Search engines</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-start gap-3 p-3.5 rounded-md border border-line cursor-pointer">
                    <input type="checkbox" checked={form.robotsIndex}
                      onChange={(e) => set({ robotsIndex: e.target.checked })} className="mt-0.5 accent-[#154734]" />
                    <span>
                      <span className="block text-sm text-ink">Index this page</span>
                      <span className="block text-xs text-ink-faint">Allow it to appear in search results.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3.5 rounded-md border border-line cursor-pointer">
                    <input type="checkbox" checked={form.robotsFollow}
                      onChange={(e) => set({ robotsFollow: e.target.checked })} className="mt-0.5 accent-[#154734]" />
                    <span>
                      <span className="block text-sm text-ink">Follow links</span>
                      <span className="block text-xs text-ink-faint">Let crawlers follow links on this page.</span>
                    </span>
                  </label>
                </div>
                <p className="text-xs text-ink-faint font-mono">
                  robots: {form.robotsIndex ? 'index' : 'noindex'}, {form.robotsFollow ? 'follow' : 'nofollow'}
                </p>
              </div>

              <div className="surface-card rounded-lg p-5 sm:p-6 space-y-4">
                <h3 className="type-heading text-lg text-ink">Sitemap</h3>
                <label className="flex items-start gap-3 p-3.5 rounded-md border border-line cursor-pointer">
                  <input type="checkbox" checked={form.includeInSitemap}
                    onChange={(e) => set({ includeInSitemap: e.target.checked })} className="mt-0.5 accent-[#154734]" />
                  <span>
                    <span className="block text-sm text-ink">Include in sitemap</span>
                    <span className="block text-xs text-ink-faint">
                      Only published pages are listed, whatever this is set to.
                    </span>
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Priority</label>
                    <input type="number" min="0" max="1" step="0.1" value={form.sitemapPriority}
                      onChange={(e) => set({ sitemapPriority: e.target.value })} className={inputClass} />
                    <p className="text-xs text-ink-faint">0.0–1.0, relative to your other pages.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Change frequency</label>
                    <select value={form.sitemapChangefreq} onChange={(e) => set({ sitemapChangefreq: e.target.value })}
                      className={inputClass}>
                      {CHANGEFREQS.map((f) => (
                        <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="surface-card rounded-lg p-5 sm:p-6 space-y-4">
                <h3 className="type-heading text-lg text-ink">Structured data</h3>
                <div className="space-y-1.5">
                  <label className={labelClass}>Schema type</label>
                  <select value={form.schemaType} onChange={(e) => set({ schemaType: e.target.value })} className={inputClass}>
                    {SCHEMA_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <p className="text-xs text-ink-faint">
                    {SCHEMA_TYPES.find((t) => t.value === form.schemaType)?.hint}
                  </p>
                </div>
                {form.schemaType === 'FAQPage' && form.faqs.length === 0 && (
                  <p className="text-xs text-amber-700 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    Add at least one question under Links &amp; FAQ, or Google will reject this markup.
                  </p>
                )}
                <details className="rounded-md border border-line">
                  <summary className="px-4 py-2.5 text-sm text-ink-soft cursor-pointer select-none">
                    Preview generated structured data
                  </summary>
                  <pre className="px-4 pb-4 text-[11px] text-ink-soft overflow-x-auto leading-relaxed">
{JSON.stringify(
  form.schemaType === 'FAQPage' && form.faqs.length > 0
    ? {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: form.faqs.filter((f) => f.question).map((f) => ({
          '@type': 'Question', name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : {
        '@context': 'https://schema.org', '@type': form.schemaType,
        name: form.h1 || form.name, url: `${SITE_URL}/${effectiveSlug}`,
        ...(form.metaDescription ? { description: form.metaDescription } : {}),
      },
  null, 2
)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>

        {/* Scoring rail */}
        <aside className="space-y-5 xl:sticky xl:top-32">
          <div className="surface-card rounded-lg p-5 space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="type-eyebrow text-ink-soft">SEO score</span>
              <span className={`type-price text-3xl ${scoreBandTone(score)}`}>{score}<span className="text-base">/100</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-emerald-subtle overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  score >= 85 ? 'bg-emerald-default' : score >= 35 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-xs text-ink-soft">{band}</p>
            <p className="text-[11px] text-ink-faint leading-relaxed">
              A completeness check, not a ranking prediction.
            </p>
          </div>

          {warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="type-eyebrow text-amber-800">Worth checking</p>
              <ul className="space-y-1.5">
                {warnings.map((w) => (
                  <li key={w} className="text-xs text-amber-900 flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <GooglePreview
            title={form.seoTitle || form.name}
            description={form.metaDescription || form.intro}
            path={`/${effectiveSlug}`}
            settings={{}}
          />

          <SocialPreview
            title={form.ogTitle || form.seoTitle || form.name}
            description={form.ogDescription || form.metaDescription}
            image={form.ogImage || form.featuredImage}
            settings={{}}
          />

          <div className="surface-card rounded-lg p-5 space-y-2">
            <p className="type-eyebrow text-ink-soft">Checklist</p>
            <ul className="space-y-1.5">
              {checks.map((check) => (
                <li key={check.key} className="flex items-start justify-between gap-3 text-xs">
                  <span className="flex items-start gap-2 min-w-0">
                    {check.pass ? (
                      <Check className="w-3.5 h-3.5 text-emerald-default shrink-0 mt-px" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-px" />
                    )}
                    <span className={check.pass ? 'text-ink' : 'text-ink-soft'}>{check.label}</span>
                  </span>
                  {check.hint && <span className="text-ink-faint shrink-0 tabular">{check.hint}</span>}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
