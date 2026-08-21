import { useEffect } from 'react';
import { getCanonicalUrl, absoluteUrl, SITE_URL } from '../lib/seo';

const upsertMeta = (attr, key, content) => {
  const selector = `meta[${attr}="${key.replace(/"/g, '\\"')}"]`;
  let el = document.head.querySelector(selector);
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

/**
 * JSON-LD is written as a text node into a script the page owns, never via
 * innerHTML of page data, so a value from the database cannot break out of
 * the block or execute.
 */
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
 * Per-route SEO for the storefront.
 *
 * Sets title, description, keywords, canonical, robots, Open Graph and
 * Twitter tags, plus optional JSON-LD blocks. Values are expected to come
 * from the generators in lib/seo.js, which resolve the admin → entity →
 * global fallback chain before anything reaches the DOM.
 *
 * @param {object} meta
 * @param {string}  meta.title
 * @param {string}  [meta.description]
 * @param {string}  [meta.keywords]
 * @param {string}  [meta.canonical]  Absolute URL; derived from `path` if absent
 * @param {string}  [meta.path]       Route path, used for canonical + og:url
 * @param {string}  [meta.image]      OG image (absolute preferred)
 * @param {string}  [meta.type]       og:type
 * @param {string}  [meta.robots]
 * @param {string}  [meta.ogTitle] [meta.ogDescription]
 * @param {string}  [meta.twitterTitle] [meta.twitterDescription] [meta.twitterImage]
 * @param {string}  [meta.twitterCard]
 * @param {object}  [meta.jsonLd]      Primary structured data for the page
 * @param {object}  [meta.breadcrumbs] BreadcrumbList structured data
 */
export default function usePageMeta(meta) {
  const serialized = JSON.stringify(meta || {});

  useEffect(() => {
    const m = JSON.parse(serialized);
    if (!m || !m.title) return;

    document.title = m.title;

    const url = m.canonical || getCanonicalUrl(m.path || window.location.pathname);
    const image = absoluteUrl(m.image) || `${SITE_URL}/logo.png`;

    upsertMeta('name', 'description', m.description || '');
    upsertMeta('name', 'keywords', m.keywords || '');
    upsertMeta('name', 'robots', m.robots || '');
    upsertCanonical(url);

    upsertMeta('property', 'og:title', m.ogTitle || m.title);
    upsertMeta('property', 'og:description', m.ogDescription || m.description || '');
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:type', m.type || 'website');
    upsertMeta('property', 'og:site_name', 'ORIVIDA');

    upsertMeta('name', 'twitter:card', m.twitterCard || 'summary_large_image');
    upsertMeta('name', 'twitter:title', m.twitterTitle || m.ogTitle || m.title);
    upsertMeta('name', 'twitter:description', m.twitterDescription || m.ogDescription || m.description || '');
    upsertMeta('name', 'twitter:image', absoluteUrl(m.twitterImage) || image);

    upsertJsonLd('page-jsonld', m.jsonLd || null);
    upsertJsonLd('breadcrumbs-jsonld', m.breadcrumbs || null);
  }, [serialized]);
}

/**
 * Site-wide SEO that belongs in <head> once rather than per route:
 * Organization and WebSite structured data, Search Console verification and
 * the analytics snippets. Injected only when an admin has configured them.
 */
export function useSiteSeo(settings) {
  const serialized = JSON.stringify(settings || {});

  useEffect(() => {
    const s = JSON.parse(serialized);
    if (!s || Object.keys(s).length === 0) return;

    if (s.googleSiteVerification) {
      upsertMeta('name', 'google-site-verification', s.googleSiteVerification);
    }
    if (s.organizationSchema) {
      upsertJsonLd('organization-jsonld', s.organizationSchema);
      // The static block in index.html describes the same organisation, so it
      // goes once the live one is in place — two blocks for one entity is
      // what structured-data validators flag.
      document.getElementById('ld-static-organization')?.remove();
    }
    if (s.websiteSchema) upsertJsonLd('website-jsonld', s.websiteSchema);

    // Analytics loads only when an ID is configured, so no third-party
    // JavaScript reaches visitors of an unconfigured store.
    const gaId = String(s.googleAnalyticsId || '').trim();
    if (/^G-[A-Z0-9]+$/i.test(gaId) && !document.getElementById('ga4-script')) {
      const loader = document.createElement('script');
      loader.id = 'ga4-script';
      loader.async = true;
      loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(loader);

      const init = document.createElement('script');
      init.id = 'ga4-init';
      init.textContent =
        `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
        `gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`;
      document.head.appendChild(init);
    }

    const gtmId = String(s.googleTagManagerId || '').trim();
    if (/^GTM-[A-Z0-9]+$/i.test(gtmId) && !document.getElementById('gtm-script')) {
      const gtm = document.createElement('script');
      gtm.id = 'gtm-script';
      gtm.textContent =
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
        `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;` +
        `j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})` +
        `(window,document,'script','dataLayer',${JSON.stringify(gtmId)});`;
      document.head.appendChild(gtm);
    }
  }, [serialized]);
}
