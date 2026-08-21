import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Clock, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { api } from '../services/api';
import usePageMeta from '../hooks/usePageMeta';
import { useSeoSettings } from '../context/SeoContext';
import { buildTitle, getCanonicalUrl, getOgImage, generateBreadcrumbSchema, absoluteUrl } from '../lib/seo';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

function PostCard({ post, featured = false }) {
  return (
    <article className={featured ? 'sm:col-span-2' : ''}>
      <Link to={`/blog/${post.slug}`} className="group block space-y-3">
        <div className={`overflow-hidden bg-emerald-subtle ${featured ? 'aspect-[16/7]' : 'aspect-[4/3]'}`}>
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.image_alt_text || post.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center type-display text-4xl text-emerald-default/30">
              {post.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            {post.category && <span className="text-emerald-default uppercase tracking-[0.12em]">{post.category}</span>}
            {post.published_at && <span>{formatDate(post.published_at)}</span>}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {post.reading_minutes || 1} min read
            </span>
          </div>
          <h2 className={`type-heading text-ink group-hover:text-emerald-default transition-colors ${
            featured ? 'text-2xl sm:text-3xl' : 'text-lg'
          }`}>
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-ink-soft leading-relaxed line-clamp-3">{post.excerpt}</p>
          )}
        </div>
      </Link>
    </article>
  );
}

/**
 * The public blog index (/blog).
 *
 * Filters live in the query string so a filtered view is a shareable,
 * bookmarkable URL — but every one of them is canonicalised back to /blog and
 * left out of the index, because they are the same articles resorted.
 */
export default function BlogIndex() {
  const seoSettings = useSeoSettings();
  const [params, setParams] = useSearchParams();

  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const category = params.get('category') || '';
  const tag = params.get('tag') || '';
  const search = params.get('search') || '';

  const [data, setData] = useState({ posts: [], categories: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchDraft, setSearchDraft] = useState(search);

  const isFiltered = Boolean(category || tag || search || page > 1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.blog.list({ page, category, tag, search, limit: 12 });
      setData({
        posts: res.posts || [],
        categories: res.categories || [],
        pagination: res.pagination || { page: 1, pages: 1, total: 0 },
      });
    } catch (err) {
      setError(err.message || 'Could not load the journal.');
    } finally {
      setLoading(false);
    }
  }, [page, category, tag, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSearchDraft(search); }, [search]);

  usePageMeta({
    title: buildTitle('Journal — plant care guides & stories', seoSettings),
    description:
      'Care guides, growing notes and stories from the ORIVIDA studio — how to choose, place and keep living things thriving at home.',
    canonical: getCanonicalUrl('/blog'),
    path: '/blog',
    // Filtered and paginated views are the same articles rearranged, so they
    // point back at /blog rather than competing with it.
    robots: isFiltered ? 'noindex, follow' : 'index, follow',
    image: getOgImage('', '', seoSettings),
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: `${seoSettings.siteName || 'ORIVIDA'} Journal`,
      url: getCanonicalUrl('/blog'),
      blogPost: (data.posts || []).slice(0, 10).map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        url: getCanonicalUrl(`/blog/${post.slug}`),
        ...(post.published_at ? { datePublished: post.published_at } : {}),
        ...(post.featured_image ? { image: absoluteUrl(post.featured_image) } : {}),
      })),
    },
    breadcrumbs: generateBreadcrumbSchema([{ name: 'Journal' }]),
  });

  const setFilter = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    // Any change of filter starts again at the first page.
    next.delete('page');
    setParams(next);
  };

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(params);
    if (nextPage > 1) next.set('page', String(nextPage));
    else next.delete('page');
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { posts, categories, pagination } = data;

  return (
    <div className="bg-canvas">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-10">
        <header className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="type-eyebrow text-emerald-default">The ORIVIDA Journal</span>
          <h1 className="type-display text-3xl sm:text-[2.75rem] text-ink leading-tight">
            Notes on living with plants
          </h1>
          <p className="text-ink-soft leading-relaxed">
            Care guides, growing notes and the thinking behind what we grow.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-y border-line py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter({ category: '', tag: '' })}
              className={`px-3.5 py-1.5 rounded-full text-xs uppercase tracking-[0.12em] transition ${
                !category && !tag ? 'bg-emerald-default text-white' : 'text-ink-soft hover:text-emerald-default'
              }`}
            >
              All
            </button>
            {categories.map((name) => (
              <button
                key={name}
                onClick={() => setFilter({ category: name, tag: '' })}
                className={`px-3.5 py-1.5 rounded-full text-xs uppercase tracking-[0.12em] transition ${
                  category === name ? 'bg-emerald-default text-white' : 'text-ink-soft hover:text-emerald-default'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setFilter({ search: searchDraft.trim() }); }}
            className="relative w-full sm:w-64"
          >
            <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search the journal" aria-label="Search the journal"
              className="w-full pl-10 pr-3.5 py-2.5 border border-line bg-white text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-emerald-default transition"
            />
          </form>
        </div>

        {tag && (
          <p className="text-sm text-ink-soft">
            Tagged “{tag}” ·{' '}
            <button onClick={() => setFilter({ tag: '' })} className="text-emerald-default link-underline">
              clear
            </button>
          </p>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-ink-soft">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm">Loading the journal…</p>
          </div>
        ) : error ? (
          <div className="py-24 text-center space-y-3">
            <p className="text-sm text-ink">{error}</p>
            <button onClick={load} className="text-sm text-emerald-default link-underline">Try again</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <h2 className="type-heading text-xl text-ink">
              {isFiltered ? 'Nothing here yet' : 'The journal is just getting started'}
            </h2>
            <p className="text-sm text-ink-soft max-w-md mx-auto">
              {isFiltered
                ? 'No articles match that search. Try another word, or browse everything.'
                : 'The first articles are being written. In the meantime, the collection is waiting.'}
            </p>
            <Link
              to={isFiltered ? '/blog' : '/category/plants'}
              className="inline-block px-8 py-3.5 bg-emerald-default hover:bg-emerald-deep text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
            >
              {isFiltered ? 'Browse all articles' : 'Browse the collection'}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {posts.map((post, idx) => (
                // The first post gets the wide treatment only on an unfiltered
                // first page, where it reads as the lead story.
                <PostCard
                  key={post.id}
                  post={post}
                  featured={idx === 0 && page === 1 && !isFiltered && post.is_featured}
                />
              ))}
            </div>

            {pagination.pages > 1 && (
              <nav className="flex items-center justify-center gap-6 pt-6 border-t border-line" aria-label="Pagination">
                <button
                  onClick={() => goToPage(page - 1)} disabled={page <= 1}
                  className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-emerald-default disabled:opacity-40 disabled:hover:text-ink-soft transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Newer
                </button>
                <span className="text-xs text-ink-faint uppercase tracking-[0.12em]">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)} disabled={page >= pagination.pages}
                  className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-emerald-default disabled:opacity-40 disabled:hover:text-ink-soft transition"
                >
                  Older <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
