import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Loader2, Save, Eye, Check, AlertCircle, Search,
  FileText, Share2, Settings2, Plus, X,
} from 'lucide-react';
import { api } from '../../services/api';
import { GooglePreview, SocialPreview } from './SeoFields';
import { calculateBlogScore, scoreBandTone, RECOMMENDED } from '../../lib/seoScore';
import { slugify, SITE_URL } from '../../lib/seo';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft';

const EMPTY_POST = {
  title: '', slug: '', status: 'draft', scheduledAt: '',
  excerpt: '', content: '', authorName: '', category: '', tags: [], isFeatured: false,
  featuredImage: '', imageAltText: '',
  seoTitle: '', metaDescription: '', focusKeyword: '', seoKeywords: '', canonicalUrl: '',
  ogTitle: '', ogDescription: '', ogImage: '', twitterTitle: '', twitterDescription: '', twitterImage: '',
  robotsIndex: true, robotsFollow: true,
  includeInSitemap: true, sitemapPriority: 0.6, sitemapChangefreq: 'monthly',
};

const CHANGEFREQS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

const TABS = [
  { id: 'content', label: 'Post', icon: FileText },
  { id: 'seo', label: 'Search', icon: Search },
  { id: 'social', label: 'Social', icon: Share2 },
  { id: 'advanced', label: 'Advanced', icon: Settings2 },
];

/** Maps an API row (snake_case) to the editor's camelCase form state. */
const rowToForm = (row) => ({
  ...EMPTY_POST,
  title: row.title || '',
  slug: row.slug || '',
  status: row.status || 'draft',
  scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString().slice(0, 16) : '',
  excerpt: row.excerpt || '',
  content: row.content || '',
  authorName: row.author_name || '',
  category: row.category || '',
  tags: row.tags || [],
  isFeatured: row.is_featured === true,
  featuredImage: row.featured_image || '',
  imageAltText: row.image_alt_text || '',
  seoTitle: row.seo_title || '',
  metaDescription: row.meta_description || '',
  focusKeyword: row.focus_keyword || '',
  seoKeywords: row.seo_keywords || '',
  canonicalUrl: row.canonical_url || '',
  ogTitle: row.og_title || '',
  ogDescription: row.og_description || '',
  ogImage: row.og_image || '',
  twitterTitle: row.twitter_title || '',
  twitterDescription: row.twitter_description || '',
  twitterImage: row.twitter_image || '',
  robotsIndex: row.robots_index !== false,
  robotsFollow: row.robots_follow !== false,
  includeInSitemap: row.include_in_sitemap !== false,
  sitemapPriority: row.sitemap_priority != null ? Number(row.sitemap_priority) : 0.6,
  sitemapChangefreq: row.sitemap_changefreq || 'monthly',
});

function Counter({ value, min, max }) {
  const length = (value || '').length;
  const tone =
    length === 0 ? 'text-ink-faint' : length < min || length > max ? 'text-amber-700' : 'text-emerald-default';
  return <p className={`text-xs ${tone}`}>{length}/{max} characters · recommended {min}–{max}</p>;
}

/** Free-form tags, entered one at a time. */
function TagInput({ tags, onChange }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    // Duplicates are silently ignored rather than rejected with an error.
    if (value && !tags.includes(value)) onChange([...tags, value]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-subtle text-xs text-emerald-deep">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
          }}
          placeholder="Type a tag and press Enter" className={inputClass}
        />
        <button type="button" onClick={add}
          className="px-3.5 py-2.5 rounded-md border border-line text-sm text-ink hover:bg-emerald-subtle shrink-0 inline-flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

