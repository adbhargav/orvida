import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import usePageMeta from '../hooks/usePageMeta';
import useRedirectFallback from '../hooks/useRedirectFallback';
import { useSeoSettings } from '../context/SeoContext';
import {
  buildTitle, getCanonicalUrl, getOgImage, pickDescription,
  generateBreadcrumbSchema, absoluteUrl,
} from '../lib/seo';

/**
 * Public SEO landing page (/:slug).
 *
 * The API only ever serves live pages, so a draft or a not-yet-due scheduled
 * page cannot be reached or indexed here — this component never has to decide
 * that for itself.
 */

/** Page schema built from what the page actually renders. */
const buildPageSchema = (page, description) => {
  const url = getCanonicalUrl(`/${page.slug}`);
  const faqs = (page.faqs || []).filter((f) => f?.question && f?.answer);

  if (page.schema_type === 'FAQPage' && faqs.length > 0) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    };
  }

  const base = {
    '@context': 'https://schema.org',
    '@type': page.schema_type || 'WebPage',
    name: page.h1 || page.name,
    url,
    ...(description ? { description } : {}),
    ...(page.featured_image ? { image: absoluteUrl(page.featured_image) } : {}),
  };

  if (page.schema_type === 'Article') {
    return {
      ...base,
      headline: page.h1 || page.name,
      datePublished: page.published_at || undefined,
      dateModified: page.updated_at || undefined,
    };
  }
  return base;
};

function Faq({ item, index, openId, setOpenId }) {
  const isOpen = openId === index;
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpenId(isOpen ? null : index)}
        aria-expanded={isOpen}
        className="w-full py-4 flex justify-between items-center gap-4 text-left"
      >
        <span className="type-heading text-base text-ink">{item.question}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-ink-soft transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <p className="pb-5 text-sm text-ink leading-relaxed whitespace-pre-line animate-fadeIn">{item.answer}</p>
      )}
    </div>
  );
}

export default function SeoLandingPage() {
  const { slug } = useParams();
  const seoSettings = useSeoSettings();

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    api.seo
      .getPage(slug)
      .then((res) => {
        if (!cancelled) setPage(res.page);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  // A renamed landing page keeps its inbound links working.
  const redirecting = useRedirectFallback(notFound);

  const description = pickDescription(page?.meta_description, page?.intro, seoSettings.metaDescription);
  const robots = page
    ? `${page.robots_index === false ? 'noindex' : 'index'}, ${page.robots_follow === false ? 'nofollow' : 'follow'}`
    : 'noindex, follow';

  usePageMeta(
    page
      ? {
          title: buildTitle(page.seo_title || page.name, seoSettings),
          description,
          keywords: page.seo_keywords || page.secondary_keywords || '',
          canonical: page.canonical_url || getCanonicalUrl(`/${page.slug}`),
          path: `/${page.slug}`,
          robots,
          image: getOgImage(page.og_image, page.featured_image, seoSettings),
          ogTitle: page.og_title || page.seo_title || page.name,
          ogDescription: page.og_description || description,
          twitterTitle: page.twitter_title || page.og_title || page.name,
          twitterDescription: page.twitter_description || page.og_description || description,
          twitterImage: page.twitter_image || '',
          type: page.schema_type === 'Article' ? 'article' : 'website',
          jsonLd: buildPageSchema(page, description),
          breadcrumbs: generateBreadcrumbSchema([
            ...(page.breadcrumbs || []).map((b) => ({ name: b.label, path: b.url })),
            { name: page.h1 || page.name },
          ]),
        }
      : { title: 'ORIVIDA', robots: 'noindex, follow' }
  );

  if (loading || redirecting) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-ink-soft">
        <Loader2 className="w-5 h-5 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-[60vh] bg-canvas flex flex-col items-center justify-center text-center px-6 gap-5">
        <h1 className="type-display text-3xl text-ink">Page not found</h1>
        <p className="text-sm text-ink-soft max-w-md">
          This page may have moved or is no longer published.
        </p>
        <Link
          to="/category/plants"
          className="px-8 py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  const faqs = (page.faqs || []).filter((f) => f?.question && f?.answer);
  const links = (page.internal_links || []).filter((l) => l?.text && l?.url);
  const cta = page.cta || {};
  const crumbs = page.breadcrumbs || [];

  return (
    <div className="bg-canvas">
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs text-ink-soft mb-8">
            {crumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <Link to={crumb.url} className="hover:text-emerald-default transition-colors">{crumb.label}</Link>
                <ChevronRight className="w-3 h-3 text-ink-faint" />
              </React.Fragment>
            ))}
            <span className="text-ink">{page.h1 || page.name}</span>
          </nav>
        )}

        <header className="space-y-5 mb-10">
          <h1 className="type-display text-3xl sm:text-[2.75rem] text-ink leading-tight">
            {page.h1 || page.name}
          </h1>
          {page.intro && (
            <p className="text-lg text-ink leading-relaxed whitespace-pre-line">{page.intro}</p>
          )}
        </header>

        {page.featured_image && (
          <figure className="mb-10">
            <img
              src={page.featured_image}
              alt={page.image_alt_text || page.h1 || page.name}
              width="900"
              height="506"
              // The hero image is this route's LCP element.
              fetchPriority="high"
              className="w-full aspect-[16/9] object-cover bg-emerald-subtle"
            />
          </figure>
        )}

        {page.content && (
          <div className="prose-editorial space-y-4 text-ink leading-relaxed whitespace-pre-line mb-12">
            {page.content}
          </div>
        )}

        {faqs.length > 0 && (
          <section className="mb-12">
            <h2 className="type-heading text-2xl text-ink mb-4">Frequently asked questions</h2>
            <div className="border-t border-line">
              {faqs.map((item, idx) => (
                <Faq key={idx} item={item} index={idx} openId={openFaq} setOpenId={setOpenFaq} />
              ))}
            </div>
          </section>
        )}

        {links.length > 0 && (
          <section className="mb-12">
            <h2 className="type-heading text-2xl text-ink mb-4">Explore further</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {links.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.url}
                    className="group flex items-center justify-between gap-3 px-4 py-3 border border-line hover:border-emerald-default transition-colors"
                  >
                    <span className="text-sm text-ink group-hover:text-emerald-default transition-colors">
                      {link.text}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-faint group-hover:text-emerald-default transition-colors shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(cta.heading || cta.buttonText) && (
          <section className="bg-emerald-default text-white px-6 sm:px-10 py-10 text-center space-y-5">
            {cta.heading && <h2 className="type-display text-2xl sm:text-3xl">{cta.heading}</h2>}
            {cta.text && <p className="text-emerald-light/80 max-w-xl mx-auto leading-relaxed">{cta.text}</p>}
            {cta.buttonText && cta.buttonUrl && (
              <Link
                to={cta.buttonUrl}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-emerald-deep hover:bg-emerald-light text-[11px] uppercase tracking-[0.16em] transition-colors"
              >
                {cta.buttonText} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
