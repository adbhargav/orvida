import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Check, X, SlidersHorizontal, ArrowRight } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';
import { api } from '../services/api';

const PRICE_OPTIONS = [
  { value: 'all', label: 'All prices' },
  { value: '0-999', label: 'Under ₹999' },
  { value: '0-1999', label: 'Under ₹1,999' },
  { value: '0-4999', label: 'Under ₹4,999' },
  { value: '5000-', label: '₹5,000 and above' },
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'newest', label: 'New arrivals' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All items' },
  { value: 'in-stock', label: 'In stock only' },
  { value: 'on-offer', label: 'On offer' },
];

const DEFAULTS = { price: 'all', tag: 'all', availability: 'all', sort: 'featured' };

/* ------------------------------------------------------------------ *
 * Desktop dropdown
 * ------------------------------------------------------------------ */

function FilterDropdown({ id, label, value, options, onChange, activeId, setActiveId }) {
  const isOpen = activeId === id;
  const isSet = value !== 'all' && value !== 'featured';
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setActiveId(isOpen ? null : id)}
        aria-expanded={isOpen}
        className={`flex items-center gap-2 px-4 py-2.5 border text-sm whitespace-nowrap transition-colors ${
          isSet ? 'border-ink text-ink' : 'border-line text-ink-soft hover:border-ink hover:text-ink'
        }`}
      >
        <span>{isSet ? selected?.label : label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1.5 min-w-[15rem] bg-white border border-line shadow-lifted animate-fadeIn">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setActiveId(null); }}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left text-ink-soft hover:bg-emerald-subtle hover:text-ink transition-colors"
            >
              {option.label}
              {value === option.value && <Check className="w-3.5 h-3.5 text-emerald-default shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Mobile filter sheet
 *
 * A bottom sheet keeps the controls within thumb reach and stops four
 * dropdown pills from wrapping across two rows on a phone.
 * ------------------------------------------------------------------ */

function FilterSheet({ open, onClose, groups, onReset, resultCount }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter and sort">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-white flex flex-col animate-riseIn">
        <div className="flex justify-between items-center px-5 h-14 border-b border-line shrink-0">
          <h2 className="type-heading text-lg text-ink">Filter &amp; sort</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-ink-soft" aria-label="Close filters">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {groups.map((group) => (
            <fieldset key={group.id} className="py-4 border-b border-line">
              <legend className="type-eyebrow text-ink-soft mb-3">{group.label}</legend>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => group.onChange(option.value)}
                    className={`px-3.5 py-2 border text-sm transition-colors ${
                      group.value === option.value
                        ? 'border-ink bg-ink text-white'
                        : 'border-line text-ink-soft'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-line flex gap-3 shrink-0">
          <button
            onClick={onReset}
            className="px-6 py-3.5 border border-line text-ink text-[11px] uppercase tracking-[0.14em]"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-emerald-default text-white text-[11px] uppercase tracking-[0.16em]"
          >
            Show {resultCount} {resultCount === 1 ? 'piece' : 'pieces'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function CategoryPage() {
  const { slug, subSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [siblingCategories, setSiblingCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [price, setPrice] = useState(DEFAULTS.price);
  const [tag, setTag] = useState(DEFAULTS.tag);
  const [availability, setAvailability] = useState(DEFAULTS.availability);
  const [sortBy, setSortBy] = useState(DEFAULTS.sort);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const filterBarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // No bundled fallback: a failed category request surfaces as an error
      // rather than quietly rendering stale sample data.
      const [catRes, prodRes, allCatsRes] = await Promise.all([
        api.categories.getBySlug(slug),
        api.products.getAll({ category: slug, limit: 100 }),
        api.categories.getAll().catch(() => ({ categories: [] })),
      ]);
      setCategory(catRes.category || null);
      setProducts(prodRes.products || []);
      setSiblingCategories((allCatsRes.categories || []).filter((c) => c.slug !== slug));
    } catch (err) {
      setError(
        err.status === 404
          ? 'This collection does not exist.'
          : err.message || 'Could not load this collection.'
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();
  }, [loadData]);

  const subcategories = category?.subcategories || [];
  const activeSub = subcategories.find((s) => s.slug === subSlug) || null;

  // Only offer tags that exist in this collection, so no filter dead-ends.
  const tagOptions = useMemo(() => {
    const tags = new Set();
    products
      .filter((p) => !subSlug || p.subcategorySlug === subSlug)
      .forEach((p) => (p.tags || []).forEach((t) => tags.add(t)));
    return [{ value: 'all', label: 'All characteristics' }, ...[...tags].sort().map((t) => ({ value: t, label: t }))];
  }, [products, subSlug]);

  const visibleProducts = useMemo(() => {
    let list = [...products];

    if (subSlug) list = list.filter((p) => p.subcategorySlug === subSlug);

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    if (tag !== 'all') list = list.filter((p) => (p.tags || []).includes(tag));
    if (availability === 'in-stock') list = list.filter((p) => p.stock > 0);
    if (availability === 'on-offer') list = list.filter((p) => Boolean(p.discountPrice));

    if (price !== 'all') {
      const [min, max] = price.split('-');
      list = list.filter((p) => {
        if (min && p.effectivePrice < Number(min)) return false;
        if (max && p.effectivePrice > Number(max)) return false;
        return true;
      });
    }

    if (sortBy === 'price-low') list.sort((a, b) => a.effectivePrice - b.effectivePrice);
    else if (sortBy === 'price-high') list.sort((a, b) => b.effectivePrice - a.effectivePrice);
    else if (sortBy === 'rating') list.sort((a, b) => b.avgRating - a.avgRating);
    else if (sortBy === 'newest') list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    else list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

    return list;
  }, [products, subSlug, searchTerm, tag, availability, price, sortBy]);

  // Product counts per subcategory, so the rail shows what is actually stocked.
  const countFor = useCallback(
    (subcategorySlug) => products.filter((p) => p.subcategorySlug === subcategorySlug).length,
    [products]
  );

  const activeChips = [
    price !== 'all' && { label: PRICE_OPTIONS.find((o) => o.value === price)?.label, clear: () => setPrice('all') },
    tag !== 'all' && { label: tag, clear: () => setTag('all') },
    availability !== 'all' && {
      label: AVAILABILITY_OPTIONS.find((o) => o.value === availability)?.label,
      clear: () => setAvailability('all'),
    },
    sortBy !== 'featured' && {
      label: SORT_OPTIONS.find((o) => o.value === sortBy)?.label,
      clear: () => setSortBy('featured'),
    },
  ].filter(Boolean);

  const resetFilters = () => {
    setPrice(DEFAULTS.price);
    setTag(DEFAULTS.tag);
    setAvailability(DEFAULTS.availability);
    setSortBy(DEFAULTS.sort);
    setActiveDropdown(null);
  };

  const filterGroups = [
    { id: 'price', label: 'Price', value: price, options: PRICE_OPTIONS, onChange: setPrice },
    { id: 'availability', label: 'Availability', value: availability, options: AVAILABILITY_OPTIONS, onChange: setAvailability },
    ...(tagOptions.length > 1
      ? [{ id: 'tag', label: 'Characteristics', value: tag, options: tagOptions, onChange: setTag }]
      : []),
    { id: 'sort', label: 'Sort by', value: sortBy, options: SORT_OPTIONS, onChange: setSortBy },
  ];

  const headingName = activeSub?.name || category?.name || 'Collection';

  return (
    <div className="bg-canvas min-h-screen">
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}

      {/* Header — compact on phones so products appear above the fold sooner */}
      <header className="border-b border-line bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-soft mb-3 sm:mb-5 flex-wrap">
            <Link to="/" className="hover:text-emerald-default transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-ink-faint shrink-0" />
            {activeSub ? (
              <>
                <Link to={`/category/${slug}`} className="hover:text-emerald-default transition-colors">
                  {category?.name}
                </Link>
                <ChevronRight className="w-3 h-3 text-ink-faint shrink-0" />
                <span className="text-ink">{activeSub.name}</span>
              </>
            ) : (
              <span className="text-ink">{category?.name}</span>
            )}
          </nav>

          <div className="max-w-2xl space-y-2 sm:space-y-3">
            <h1 className="type-display text-[1.75rem] sm:text-[2.75rem] text-ink">{headingName}</h1>
            {!activeSub && category?.tagline && (
              <p className="type-heading text-base sm:text-lg text-emerald-default italic">{category.tagline}</p>
            )}
            {!activeSub && category?.description && (
              <p className="hidden sm:block text-ink-soft leading-relaxed">{category.description}</p>
            )}
          </div>

          {searchTerm && (
            <p className="mt-4 text-sm text-ink-soft">
              Results for “<span className="text-ink">{searchTerm}</span>”
              <button onClick={() => navigate(`/category/${slug}`)} className="ml-2 text-emerald-default link-underline">
                Clear
              </button>
            </p>
          )}
        </div>
      </header>

      {/* Subcategory rail — browsable without opening a dropdown */}
      {subcategories.length > 0 && !searchTerm && (
        <section aria-label="Browse subcategories" className="border-b border-line bg-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-5 sm:py-7">
            {/* No scroll-snap here: the per-subcategory counts arrive after the
                products load, and the resulting height change made the snap
                engine jump the rail away from its first item. */}
            <div className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-none -mx-1 px-1">
              <Link
                to={`/category/${slug}`}
                className="group shrink-0 text-center"
                style={{ width: '84px' }}
              >
                <div
                  className={`w-[72px] h-[72px] sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden border-2 transition-colors flex items-center justify-center bg-emerald-subtle ${
                    !activeSub ? 'border-emerald-default' : 'border-transparent group-hover:border-line-strong'
                  }`}
                >
                  <span className="type-price text-lg text-emerald-default">{products.length}</span>
                </div>
                <span className={`block mt-2 text-[11px] leading-tight ${!activeSub ? 'text-emerald-default' : 'text-ink-soft'}`}>
                  All
                </span>
              </Link>


              {subcategories.map((sub) => {
                const isActive = sub.slug === subSlug;
                const count = countFor(sub.slug);
                return (
                  <Link
                    key={sub.id}
                    to={`/category/${slug}/${sub.slug}`}
                    className="group shrink-0 text-center"
                    style={{ width: '84px' }}
                  >
                    <div
                      className={`w-[72px] h-[72px] sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden border-2 transition-colors bg-emerald-subtle ${
                        isActive ? 'border-emerald-default' : 'border-transparent group-hover:border-line-strong'
                      }`}
                    >
                      {sub.image && (
                        <img
                          src={sub.image}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      )}
                    </div>
                    {/* Count sits inline so every tile keeps the same height
                        whether or not the subcategory is stocked. */}
                    <span className={`block mt-2 text-[11px] leading-tight ${isActive ? 'text-emerald-default' : 'text-ink-soft'}`}>
                      {sub.name}
                      {count > 0 && <span className="text-ink-faint tabular"> ({count})</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Filter bar */}
      <div className="sticky top-[72px] sm:top-20 z-30 bg-canvas/95 backdrop-blur-md border-b border-line">
        <div ref={filterBarRef} className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-3 sm:py-4">
          {/* Phones: one button opening the sheet */}
          <div className="flex lg:hidden items-center justify-between gap-3">
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-line text-sm text-ink"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter &amp; sort
              {activeChips.length > 0 && (
                <span className="ml-0.5 w-5 h-5 rounded-full bg-emerald-default text-white text-[10px] flex items-center justify-center tabular">
                  {activeChips.length}
                </span>
              )}
            </button>
            <span className="text-sm text-ink-soft tabular">
              {loading ? '—' : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'piece' : 'pieces'}`}
            </span>
          </div>

          {/* Desktop: inline dropdowns */}
          <div className="hidden lg:flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-ink-faint shrink-0" />
            <FilterDropdown id="price" label="Price" value={price} options={PRICE_OPTIONS}
              onChange={setPrice} activeId={activeDropdown} setActiveId={setActiveDropdown} />
            <FilterDropdown id="availability" label="Availability" value={availability} options={AVAILABILITY_OPTIONS}
              onChange={setAvailability} activeId={activeDropdown} setActiveId={setActiveDropdown} />
            {tagOptions.length > 1 && (
              <FilterDropdown id="tag" label="Characteristics" value={tag} options={tagOptions}
                onChange={setTag} activeId={activeDropdown} setActiveId={setActiveDropdown} />
            )}
            <FilterDropdown id="sort" label="Sort" value={sortBy} options={SORT_OPTIONS}
              onChange={setSortBy} activeId={activeDropdown} setActiveId={setActiveDropdown} />

            {activeChips.length > 0 && (
              <button onClick={resetFilters} className="px-3 py-2.5 text-sm text-ink-soft hover:text-emerald-default transition-colors">
                Clear all
              </button>
            )}

            <span className="ml-auto text-sm text-ink-soft tabular shrink-0">
              {loading ? '—' : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'piece' : 'pieces'}`}
            </span>
          </div>

          {/* Active filters, removable individually. Phones only: on desktop
              each dropdown trigger already displays its own selection, so
              chips would repeat the same labels directly beneath it. */}
          {activeChips.length > 0 && (
            <div className="flex lg:hidden gap-2 overflow-x-auto scrollbar-none pt-3">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={chip.clear}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-subtle border border-line text-xs text-ink"
                >
                  {chip.label}
                  <X className="w-3 h-3 text-ink-faint" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-14">
        {loading ? (
          // A quiet reserved area rather than animated skeleton cards, which
          // read as buffering. The grid simply fades in once data arrives.
          <div className="min-h-[40vh]" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading the collection</span>
          </div>
        ) : error ? (
          <div className="py-20 text-center space-y-3">
            <p className="type-heading text-xl text-ink">{error}</p>
            <button onClick={loadData} className="text-sm text-emerald-default link-underline">Try again</button>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <p className="type-heading text-2xl text-ink">
              {products.length === 0 ? 'This collection is being restocked' : 'Nothing matches those filters'}
            </p>
            <p className="text-sm text-ink-soft max-w-md mx-auto">
              {products.length === 0
                ? 'New pieces are arriving shortly. Explore the rest of the catalogue in the meantime.'
                : 'Try widening your selection to see more of the collection.'}
            </p>
            {activeChips.length > 0 ? (
              <button onClick={resetFilters} className="text-sm text-emerald-default link-underline">
                Clear all filters
              </button>
            ) : (
              <Link
                to="/category/plants"
                className="inline-flex items-center gap-2 px-7 py-3 border border-ink text-ink hover:bg-ink hover:text-white text-[11px] uppercase tracking-[0.16em] transition-colors"
              >
                Browse all plants <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-fadeIn">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
              ))}
            </div>

            {/* Keeps a sparse grid from ending in dead space */}
            {visibleProducts.length < 4 && (
              <div className="mt-12 pt-10 border-t border-line text-center space-y-3">
                <p className="type-heading text-xl text-ink">Looking for something else?</p>
                <p className="text-sm text-ink-soft">Explore the wider ORIVIDA catalogue.</p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {siblingCategories.map((c) => (
                    <Link
                      key={c.slug}
                      to={`/category/${c.slug}`}
                      className="px-4 py-2 border border-line text-sm text-ink-soft hover:border-emerald-default hover:text-emerald-default transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        groups={filterGroups}
        onReset={resetFilters}
        resultCount={visibleProducts.length}
      />
    </div>
  );
}
