import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Filter, ChevronRight, X, Sparkles, RefreshCw, ChevronDown, Check, Grid3X3, LayoutGrid } from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/mockData';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';

export default function CategoryPage() {
  const { slug, subSlug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQueryParam = searchParams.get('search');

  const [selectedSubcategory, setSelectedSubcategory] = useState(subSlug || 'all');
  const [priceRangeFilter, setPriceRangeFilter] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sunlightFilter, setSunlightFilter] = useState('all');
  const [waterFilter, setWaterFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [layoutColumns, setLayoutColumns] = useState(4);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Active Dropdown Popover State ('price' | 'characteristics' | 'sunlight' | 'water' | 'sort' | null)
  const [activeDropdown, setActiveDropdown] = useState(null);
  const filterContainerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterContainerRef.current && !filterContainerRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Match current Category
  const category = CATEGORIES.find(c => c.slug === slug) || CATEGORIES[0];
  const activeSubcategoryObj = category.subcategories.find(s => s.slug === selectedSubcategory);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = PRODUCTS.filter(p => p.categorySlug === category.slug);

    if (searchQueryParam) {
      list = list.filter(p => p.name.toLowerCase().includes(searchQueryParam.toLowerCase()));
    }

    if (selectedSubcategory !== 'all') {
      list = list.filter(p => p.subcategorySlug === selectedSubcategory);
    }

    // Price Filter
    if (priceRangeFilter === '999') {
      list = list.filter(p => (p.discountPrice || p.price) <= 999);
    } else if (priceRangeFilter === '1999') {
      list = list.filter(p => (p.discountPrice || p.price) <= 1999);
    } else if (priceRangeFilter === '4999') {
      list = list.filter(p => (p.discountPrice || p.price) <= 4999);
    } else if (priceRangeFilter === '5000') {
      list = list.filter(p => (p.discountPrice || p.price) >= 5000);
    }

    // Tag / Characteristics Filter
    if (selectedTag !== 'all') {
      list = list.filter(p => p.tags && p.tags.includes(selectedTag));
    }

    // Sunlight Filter
    if (sunlightFilter === 'bright') {
      list = list.filter(p => p.careInstructions?.toLowerCase().includes('bright') || true);
    }

    let result = [...list];

    if (sortBy === 'price-low') {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.avgRating || 5) - (a.avgRating || 5));
    }

    return result;
  }, [category, selectedSubcategory, priceRangeFilter, selectedTag, sunlightFilter, waterFilter, sortBy, searchQueryParam]);

  const categoryColors = ['#3B5998', '#C05656', '#8B5A3C', '#6B7028', '#E6A119', '#6B8E85', '#8E6B89'];

  const resetAllFilters = () => {
    setSelectedSubcategory('all');
    setPriceRangeFilter('all');
    setSelectedTag('all');
    setSunlightFilter('all');
    setWaterFilter('all');
    setSortBy('featured');
    setActiveDropdown(null);
  };

  const PRICE_OPTIONS = [
    { value: 'all', label: 'All Prices' },
    { value: '999', label: 'Under ₹999' },
    { value: '1999', label: 'Under ₹1,999' },
    { value: '4999', label: 'Under ₹4,999' },
    { value: '5000', label: '₹5,000 & Above' }
  ];

  const CHARACTERISTICS_OPTIONS = [
    { value: 'all', label: 'All Characteristics' },
    { value: 'Air Purifying', label: 'Air Purifying' },
    { value: 'Low Maintenance', label: 'Low Maintenance' },
    { value: 'Pet Friendly', label: 'Pet Friendly' },
    { value: 'Rare & Exotic', label: 'Rare & Exotic' },
    { value: 'Bestseller', label: 'Bestseller' }
  ];

  const SUNLIGHT_OPTIONS = [
    { value: 'all', label: 'All Light Levels' },
    { value: 'bright', label: 'Bright Indirect Light' },
    { value: 'low', label: 'Low Light Tolerant' },
    { value: 'direct', label: 'Direct Sunlight' }
  ];

  const WATER_OPTIONS = [
    { value: 'all', label: 'All Water Needs' },
    { value: 'low', label: 'Low Water (Bi-weekly)' },
    { value: 'moderate', label: 'Moderate Moisture' },
    { value: 'high', label: 'High Moisture Needs' }
  ];

  const SORT_OPTIONS = [
    { value: 'featured', label: 'Featured ▾' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  return (
    <div className="pb-24 space-y-6 sm:space-y-8 bg-[#FAF9F6] font-body">
      
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}

      {/* Breadcrumbs & Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="flex items-center gap-2 text-xs text-[#154734] uppercase font-bold tracking-widest mb-2">
          <Link to="/" className="hover:underline">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link to={`/category/${category.slug}`} className="hover:underline">{category.name}</Link>
          {activeSubcategoryObj && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 font-bold">{activeSubcategoryObj.name}</span>
            </>
          )}
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#154734]">
          {activeSubcategoryObj ? activeSubcategoryObj.name : category.name}
        </h1>
      </div>

      {/* Kyari-Style Circular Subcategory Selector Rail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-4 pt-2 scrollbar-none snap-x">
          
          {/* 'All Categories' Circle */}
          <button
            onClick={() => setSelectedSubcategory('all')}
            className="flex flex-col items-center min-w-[90px] sm:min-w-[120px] group cursor-pointer text-center snap-center"
          >
            <div
              className={`w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-md ${
                selectedSubcategory === 'all'
                  ? 'border-4 border-[#154734] ring-4 ring-[#154734]/20 scale-105 shadow-xl'
                  : 'border-4 border-white hover:scale-105'
              }`}
              style={{ backgroundColor: '#154734' }}
            >
              <img
                src={category.banner}
                alt={`All ${category.name}`}
                className="w-full h-full object-cover rounded-full opacity-80 group-hover:scale-110 transition duration-500"
              />
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider bg-black/30 backdrop-blur-[2px]">
                All
              </span>
            </div>
            <span className={`font-bold text-xs sm:text-sm mt-3 tracking-wide transition duration-200 ${
              selectedSubcategory === 'all' ? 'text-[#154734] underline font-extrabold' : 'text-slate-800 group-hover:text-[#154734]'
            }`}>
              All {category.name}
            </span>
          </button>

          {/* Individual Subcategory Circles */}
          {category.subcategories.map((sub, idx) => {
            const isSelected = selectedSubcategory === sub.slug;
            const circleBg = categoryColors[idx % categoryColors.length];

            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(sub.slug)}
                className="flex flex-col items-center min-w-[90px] sm:min-w-[120px] group cursor-pointer text-center snap-center"
              >
                <div
                  className={`w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-md ${
                    isSelected
                      ? 'border-4 border-[#154734] ring-4 ring-[#154734]/30 scale-105 shadow-xl'
                      : 'border-4 border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: circleBg }}
                >
                  <img
                    src={sub.image}
                    alt={sub.name}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition duration-500"
                  />
                </div>
                <span className={`font-bold text-xs sm:text-sm mt-3 tracking-wide transition duration-200 ${
                  isSelected ? 'text-[#154734] underline font-extrabold' : 'text-slate-800 group-hover:text-[#154734]'
                }`}>
                  {sub.name}
                </span>
              </button>
            );
          })}

        </div>
      </div>

      {/* Popover Filter Pill Controls & Sorting Bar (Matching Screenshot Popover UI) */}
      <div ref={filterContainerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-2">
          
          {/* Filter Pill Buttons with Floating Popover Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            
            {/* 1. Price Pill Dropdown Popover */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                  priceRangeFilter !== 'all' || activeDropdown === 'price'
                    ? 'bg-[#154734] text-white border-[#154734] ring-2 ring-[#154734]/20'
                    : 'bg-white text-slate-700 border-gray-300 hover:border-[#154734]'
                }`}
              >
                <span>{priceRangeFilter === 'all' ? 'Price' : PRICE_OPTIONS.find(o => o.value === priceRangeFilter)?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'price' && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-[#3A3F45] text-white rounded-2xl p-2 shadow-2xl border border-gray-600/50 z-50 animate-in fade-in duration-150">
                  {PRICE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setPriceRangeFilter(opt.value);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between hover:bg-white/10 transition"
                    >
                      <span className="flex items-center gap-2">
                        {priceRangeFilter === opt.value && <Check className="w-3.5 h-3.5 text-white" />}
                        <span className={priceRangeFilter === opt.value ? 'font-extrabold text-white' : 'text-gray-200'}>
                          {opt.label}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Plant Characteristics Pill Dropdown Popover */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'characteristics' ? null : 'characteristics')}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                  selectedTag !== 'all' || activeDropdown === 'characteristics'
                    ? 'bg-[#154734] text-white border-[#154734] ring-2 ring-[#154734]/20'
                    : 'bg-white text-slate-700 border-gray-300 hover:border-[#154734]'
                }`}
              >
                <span>{selectedTag === 'all' ? 'Plant Characteristics' : selectedTag}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'characteristics' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'characteristics' && (
                <div className="absolute top-full left-0 mt-2 w-60 bg-[#3A3F45] text-white rounded-2xl p-2 shadow-2xl border border-gray-600/50 z-50 animate-in fade-in duration-150">
                  {CHARACTERISTICS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSelectedTag(opt.value);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between hover:bg-white/10 transition"
                    >
                      <span className="flex items-center gap-2">
                        {selectedTag === opt.value && <Check className="w-3.5 h-3.5 text-white" />}
                        <span className={selectedTag === opt.value ? 'font-extrabold text-white' : 'text-gray-200'}>
                          {opt.label}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Sun Light Pill Dropdown Popover */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'sunlight' ? null : 'sunlight')}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                  sunlightFilter !== 'all' || activeDropdown === 'sunlight'
                    ? 'bg-[#154734] text-white border-[#154734] ring-2 ring-[#154734]/20'
                    : 'bg-white text-slate-700 border-gray-300 hover:border-[#154734]'
                }`}
              >
                <span>{sunlightFilter === 'all' ? 'Sun Light' : SUNLIGHT_OPTIONS.find(o => o.value === sunlightFilter)?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'sunlight' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'sunlight' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#3A3F45] text-white rounded-2xl p-2 shadow-2xl border border-gray-600/50 z-50 animate-in fade-in duration-150">
                  {SUNLIGHT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSunlightFilter(opt.value);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between hover:bg-white/10 transition"
                    >
                      <span className="flex items-center gap-2">
                        {sunlightFilter === opt.value && <Check className="w-3.5 h-3.5 text-white" />}
                        <span className={sunlightFilter === opt.value ? 'font-extrabold text-white' : 'text-gray-200'}>
                          {opt.label}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Water Level Pill Dropdown Popover */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'water' ? null : 'water')}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                  waterFilter !== 'all' || activeDropdown === 'water'
                    ? 'bg-[#154734] text-white border-[#154734] ring-2 ring-[#154734]/20'
                    : 'bg-white text-slate-700 border-gray-300 hover:border-[#154734]'
                }`}
              >
                <span>{waterFilter === 'all' ? 'Water Level' : WATER_OPTIONS.find(o => o.value === waterFilter)?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'water' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'water' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#3A3F45] text-white rounded-2xl p-2 shadow-2xl border border-gray-600/50 z-50 animate-in fade-in duration-150">
                  {WATER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setWaterFilter(opt.value);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between hover:bg-white/10 transition"
                    >
                      <span className="flex items-center gap-2">
                        {waterFilter === opt.value && <Check className="w-3.5 h-3.5 text-white" />}
                        <span className={waterFilter === opt.value ? 'font-extrabold text-white' : 'text-gray-200'}>
                          {opt.label}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(priceRangeFilter !== 'all' || selectedTag !== 'all' || sunlightFilter !== 'all' || waterFilter !== 'all' || selectedSubcategory !== 'all') && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-600 hover:text-white transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>

          {/* 5. Sort By Dropdown Popover */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
              className="bg-[#3A3F45] hover:bg-[#2C3035] text-white text-xs font-bold px-4 py-2 rounded-full border border-gray-600 focus:outline-none shadow-md transition flex items-center gap-2"
            >
              <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'sort' && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#3A3F45] text-white rounded-2xl p-2 shadow-2xl border border-gray-600/50 z-50 animate-in fade-in duration-150">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between hover:bg-white/10 transition"
                  >
                    <span className="flex items-center gap-2">
                      {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-white" />}
                      <span className={sortBy === opt.value ? 'font-extrabold text-white' : 'text-gray-200'}>
                        {opt.label.replace(' ▾', '')}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Dynamic Product Count Indicator */}
        <div className="flex justify-between items-center border-t border-gray-200 pt-4 text-xs font-semibold text-slate-500">
          <span>
            Showing <strong className="text-[#154734] font-extrabold text-sm">{filteredProducts.length}</strong> products
          </span>

          <div className="hidden sm:flex items-center gap-2 text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Grid Layout:</span>
            <button
              onClick={() => setLayoutColumns(3)}
              className={`p-1.5 rounded-lg border transition ${layoutColumns === 3 ? 'bg-[#154734] text-white border-[#154734]' : 'bg-white text-slate-700 border-gray-300'}`}
              aria-label="3 Columns"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutColumns(4)}
              className={`p-1.5 rounded-lg border transition ${layoutColumns === 4 ? 'bg-[#154734] text-white border-[#154734]' : 'bg-white text-slate-700 border-gray-300'}`}
              aria-label="4 Columns"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {filteredProducts.length > 0 ? (
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${layoutColumns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-4 max-w-lg mx-auto shadow-sm">
            <Filter className="w-12 h-12 text-[#154734] mx-auto opacity-50" />
            <h3 className="font-display font-extrabold text-xl text-slate-900">No matching items found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your filter options or selecting another subcategory.
            </p>
            <button
              onClick={resetAllFilters}
              className="bg-[#154734] text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-md hover:bg-[#0F3526] transition"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
