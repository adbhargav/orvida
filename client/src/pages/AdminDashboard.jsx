import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PRODUCTS, CATEGORIES } from '../data/mockData';
import { Plus, Edit, Trash2, ShieldCheck, DollarSign, Package, Users, TrendingUp, Search } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [productList, setProductList] = useState(PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');

  // New Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    categoryName: 'Plants',
    price: '',
    discountPrice: '',
    stock: 10,
    tags: 'Indoor Plants, Air Purifying'
  });

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this product from ORIVIDA catalog?')) {
      setProductList(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const created = {
      id: Date.now(),
      name: newProd.name,
      slug: newProd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryName: newProd.categoryName,
      categorySlug: newProd.categoryName.toLowerCase(),
      subcategoryName: 'New Collection',
      subcategorySlug: 'new-collection',
      price: Number(newProd.price),
      discountPrice: Number(newProd.discountPrice) || Number(newProd.price),
      stock: Number(newProd.stock),
      avgRating: 5.0,
      reviewCount: 1,
      tags: newProd.tags.split(',').map(t => t.trim()),
      images: [{ id: 1, url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80' }]
    };
    setProductList([created, ...productList]);
    setIsAddModalOpen(false);
    setNewProd({ name: '', categoryName: 'Plants', price: '', discountPrice: '', stock: 10, tags: '' });
  };

  const filteredProducts = productList.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#8A6A16]/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#8A6A16] text-white text-[10px] font-bold px-2 py-0.5 rounded">ADMIN PORTAL</span>
            <span className="text-xs text-[#F0D585]">Logged in as: {user?.name || 'Administrator'}</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-white mt-1">ORIVIDA Atelier Management</h1>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gold-gradient hover:bg-gold-gradient-hover text-[#0A3324] px-6 py-3 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" /> ADD NEW PRODUCT
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-[#0A3324] border border-[#8A6A16]/30 space-y-1">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Total Monthly Revenue</span>
            <DollarSign className="w-4 h-4 text-[#F0D585]" />
          </div>
          <p className="font-serif font-extrabold text-2xl text-gold-gradient">₹14,82,900</p>
          <p className="text-[10px] text-emerald-400">+18.4% from last month</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0A3324] border border-[#8A6A16]/30 space-y-1">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Active Products</span>
            <Package className="w-4 h-4 text-[#F0D585]" />
          </div>
          <p className="font-serif font-extrabold text-2xl text-white">{productList.length}</p>
          <p className="text-[10px] text-gray-400">Across 4 core categories</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0A3324] border border-[#8A6A16]/30 space-y-1">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Pending Orders</span>
            <TrendingUp className="w-4 h-4 text-[#F0D585]" />
          </div>
          <p className="font-serif font-extrabold text-2xl text-white">28</p>
          <p className="text-[10px] text-amber-400">12 ready for nursery dispatch</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0A3324] border border-[#8A6A16]/30 space-y-1">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>VIP Concierge Clients</span>
            <Users className="w-4 h-4 text-[#F0D585]" />
          </div>
          <p className="font-serif font-extrabold text-2xl text-white">142</p>
          <p className="text-[10px] text-gray-400">Corporate & Private accounts</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex justify-between items-center bg-[#0A3324] p-4 rounded-2xl border border-[#8A6A16]/30 gap-4">
        <div className="flex items-center gap-2 bg-[#0B3D2E] border border-[#8A6A16]/40 rounded-full px-4 py-2 text-xs flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#F0D585]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter catalog products..."
            className="bg-transparent text-white placeholder-gray-400 focus:outline-none w-full"
          />
        </div>
        <span className="text-xs text-gray-400 font-semibold">{filteredProducts.length} Items Listed</span>
      </div>

      {/* Product Management Table */}
      <div className="overflow-x-auto rounded-3xl border border-[#8A6A16]/30 bg-[#0A3324]">
        <table className="w-full text-left text-xs text-white">
          <thead className="bg-[#0B3D2E] text-[#F0D585] uppercase tracking-wider font-bold text-[10px]">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Rating</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8A6A16]/20">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-[#0B3D2E]/50 transition">
                <td className="p-4 flex items-center gap-3">
                  <img src={p.images?.[0]?.url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-bold text-white line-clamp-1">{p.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">SKU: {p.sku || `ORI-${p.id}`}</p>
                  </div>
                </td>
                <td className="p-4 text-gray-300">{p.categoryName}</td>
                <td className="p-4 font-serif font-bold text-[#F0D585]">
                  ₹{(p.discountPrice || p.price).toLocaleString('en-IN')}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.stock < 10 ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'}`}>
                    {p.stock} in stock
                  </span>
                </td>
                <td className="p-4 text-gray-300 font-bold">★ {p.avgRating} ({p.reviewCount})</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => alert(`Editing product ${p.name}`)} className="p-2 text-gray-400 hover:text-white transition">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 glass-dark bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0B3D2E] text-white p-8 rounded-3xl border-2 border-[#C9972B] max-w-lg w-full space-y-4">
            <h3 className="font-display font-bold text-xl text-[#F0D585]">Create New Product Entry</h3>
            
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="e.g. Variegated Ficus Elastica Supreme"
                  className="w-full bg-[#0A3324] border border-[#8A6A16]/40 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Category</label>
                  <select
                    value={newProd.categoryName}
                    onChange={(e) => setNewProd({ ...newProd, categoryName: e.target.value })}
                    className="w-full bg-[#0A3324] border border-[#8A6A16]/40 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Plants">Plants</option>
                    <option value="Gifting Solutions">Gifting Solutions</option>
                    <option value="Balcony Makeover">Balcony Makeover</option>
                    <option value="Arts & Decor">Arts & Decor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                    className="w-full bg-[#0A3324] border border-[#8A6A16]/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2 rounded-full border border-gray-500 text-xs font-bold text-gray-300"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-gold-gradient text-[#0A3324] px-6 py-2 rounded-full text-xs font-bold"
                >
                  SAVE & PUBLISH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
