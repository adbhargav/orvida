import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, Upload, CheckCircle, X, Sparkles } from 'lucide-react';
import { PRODUCTS, CATEGORIES } from '../../data/mockData';

export default function AdminProducts() {
  const [productList, setProductList] = useState(PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Multi-image state simulator
  const [uploadedImages, setUploadedImages] = useState([
    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80'
  ]);

  const [formState, setFormState] = useState({
    name: '',
    categoryName: 'Plants',
    price: '',
    discountPrice: '',
    stock: 15,
    description: '',
    isBestseller: false,
    isNew: false,
    tags: 'Indoor Plants, Air Purifying'
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this product from ORIVIDA catalog?')) {
      setProductList(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleImageSimulatedUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Create local preview URLs for the multiple uploaded images
      const newUrls = files.map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newUrls]);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      // Update
      setProductList(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p,
        name: formState.name,
        categoryName: formState.categoryName,
        price: Number(formState.price),
        discountPrice: Number(formState.discountPrice) || Number(formState.price),
        stock: Number(formState.stock),
        isBestseller: formState.isBestseller,
        isNew: formState.isNew,
        images: uploadedImages.map((url, i) => ({ id: i + 1, url }))
      } : p));
      setEditingProduct(null);
    } else {
      // Add
      const created = {
        id: Date.now(),
        name: formState.name,
        slug: formState.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        categoryName: formState.categoryName,
        categorySlug: formState.categoryName.toLowerCase(),
        subcategoryName: formState.isNew ? 'New Arrivals' : 'Standard Collection',
        subcategorySlug: formState.isNew ? 'new-arrivals' : 'standard-collection',
        price: Number(formState.price),
        discountPrice: Number(formState.discountPrice) || Number(formState.price),
        stock: Number(formState.stock),
        isBestseller: formState.isBestseller,
        isNew: formState.isNew,
        avgRating: 5.0,
        reviewCount: 1,
        tags: formState.tags.split(',').map(t => t.trim()),
        images: uploadedImages.map((url, i) => ({ id: i + 1, url }))
      };
      setProductList([created, ...productList]);
    }

    setIsAddModalOpen(false);
    setFormState({ name: '', categoryName: 'Plants', price: '', discountPrice: '', stock: 15, description: '', isBestseller: false, isNew: false, tags: '' });
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormState({
      name: product.name,
      categoryName: product.categoryName,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      description: product.description || '',
      isBestseller: product.isBestseller || false,
      isNew: product.isNew || false,
      tags: product.tags ? product.tags.join(', ') : ''
    });
    setUploadedImages(product.images ? product.images.map(img => img.url) : []);
    setIsAddModalOpen(true);
  };

  const filteredProducts = productList.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'all' || p.categorySlug === selectedCategoryFilter;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="space-y-8 p-6 sm:p-8 bg-[#FAF9F6] min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Inventory & Product Catalog</span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-1">Products Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-white hover:bg-gray-100 border border-gray-300 text-[#154734] px-5 py-3 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> EXPORT CATALOG (CSV)
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setFormState({ name: '', categoryName: 'Plants', price: '', discountPrice: '', stock: 15, description: '', isBestseller: false, isNew: false, tags: '' });
              setIsAddModalOpen(true);
            }}
            className="bg-[#154734] hover:bg-[#0F3526] text-white px-6 py-3 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg transition transform hover:scale-105"
          >
            <Plus className="w-4 h-4" /> ADD NEW PRODUCT
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name, tag, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-full border border-gray-200 text-xs text-slate-800 focus:outline-none focus:border-[#154734] bg-gray-50"
          />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="w-full sm:w-56 px-4 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#154734] bg-gray-50 cursor-pointer"
        >
          <option value="all">All Categories ({productList.length})</option>
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table with Dedicated Scroll Container & Sticky Header */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs relative">
            <thead className="bg-gray-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-4 px-4 bg-gray-50">Item Image</th>
                <th className="py-4 px-4 bg-gray-50">Product Name</th>
                <th className="py-4 px-4 bg-gray-50">Category</th>
                <th className="py-4 px-4 bg-gray-50">Retail Price</th>
                <th className="py-4 px-4 bg-gray-50">Offer Price</th>
                <th className="py-4 px-4 bg-gray-50">Stock Status</th>
                <th className="py-4 px-4 text-right bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-4">
                    <img src={prod.images[0]?.url} alt={prod.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm" />
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 max-w-xs">{prod.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-[#E8F2EC] text-[#154734] font-bold text-[10px]">
                      {prod.categoryName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 line-through">₹{prod.price.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 font-serif font-bold text-[#154734] text-sm">₹{prod.discountPrice.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      prod.stock > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-[#154734] hover:text-white transition text-slate-600"
                        title="Edit Item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-rose-600 hover:text-white transition text-slate-600"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal with Multiple Image Upload */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-200 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#154734]">ATELIER INVENTORY</span>
                <h3 className="font-display font-extrabold text-xl text-slate-900">
                  {editingProduct ? 'Edit Product Details' : 'Add New Product Specimen'}
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Variegated Monstera Deliciosa"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category Pillar *</label>
                  <select
                    value={formState.categoryName}
                    onChange={(e) => setFormState({ ...formState, categoryName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formState.stock}
                    onChange={(e) => setFormState({ ...formState, stock: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Original MRP Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="7999"
                    value={formState.price}
                    onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Discount Offer Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="4999"
                    value={formState.discountPrice}
                    onChange={(e) => setFormState({ ...formState, discountPrice: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                  />
                </div>
              </div>

              {/* Product Badges: Bestseller & New Arrivals Options */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <span className="font-bold text-slate-800 block">Product Promotion Badges</span>
                <div className="flex flex-wrap gap-6 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.isBestseller}
                      onChange={(e) => setFormState({ ...formState, isBestseller: e.target.checked })}
                      className="w-4 h-4 accent-[#154734] rounded"
                    />
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#F0D585]" /> Mark as Bestseller
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formState.isNew}
                      onChange={(e) => setFormState({ ...formState, isNew: e.target.checked })}
                      className="w-4 h-4 accent-[#154734] rounded"
                    />
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Mark as New Arrival
                    </span>
                  </label>
                </div>
              </div>

              {/* Multiple Image Upload Simulator Section */}
              <div className="space-y-2 pt-2">
                <label className="font-bold text-slate-700 flex justify-between items-center">
                  <span>Product Image Gallery (Upload Multiple Images)</span>
                  <span className="text-[10px] text-[#154734] font-semibold">{uploadedImages.length} images added</span>
                </label>

                {/* Upload Box */}
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center hover:border-[#154734] bg-gray-50/50 transition">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSimulatedUpload}
                    className="hidden"
                    id="multi-image-upload-input"
                  />
                  <label htmlFor="multi-image-upload-input" className="cursor-pointer space-y-1 block">
                    <Upload className="w-8 h-8 text-[#154734] mx-auto" />
                    <p className="font-bold text-slate-800">Click or Drag & Drop multiple images here</p>
                    <p className="text-[10px] text-slate-400">Supports PNG, JPG, WebP high resolution specimen photos</p>
                  </label>
                </div>

                {/* Uploaded Thumbnails Preview Rail */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {uploadedImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 group">
                      <img src={imgUrl} alt={`Uploaded ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 rounded-full border border-gray-300 text-slate-700 font-bold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-full bg-[#154734] text-white font-bold hover:bg-[#0F3526] transition shadow-md"
                >
                  {editingProduct ? 'Save Product Changes' : 'Publish Product to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
