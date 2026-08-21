import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Loader2, Clock, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import usePageMeta from '../hooks/usePageMeta';
import useRedirectFallback from '../hooks/useRedirectFallback';
import { useSeoSettings } from '../context/SeoContext';
import {
  buildTitle, getCanonicalUrl, getOgImage, pickDescription,
  generateBreadcrumbSchema, absoluteUrl,
} from '../lib/seo';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

/**
 * A single article (/blog/:slug).
 *
 * The API only ever serves live posts, so a draft or a not-yet-due scheduled
 * post cannot be reached or indexed here.
 */
const buildArticleSchema = (post, description, settings) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  url: getCanonicalUrl(`/blog/${post.slug}`),
  mainEntityOfPage: { '@type': 'WebPage', '@id': getCanonicalUrl(`/blog/${post.slug}`) },
  ...(description ? { description } : {}),
  ...(post.featured_image ? { image: absoluteUrl(post.featured_image) } : {}),
  ...(post.published_at ? { datePublished: post.published_at } : {}),
  ...(post.updated_at ? { dateModified: post.updated_at } : {}),
  ...(post.author_name ? { author: { '@type': 'Person', name: post.author_name } } : {}),
  publisher: {
    '@type': 'Organization',
    name: settings.organizationName || settings.siteName || 'ORIVIDA',
    ...(settings.organizationLogo ? { logo: { '@type': 'ImageObject', url: absoluteUrl(settings.organizationLogo) } } : {}),
  },
  ...(post.keywords ? { keywords: post.keywords } : {}),
});

export default function BlogPost() {
  const { slug } = useParams();
  const seoSettings = useSeoSettings();

  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    window.scrollTo({ top: 0 });

    api.blog
      .getPost(slug)
      .then((res) => {
        if (cancelled) return;
        setPost(res.post);
        setRelated(res.related || []);
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  // A renamed post keeps its inbound links working.
  const redirecting = useRedirectFallback(notFound);

  const description = pickDescription(post?.meta_description, post?.excerpt, seoSettings.metaDescription);
  const robots = post
    ? `${post.robots_index === false ? 'noindex' : 'index'}, ${post.robots_follow === false ? 'nofollow' : 'follow'}`
    : 'noindex, follow';

  usePageMeta(
    post
      ? {
          title: buildTitle(post.seo_title || post.title, seoSettings),
          description,
          keywords: post.seo_keywords || (post.tags || []).join(', '),
          canonical: post.canonical_url || getCanonicalUrl(`/blog/${post.slug}`),
          path: `/blog/${post.slug}`,
          robots,
          image: getOgImage(post.og_image, post.featured_image, seoSettings),
          ogTitle: post.og_title || post.seo_title || post.title,
          ogDescription: post.og_description || description,
          twitterTitle: post.twitter_title || post.og_title || post.title,
          twitterDescription: post.twitter_description || post.og_description || description,
          twitterImage: post.twitter_image || '',
          type: 'article',
          jsonLd: buildArticleSchema(post, description, seoSettings),
          breadcrumbs: generateBreadcrumbSchema([
            { name: 'Journal', path: '/blog' },
            { name: post.title },
          ]),
        }
      : {
          // An unknown slug is a real 404: say so in the title bar too, and
          // canonicalise to /404 rather than to a URL that does not exist.
          title: notFound ? 'Article Not Found | ORIVIDA' : 'ORIVIDA',
          path: '/404',
          robots: 'noindex, follow',
        }
  );

  if (loading || redirecting) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-ink-soft">
        <Loader2 className="w-5 h-5 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-[60vh] bg-canvas flex flex-col items-center justify-center text-center px-6 gap-5">
        <h1 className="type-display text-3xl text-ink">Article not found</h1>
        <p className="text-sm text-ink-soft max-w-md">
          This article may have moved or is no longer published.
        </p>
        <Link
          to="/blog"
          className="px-8 py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
        >
          Back to the journal
        </Link>
      </div>
    );
  }

  const tags = post.tags || [];

  return (
    <div className="bg-canvas">
      <article className="max-w-[760px] mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs text-ink-soft mb-8">
          <Link to="/" className="hover:text-emerald-default transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-ink-faint" />
          <Link to="/blog" className="hover:text-emerald-default transition-colors">Journal</Link>
          <ChevronRight className="w-3 h-3 text-ink-faint" />
          <span className="text-ink truncate max-w-[50vw]">{post.title}</span>
        </nav>

        <header className="space-y-5 mb-10">
          {post.category && (
            <Link
              to={`/blog?category=${encodeURIComponent(post.category)}`}
              className="type-eyebrow text-emerald-default hover:underline"
            >
              {post.category}
            </Link>
          )}
          <h1 className="type-display text-3xl sm:text-[2.75rem] text-ink leading-tight">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-faint">
            {post.author_name && <span>By {post.author_name}</span>}
            {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {post.reading_minutes || 1} min read
            </span>
          </div>
          {post.excerpt && (
            <p className="text-lg text-ink leading-relaxed whitespace-pre-line">{post.excerpt}</p>
          )}
        </header>

        {post.featured_image && (
          <figure className="mb-10">
            <img
              src={post.featured_image}
              alt={post.image_alt_text || post.title}
              width="760"
              height="428"
              // The cover image is this route's LCP element.
              fetchPriority="high"
              className="w-full aspect-[16/9] object-cover bg-emerald-subtle"
            />
          </figure>
        )}

        {post.content && (
          <div className="prose-editorial space-y-4 text-ink leading-relaxed whitespace-pre-line text-[17px]">
            {post.content}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12 pt-6 border-t border-line">
            {tags.map((tag) => (
              <Link
                key={tag}
                to={`/blog?tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1.5 border border-line text-xs text-ink-soft hover:border-emerald-default hover:text-emerald-default transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-emerald-default link-underline">
            <ArrowLeft className="w-3.5 h-3.5" /> All articles
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-line">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-8">
            <h2 className="type-heading text-2xl text-ink">Keep reading</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-10">
              {related.map((item) => (
                <Link key={item.slug} to={`/blog/${item.slug}`} className="group block space-y-3">
                  <div className="aspect-[4/3] overflow-hidden bg-emerald-subtle">
                    {item.featured_image ? (
                      <img
                        src={item.featured_image}
                        alt={item.image_alt_text || item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center type-display text-3xl text-emerald-default/30">
                        {item.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="type-heading text-base text-ink group-hover:text-emerald-default transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ink-faint">
                    {formatDate(item.published_at)} · {item.reading_minutes || 1} min read
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
