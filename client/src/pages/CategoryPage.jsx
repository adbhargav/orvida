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

  return (
    <div className="pb-24 space-y-8">
      
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}

      {/* Category Hero Banner */}
      <div className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden bg-[#062319]">
        <img
          src={category.banner}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B3D2E] via-[#0A3324]/70 to-black/50" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center space-y-3">
          <div className="flex justify-center items-center gap-2 text-xs text-[#F0D585] uppercase font-bold tracking-widest">
            <Link to="/" className="hover:underline">Home</Link>
            <ChevronRight className="w-3 h-3 text-[#8A6A16]" />
            <span>{category.name}</span>
            {activeSubcategoryObj && (
              <>
                <ChevronRight className="w-3 h-3 text-[#8A6A16]" />
                <span className="text-white">{activeSubcategoryObj.name}</span>
              </>
            )}
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white">
            {activeSubcategoryObj ? activeSubcategoryObj.name : category.name}
          </h1>

          <p className="text-xs sm:text-sm text-[#F7F5EF]/80 max-w-xl mx-auto font-serif italic">
            "{category.tagline}"
          </p>
        </div>
      </div>

      {/* Subcategory Chips Bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSubcategory('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${
              selectedSubcategory === 'all'
                ? 'bg-gold-gradient text-[#0A3324] border-transparent shadow-lg'
                : 'bg-[#0A3324] text-[#F7F5EF] border-[#8A6A16]/40 hover:border-[#F0D585]'
            }`}
          >
            All {category.name} ({PRODUCTS.filter(p => p.categorySlug === category.slug).length})
          </button>

          {category.subcategories.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubcategory(sub.slug)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                selectedSubcategory === sub.slug
                  ? 'bg-gold-gradient text-[#0A3324] border-transparent shadow-lg'
                  : 'bg-[#0A3324] text-[#F7F5EF] border-[#8A6A16]/40 hover:border-[#F0D585]'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Filter + Product Listing Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block space-y-6 glass-dark p-6 rounded-3xl border border-[#8A6A16]/30 h-fit">
          <div className="flex justify-between items-center border-b border-[#8A6A16]/30 pb-3">
            <h3 className="font-display font-bold text-sm uppercase text-[#F0D585] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filter Options
            </h3>
            <button
              onClick={() => {
                setPriceMax(10000);
                setSelectedTag('all');
                setSelectedSubcategory('all');
              }}
              className="text-[10px] text-[#F7F5EF]/60 hover:text-white underline"
            >
              Reset Filters
            </button>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#F7F5EF]">Max Price:</span>
              <span className="text-[#F0D585]">₹{priceMax.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[#C9972B] bg-[#0B3D2E]"
            />
          </div>

          {/* Botanical Tags Filter */}
          <div className="space-y-3 pt-4 border-t border-[#8A6A16]/30">
            <span className="text-xs uppercase font-bold text-[#F0D585]">Botanical Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium border transition ${
                    selectedTag === tag
                      ? 'bg-[#C9972B] text-black border-white font-bold'
                      : 'bg-[#0B3D2E] text-[#F7F5EF]/80 border-[#8A6A16]/30 hover:border-[#F0D585]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Guarantee Box */}
          <div className="pt-4 border-t border-[#8A6A16]/30 p-4 rounded-2xl bg-[#0B3D2E]/80 text-xs text-[#F7F5EF]/80 space-y-1">
            <span className="text-[#F0D585] font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 7-Day Live Guarantee
            </span>
            <p className="text-[10px] leading-relaxed">
              Every botanical item is packed with root hydration gels for safe 5-day transit across India.
            </p>
          </div>
        </div>

        {/* Right Main Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar (Mobile Filter Toggle + Sort + Column Views) */}
          <div className="flex flex-wrap justify-between items-center bg-[#0A3324] p-4 rounded-2xl border border-[#8A6A16]/30 gap-4">
            
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B3D2E] border border-[#8A6A16] text-xs text-[#F0D585] font-bold"
            >
              <Filter className="w-4 h-4" /> Filters
            </button>

            <div className="text-xs text-[#F7F5EF]/80 font-medium">
              Showing <strong className="text-[#F0D585]">{filteredProducts.length}</strong> luxury items
            </div>

            <div className="flex items-center gap-4">
              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#0B3D2E] text-[#F7F5EF] text-xs font-semibold px-3 py-2 rounded-xl border border-[#8A6A16]/40 focus:outline-none focus:border-[#F0D585]"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>

              {/* Layout Switcher (Desktop) */}
              <div className="hidden sm:flex items-center gap-1 bg-[#0B3D2E] p-1 rounded-xl border border-[#8A6A16]/40 text-[#F0D585]">
                <button
                  onClick={() => setLayoutColumns(3)}
                  className={`p-1.5 rounded-lg transition ${layoutColumns === 3 ? 'bg-[#8A6A16] text-white' : 'hover:bg-white/10'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutColumns(4)}
                  className={`p-1.5 rounded-lg transition ${layoutColumns === 4 ? 'bg-[#8A6A16] text-white' : 'hover:bg-white/10'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-[#0A3324] rounded-3xl border border-[#8A6A16]/30 p-8 space-y-4">
              <Sparkles className="w-12 h-12 text-[#F0D585] mx-auto opacity-40" />
              <h3 className="font-display font-bold text-xl text-white">No products found matching filters</h3>
              <p className="text-xs text-[#F7F5EF]/70 max-w-sm mx-auto">
                Try expanding your price range slider or clearing botanical tags.
              </p>
              <button
                onClick={() => {
                  setPriceMax(10000);
                  setSelectedTag('all');
                  setSelectedSubcategory('all');
                }}
                className="bg-gold-gradient text-[#0A3324] px-6 py-2.5 rounded-full font-bold text-xs shadow-md"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-2 ${layoutColumns === 4 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-6`}>
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
    </div>
  );
}