function ImagePicker({ label, value, onChange, hint, aspect = 'aspect-[16/9]' }) {
  const [uploading, setUploading] = useState(false);
  const id = `blog-img-${label.replace(/\W+/g, '-').toLowerCase()}`;

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
 * Full-page editor for one blog post.
 *
 * Deliberately the same shape as the landing-page editor — tabs on the left,
 * a permanent scoring and preview rail on the right — so an admin who has
 * used one already knows this one.
 */
export default function BlogPostEditor({ postId, categories, onClose, onSaved, notify }) {
  const [form, setForm] = useState(EMPTY_POST);
  const [initial, setInitial] = useState(EMPTY_POST);
  const [tab, setTab] = useState('content');
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slugTouched, setSlugTouched] = useState(Boolean(postId));

  const set = useCallback((patch) => setForm((prev) => ({ ...prev, ...patch })), []);

  useEffect(() => {
    if (!postId) return undefined;
    let cancelled = false;
    api.blog
      .getPostAdmin(postId)
      .then((res) => {
        if (cancelled) return;
        const loaded = rowToForm(res.post);
        setForm(loaded);
        setInitial(loaded);
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load this post.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [postId]);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  // Losing a half-written article to a stray tab close is worth interrupting for.
  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const effectiveSlug = form.slug || slugify(form.title);
  const { score, band, checks, warnings } = useMemo(() => calculateBlogScore(form), [form]);
  const wordCount = String(form.content || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));

  const handleTitleChange = (title) => {
    // The slug tracks the title until an admin edits it themselves.
    set(slugTouched ? { title } : { title, slug: slugify(title) });
  };

  const handleSave = async (overrideStatus) => {
    setError('');
    if (!form.title.trim()) {
      setTab('content');
      return setError('Give the post a title.');
    }
    const status = overrideStatus || form.status;
    if (status === 'scheduled' && !form.scheduledAt) {
      setTab('advanced');
      return setError('Pick a date and time to schedule this post.');
    }

    const payload = { ...form, status, slug: effectiveSlug };
    setSaving(true);
    try {
      const res = postId
        ? await api.blog.updatePost(postId, payload)
        : await api.blog.createPost(payload);
      const saved = rowToForm(res.post);
      setForm(saved);
      setInitial(saved);
      notify('success', postId ? 'Post saved.' : 'Post created.');
      onSaved(res.post);
    } catch (err) {
      setError(err.message || 'Could not save this post.');
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
        <p className="text-sm">Loading post…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sticky action bar */}
      <header className="sticky top-0 z-20 bg-canvas/95 backdrop-blur border-b border-line">
        <div className="px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={handleClose}
              className="p-2 -ml-2 rounded-md text-ink-soft hover:text-ink hover:bg-emerald-subtle transition"
              aria-label="Back to posts">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="type-heading text-lg text-ink truncate">{form.title || 'New post'}</p>
              <p className="text-xs text-ink-faint font-mono truncate">
                /blog/{effectiveSlug || 'post-slug'}
                {isDirty && <span className="ml-2 text-amber-600 font-sans">• unsaved</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {postId && form.status === 'published' && (
              <a href={`${SITE_URL}/blog/${effectiveSlug}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-line text-sm text-ink hover:bg-emerald-subtle transition">
                <Eye className="w-3.5 h-3.5" /> View
              </a>
            )}
            <button onClick={() => handleSave('draft')} disabled={saving}
              className="px-4 py-2.5 rounded-md border border-line text-sm text-ink hover:bg-emerald-subtle disabled:opacity-50 transition">
              Save draft
            </button>
            <button onClick={() => handleSave(form.status === 'draft' ? 'published' : undefined)} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep disabled:opacity-50 transition">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {form.status === 'published' ? 'Save changes' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-10 flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 whitespace-nowrap transition ${
                tab === id
                  ? 'border-emerald-default text-emerald-default font-medium'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 sm:px-10 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-5">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 px-4 py-3 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {/* ---------------- Post ---------------- */}
          {tab === 'content' && (
            <div className="surface-card rounded-lg p-5 sm:p-6 space-y-5">
              <div className="space-y-1.5">
                <label className={labelClass}>Title</label>
                <input type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="How to keep a fiddle-leaf fig alive" className={inputClass} />
                <p className="text-xs text-ink-faint">This is the heading readers see and the H1 on the page.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>URL slug</label>
                  <input type="text" value={form.slug}
                    onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value }); }}
                    placeholder={slugify(form.title) || 'post-slug'}
                    className={`${inputClass} font-mono text-[13px]`} />
                  <p className="text-xs text-ink-faint truncate">
                    {SITE_URL.replace(/^https?:\/\//, '')}/blog/{effectiveSlug || 'post-slug'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Author</label>
                  <input type="text" value={form.authorName} onChange={(e) => set({ authorName: e.target.value })}
                    placeholder="Shown as the byline" className={inputClass} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Excerpt</label>
                <textarea rows={3} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })}
                  placeholder="A sentence or two shown on the blog index and used as the fallback description"
                  className={`${inputClass} resize-y`} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Article</label>
                <textarea rows={18} value={form.content} onChange={(e) => set({ content: e.target.value })}
                  placeholder="Write for the reader first. Blank lines separate paragraphs."
                  className={`${inputClass} resize-y leading-relaxed`} />
                <p className="text-xs text-ink-faint">
                  {wordCount} words · about {minutes} min read ·
                  {' '}aim for {RECOMMENDED.contentMinWords}+ on a post meant to rank
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Category</label>
                  <input type="text" list="blog-categories" value={form.category}
                    onChange={(e) => set({ category: e.target.value })}
                    placeholder="Plant care" className={inputClass} />
                  <datalist id="blog-categories">
                    {categories.map((c) => <option key={c.category} value={c.category} />)}
                  </datalist>
                  <p className="text-xs text-ink-faint">Reuse an existing one where you can — readers filter by these.</p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Tags</label>
                  <TagInput tags={form.tags} onChange={(tags) => set({ tags })} />
                </div>
              </div>

              <label className="flex items-start gap-3 p-3.5 rounded-md border border-line cursor-pointer">
                <input type="checkbox" checked={form.isFeatured}
                  onChange={(e) => set({ isFeatured: e.target.checked })} className="mt-0.5 accent-[#154734]" />
                <span>
                  <span className="block text-sm text-ink">Feature this post</span>
                  <span className="block text-xs text-ink-faint">Featured posts sit at the top of the blog index.</span>
                </span>
              </label>
            </div>
          )}

          {/* ---------------- Search ---------------- */}
          {tab === 'seo' && (
            <div className="surface-card rounded-lg p-5 sm:p-6 space-y-5">
              <div className="space-y-1.5">
                <label className={labelClass}>SEO title</label>
                <input type="text" value={form.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })}
                  placeholder={form.title || 'Title shown in Google'} className={inputClass} />
                <Counter value={form.seoTitle} min={RECOMMENDED.titleMin} max={RECOMMENDED.titleMax} />
                <p className="text-xs text-ink-faint">Left blank, the post title is used.</p>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Meta description</label>
                <textarea rows={3} value={form.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })}
                  placeholder="The sentence shown under the title in search results"
                  className={`${inputClass} resize-y`} />
                <Counter value={form.metaDescription} min={RECOMMENDED.descriptionMin} max={RECOMMENDED.descriptionMax} />
                <p className="text-xs text-ink-faint">Left blank, the excerpt is used.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Focus keyword</label>
                  <input type="text" value={form.focusKeyword} onChange={(e) => set({ focusKeyword: e.target.value })}
                    placeholder="fiddle leaf fig care" className={inputClass} />
                  <p className="text-xs text-ink-faint">The one phrase this post should win.</p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Additional keywords</label>
                  <input type="text" value={form.seoKeywords} onChange={(e) => set({ seoKeywords: e.target.value })}
                    placeholder="Comma separated" className={inputClass} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Canonical URL</label>
                <input type="text" value={form.canonicalUrl} onChange={(e) => set({ canonicalUrl: e.target.value })}
                  placeholder={`${SITE_URL}/blog/${effectiveSlug || 'post-slug'} (generated automatically)`}
                  className={inputClass} />
                <p className="text-xs text-ink-faint">
                  Only needed if this article was first published somewhere else.
                </p>
              </div>
            </div>
          )}

          {/* ---------------- Social ---------------- */}
          {tab === 'social' && (
            <div className="surface-card rounded-lg p-5 sm:p-6 space-y-5">
              <ImagePicker label="Featured image" value={form.featuredImage}
                onChange={(v) => set({ featuredImage: v })}
                hint="Shown on the blog index, at the top of the post, and as the share image." />

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
                      placeholder={form.seoTitle || form.title} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>OG description</label>
                    <input type="text" value={form.ogDescription} onChange={(e) => set({ ogDescription: e.target.value })}
                      placeholder={(form.metaDescription || form.excerpt || '').slice(0, 50)} className={inputClass} />
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
                      placeholder={form.ogTitle || form.seoTitle || form.title} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Twitter description</label>
                    <input type="text" value={form.twitterDescription}
                      onChange={(e) => set({ twitterDescription: e.target.value })}
                      placeholder={(form.ogDescription || form.metaDescription || '').slice(0, 50)} className={inputClass} />
                  </div>
                </div>
                <ImagePicker label="Twitter image" value={form.twitterImage} onChange={(v) => set({ twitterImage: v })}
                  hint="Falls back to the OG image." aspect="aspect-[1200/630]" />
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
                      <p className="text-xs text-ink-faint">The post appears automatically at this time.</p>
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
                      <span className="block text-sm text-ink">Index this post</span>
                      <span className="block text-xs text-ink-faint">Allow it to appear in search results.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3.5 rounded-md border border-line cursor-pointer">
                    <input type="checkbox" checked={form.robotsFollow}
                      onChange={(e) => set({ robotsFollow: e.target.checked })} className="mt-0.5 accent-[#154734]" />
                    <span>
                      <span className="block text-sm text-ink">Follow links</span>
                      <span className="block text-xs text-ink-faint">Let crawlers follow links in the article.</span>
                    </span>
                  </label>
                </div>
                <p className="text-xs text-ink-faint font-mono">
                  robots: {form.robotsIndex ? 'index' : 'noindex'}, {form.robotsFollow ? 'follow' : 'nofollow'}
                </p>
                <p className="text-xs text-ink-faint">
                  A post set to “no index” is also hidden from the blog index, not just from Google.
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
                      Only published posts are listed, whatever this is set to.
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

              <div className="surface-card rounded-lg p-5 sm:p-6 space-y-3">
                <h3 className="type-heading text-lg text-ink">Structured data</h3>
                <p className="text-sm text-ink-soft">
                  Every post is published as an <span className="font-mono text-[13px]">Article</span>, built from
                  the fields above — there is nothing to configure.
                </p>
                <details className="rounded-md border border-line">
                  <summary className="px-4 py-2.5 text-sm text-ink-soft cursor-pointer select-none">
                    Preview generated structured data
                  </summary>
                  <pre className="px-4 pb-4 text-[11px] text-ink-soft overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: form.title,
    url: `${SITE_URL}/blog/${effectiveSlug}`,
    ...(form.metaDescription || form.excerpt ? { description: form.metaDescription || form.excerpt } : {}),
    ...(form.featuredImage ? { image: form.featuredImage } : {}),
    ...(form.authorName ? { author: { '@type': 'Person', name: form.authorName } } : {}),
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
              <div className={`h-full rounded-full transition-all duration-500 ${
                score >= 85 ? 'bg-emerald-default' : score >= 35 ? 'bg-amber-500' : 'bg-rose-500'
              }`} style={{ width: `${score}%` }} />
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
            title={form.seoTitle || form.title}
            description={form.metaDescription || form.excerpt}
            path={`/blog/${effectiveSlug}`}
            settings={{}}
          />

          <SocialPreview
            title={form.ogTitle || form.seoTitle || form.title}
            description={form.ogDescription || form.metaDescription || form.excerpt}
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
