import { useEffect } from 'react';

const SITE_ORIGIN = 'https://orvida.in';

const upsertMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${CSS.escape(key)}"]`);
  if (!content) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const upsertJsonLd = (id, data) => {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

/**
 * Per-route SEO. Sets the document title, description, canonical URL,
 * Open Graph / Twitter tags, optional robots directive and optional
 * JSON-LD blocks. Google's crawler executes JavaScript, so these tags
 * are what it indexes for each route.
 *
 * @param {object} meta
 * @param {string}  meta.title        Full document title
 * @param {string}  [meta.description]
 * @param {string}  [meta.image]      Absolute URL preferred
 * @param {string}  [meta.path]       Route path for the canonical URL
 * @param {string}  [meta.type]       og:type (website, product, article…)
 * @param {string}  [meta.robots]     e.g. 'noindex, nofollow' for private pages
 * @param {object}  [meta.jsonLd]     Structured data for this page
 * @param {object}  [meta.breadcrumbs] BreadcrumbList structured data
 */
export default function usePageMeta(meta) {
  const serialized = JSON.stringify(meta);

  useEffect(() => {
    const m = JSON.parse(serialized);
    if (!m || !m.title) return;

    document.title = m.title;
    const url = `${SITE_ORIGIN}${m.path || window.location.pathname}`;
    const image = m.image
      ? (m.image.startsWith('http') ? m.image : `${SITE_ORIGIN}${m.image}`)
      : `${SITE_ORIGIN}/logo.png`;

    upsertMeta('name', 'description', m.description || '');
    upsertMeta('name', 'robots', m.robots || '');
    upsertCanonical(url);

    upsertMeta('property', 'og:title', m.title);
    upsertMeta('property', 'og:description', m.description || '');
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:type', m.type || 'website');
    upsertMeta('property', 'og:site_name', 'ORIVIDA');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', m.title);
    upsertMeta('name', 'twitter:description', m.description || '');
    upsertMeta('name', 'twitter:image', image);

    upsertJsonLd('page-jsonld', m.jsonLd || null);
    upsertJsonLd('breadcrumbs-jsonld', m.breadcrumbs || null);
  }, [serialized]);
}
