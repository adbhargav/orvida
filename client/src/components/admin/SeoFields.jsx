import React, { useState } from 'react';
import { ChevronDown, Search, Share2, Check, Loader2, Upload } from 'lucide-react';
import { api } from '../../services/api';
import { ROBOTS_OPTIONS, SITE_URL, slugify, buildTitle, pickDescription } from '../../lib/seo';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft';

/** Counter that guides without ever blocking a save. */
function Counter({ value, min, max, unit = 'characters' }) {
  const length = (value || '').length;
  const tone =
    length === 0 ? 'text-ink-faint' : length < min || length > max ? 'text-amber-700' : 'text-emerald-default';
  return (
    <p className={`text-xs ${tone}`}>
      {length}/{max} {unit} · recommended {min}–{max}
    </p>
  );
}

/**
 * Google result preview. Mirrors what a searcher sees, using the same
 * fallback chain the storefront applies, so an empty SEO title previews the
 * entity name rather than looking broken.
 */
export function GooglePreview({ title, description, path, settings }) {
  const shownTitle = buildTitle(title, settings);
  const shownDescription = pickDescription(description, 'No description yet — Google will choose page text instead.');
  const url = `${SITE_URL}${path}`.replace(/^https?:\/\//, '');

  return (
    <div className="p-4 rounded-md border border-line bg-white space-y-1">
      <p className="type-eyebrow text-ink-faint flex items-center gap-1.5">
        <Search className="w-3 h-3" /> Google preview
      </p>
      <p className="text-[13px] text-emerald-deep truncate">{url}</p>
      <p className="text-[#1a0dab] text-lg leading-snug line-clamp-1">{shownTitle}</p>
      <p className="text-[13px] text-ink-soft line-clamp-2">{shownDescription}</p>
    </div>
  );
}

/** Social card preview — what a WhatsApp or X share looks like. */
export function SocialPreview({ title, description, image, settings }) {
  return (
    <div className="rounded-md border border-line bg-white overflow-hidden">
      <p className="type-eyebrow text-ink-faint flex items-center gap-1.5 px-4 pt-4 pb-2">
        <Share2 className="w-3 h-3" /> Social preview
      </p>
      <div className="aspect-[1200/630] bg-emerald-subtle overflow-hidden border-y border-line">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-ink-faint">
            No share image — the global default will be used
          </div>
        )}
      </div>
      <div className="p-3 space-y-0.5">
        <p className="text-[11px] uppercase tracking-wide text-ink-faint">{SITE_URL.replace(/^https?:\/\//, '')}</p>
        <p className="text-sm text-ink line-clamp-1">{buildTitle(title, settings)}</p>
        <p className="text-xs text-ink-soft line-clamp-2">{description || settings?.metaDescription || ''}</p>
      </div>
    </div>
  );
}

function ImageUpload({ label, value, onChange, hint }) {
  const [uploading, setUploading] = useState(false);
  const inputId = `seo-img-${label.replace(/\W+/g, '-').toLowerCase()}`;

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    try {
      const res = await api.uploads.images([files[0]]);
      if (res.urls?.[0]) onChange(res.urls[0]);
    } catch {
      /* the form's own error banner covers failures */
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className={labelClass}>{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a URL or upload"
          className={inputClass}
        />
        <input type="file" accept="image/*" id={inputId} onChange={handleUpload} className="hidden" />
        <label
          htmlFor={inputId}
          className="px-3.5 py-2.5 rounded-md border border-line text-sm text-ink hover:bg-emerald-subtle cursor-pointer shrink-0 inline-flex items-center gap-1.5"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        </label>
      </div>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

/**
 * The SEO block shared by the product and category forms.
 *
 * `value` is a plain object of SEO fields and `onChange(patch)` merges into
 * it, so the parent form keeps owning its own state exactly as it already
 * does for every other field.
 *
 * @param {'product'|'category'} entity  Controls which fields appear
 */
export default function SeoFields({
  entity = 'product',
  value = {},
  onChange,
  name = '',
  fallbackDescription = '',
  fallbackImage = '',
  pathPrefix = '/product',
  settings = {},
}) {
  const [open, setOpen] = useState(false);
  const set = (patch) => onChange({ ...value, ...patch });

  const effectiveSlug = value.slug || slugify(name) || 'product-slug';
  const previewTitle = value.seoTitle || name;
  const previewDescription = value.seoDescription || fallbackDescription;
  const previewImage = value.ogImage || fallbackImage;

  // A quiet completeness read-out, so an admin knows what is still missing
  // without needing to understand technical SEO.
  const status = [
    { label: 'SEO title', done: Boolean(value.seoTitle) },
    { label: 'Meta description', done: Boolean(value.seoDescription) },
    { label: 'URL slug', done: Boolean(effectiveSlug) },
    { label: 'Image alt text', done: Boolean(value.imageAltText) },
    { label: 'Share image', done: Boolean(previewImage) },
  ];
  const doneCount = status.filter((s) => s.done).length;

  return (
    <div className="border border-line rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-emerald-subtle/60 hover:bg-emerald-subtle transition"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <Search className="w-4 h-4 text-emerald-default" />
          Search engine optimisation
          <span className="text-xs text-ink-soft font-normal">
            ({doneCount}/{status.length} complete — optional)
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="p-4 sm:p-5 space-y-5 border-t border-line">
          <p className="text-xs text-ink-faint leading-relaxed">
            Every field here is optional. Left blank, the storefront falls back to the {entity}&apos;s own
            name, description and first image — so you can fill these in gradually.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>SEO title</label>
                <input
                  type="text"
                  value={value.seoTitle || ''}
                  onChange={(e) => set({ seoTitle: e.target.value })}
                  placeholder={name || 'Product name'}
                  className={inputClass}
                />
                <Counter value={value.seoTitle} min={50} max={60} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Meta description</label>
                <textarea
                  rows={3}
                  value={value.seoDescription || ''}
                  onChange={(e) => set({ seoDescription: e.target.value })}
                  placeholder={fallbackDescription ? fallbackDescription.slice(0, 90) : 'A short summary for search results'}
                  className={`${inputClass} resize-y`}
                />
                <Counter value={value.seoDescription} min={140} max={160} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>URL slug</label>
                  <input
                    type="text"
                    value={value.slug || ''}
                    onChange={(e) => set({ slug: e.target.value })}
                    placeholder={slugify(name) || 'auto-generated'}
                    className={`${inputClass} font-mono text-[13px]`}
                  />
                  <p className="text-xs text-ink-faint truncate">
                    {pathPrefix}/{effectiveSlug} · changing this keeps the old link working via a redirect
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Search engines</label>
                  <select
                    value={value.metaRobots || 'index, follow'}
                    onChange={(e) => set({ metaRobots: e.target.value })}
                    className={inputClass}
                  >
                    {ROBOTS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-ink-faint">“No Index” hides this page from Google.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Image alt text</label>
                <input
                  type="text"
                  value={value.imageAltText || ''}
                  onChange={(e) => set({ imageAltText: e.target.value })}
                  placeholder={name || 'Describes the image for search and screen readers'}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>SEO keywords</label>
                <input
                  type="text"
                  value={value.seoKeywords || ''}
                  onChange={(e) => set({ seoKeywords: e.target.value })}
                  placeholder="Comma separated — optional, Google largely ignores these"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Canonical URL</label>
                <input
                  type="text"
                  value={value.canonicalUrl || ''}
                  onChange={(e) => set({ canonicalUrl: e.target.value })}
                  placeholder={`${SITE_URL}${pathPrefix}/${effectiveSlug} (auto)`}
                  className={inputClass}
                />
                <p className="text-xs text-ink-faint">
                  Leave blank unless this page duplicates another one.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <GooglePreview
                title={previewTitle}
                description={previewDescription}
                path={`${pathPrefix}/${effectiveSlug}`}
                settings={settings}
              />
              <SocialPreview
                title={value.ogTitle || previewTitle}
                description={value.ogDescription || previewDescription}
                image={previewImage}
                settings={settings}
              />

              <div className="p-4 rounded-md border border-line bg-white space-y-2">
                <p className="type-eyebrow text-ink-faint">SEO status</p>
                <ul className="space-y-1">
                  {status.map((s) => (
                    <li key={s.label} className="flex items-center gap-2 text-xs">
                      <Check className={`w-3.5 h-3.5 ${s.done ? 'text-emerald-default' : 'text-ink-faint/40'}`} />
                      <span className={s.done ? 'text-ink' : 'text-ink-faint'}>{s.label}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-default" />
                    <span className="text-ink">Structured data (automatic)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Social overrides sit behind the previews — rarely needed. */}
          <details className="rounded-md border border-line">
            <summary className="px-4 py-2.5 text-sm text-ink-soft cursor-pointer select-none">
              Social sharing overrides (optional)
            </summary>
            <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>OG title</label>
                <input type="text" value={value.ogTitle || ''} onChange={(e) => set({ ogTitle: e.target.value })}
                  placeholder={previewTitle} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>OG description</label>
                <input type="text" value={value.ogDescription || ''} onChange={(e) => set({ ogDescription: e.target.value })}
                  placeholder={(previewDescription || '').slice(0, 60)} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <ImageUpload
                  label="OG image"
                  value={value.ogImage}
                  onChange={(v) => set({ ogImage: v })}
                  hint="1200×630 works best. Falls back to the first product image."
                />
              </div>

              {entity === 'product' && (
                <>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Twitter title</label>
                    <input type="text" value={value.twitterTitle || ''} onChange={(e) => set({ twitterTitle: e.target.value })}
                      placeholder={value.ogTitle || previewTitle} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Twitter description</label>
                    <input type="text" value={value.twitterDescription || ''} onChange={(e) => set({ twitterDescription: e.target.value })}
                      placeholder={(value.ogDescription || previewDescription || '').slice(0, 60)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <ImageUpload
                      label="Twitter image"
                      value={value.twitterImage}
                      onChange={(v) => set({ twitterImage: v })}
                      hint="Falls back to the OG image."
                    />
                  </div>
                </>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
