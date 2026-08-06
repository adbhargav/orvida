import React, { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid3X3, LayoutGrid, List, ChevronRight, X, Sparkles } from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/mockData';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';

export default function CategoryPage() {
  const { slug, subSlug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQueryParam = searchParams.get('search');

  const [selectedSubcategory, setSelectedSubcategory] = useState(subSlug || 'all');
  const [priceMax, setPriceMax] = useState(10000);
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [layoutColumns, setLayoutColumns] = useState(4);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Match current Category
  const category = CATEGORIES.find(c => c.slug === slug) || CATEGORIES[0];
  const activeSubcategoryObj = category.subcategories.find(s => s.slug === selectedSubcategory);

  // Filter products
  const filteredProducts = useMemo(() => {
    let list = PRODUCTS.filter(p => p.categorySlug === category.slug);

    if (searchQueryParam) {
      list = list.filter(p => p.name.toLowerCase().includes(searchQueryParam.toLowerCase()));
    }

    if (selectedSubcategory !== 'all') {
      list = list.filter(p => p.subcategorySlug === selectedSubcategory);
    }

    list = list.filter(p => (p.discountPrice || p.price) <= priceMax);

    if (selectedTag !== 'all') {
      list = list.filter(p => p.tags.includes(selectedTag));
    }

    // Sort
    if (sortBy === 'price-low') {
      list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.avgRating - a.avgRating);
    }

    return list;
  }, [category, selectedSubcategory, priceMax, selectedTag, sortBy, searchQueryParam]);

  const allTags = ['Low Maintenance', 'Air Purifying', 'Pet Friendly', 'Rare & Exotic', 'Bestseller', 'Handcrafted', 'Luxury Hamper'];

  const categoryColors = ['#3B5998', '#C05656', '#8B5A3C', '#6B7028', '#E6A119', '#6B8E85', '#8E6B89'];

  return (
    <div className="pb-24 space-y-6 sm:space-y-8 bg-[#FAF9F6]">
      
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

      {/* Kyari-Style Circular Subcategory Selection Bar (Dynamic Product Shift on Click) */}
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

          {/* Individual Subcategories Circles */}
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

      {/* Filter Pill Controls & Sorting Bar (Screenshot UI) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-2">
          
          {/* Quick Filter Pill Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="px-4 py-2 rounded-full border border-gray-300 bg-white text-slate-700 font-semibold hover:border-[#154734] hover:text-[#154734] transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Price</span>
              <span className="text-slate-400">▾</span>
            </button>

            <button
              onClick={() => setSelectedTag(selectedTag === 'Air Purifying' ? 'all' : 'Air Purifying')}
              className={`px-4 py-2 rounded-full border text-xs font-semibold transition flex items-center gap-1.5 shadow-sm ${
                selectedTag === 'Air Purifying'
                  ? 'bg-[#154734] text-white border-[#154734]'
                  : 'bg-white text-slate-700 border-gray-300 hover:border-[#154734]'
              }`}
            >
              <span>Plant Characteristics</span>
              <span className="text-slate-400">▾</span>
            </button>

            <button
              onClick={() => setSelectedTag(selectedTag === 'Low Maintenance' ? 'all' : 'Low Maintenance')}
              className={`px-4 py-2 rounded-full border text-xs font-semibold transition flex items-center gap-1.5 shadow-sm ${
                selectedTag === 'Low Maintenance'
                  ? 'bg-[#154734] text-white border-[#154734]'
                  : 'bg-white text-slate-700 border-gray-300 hover:border-[#154734]'
              }`}
            >
              <span>Sun Light</span>
              <span className="text-slate-400">▾</span>
            </button>

            <button
              onClick={() => setSelectedTag(selectedTag === 'Pet Friendly' ? 'all' : 'Pet Friendly')}
              className={`px-4 py-2 rounded-full border text-xs font-semibold transition flex items-center gap-1.5 shadow-sm ${
                selectedTag === 'Pet Friendly'
                  ? 'bg-[#154734] text-white border-[#154734]'
                  : 'bg-white text-slate-700 border-gray-300 hover:border-[#154734]'
              }`}
            >
              <span>Water Level</span>
              <span className="text-slate-400">▾</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white text-slate-800 text-xs font-semibold px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-[#154734] shadow-sm cursor-pointer"
            >
              <option value="featured">Featured ▾</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

        </div>

        {/* Showing Count Label */}
        <div className="text-xs text-slate-600 font-medium pt-1">
          Showing <strong className="text-[#154734] font-bold">{filteredProducts.length}</strong> products
        </div>
      </div>

      {/* Main Product Grid Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 space-y-4 shadow-sm">
            <Sparkles className="w-12 h-12 text-[#154734] mx-auto opacity-40" />
            <h3 className="font-display font-bold text-xl text-slate-900">No products found matching filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try selecting another subcategory above or clearing your filters.
            </p>
            <button
              onClick={() => {
                setPriceMax(10000);
                setSelectedTag('all');
                setSelectedSubcategory('all');
              }}
              className="bg-[#154734] text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-md hover:bg-[#0F3526]"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
