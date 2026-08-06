import React, { useState } from 'react';
import { Plus, Edit, Trash2, Layers, ChevronRight, Image as ImageIcon, Sparkles, Download } from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';

export default function AdminCategories() {
  const [categories, setCategories] = useState(CATEGORIES);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    tagline: '',
    description: '',
    banner: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=1600&q=80'
  });

  const handleExportCategoriesCSV = () => {
    const headers = ['ID', 'Category Name', 'Slug', 'Tagline', 'Subcategories Count'];
    const rows = categories.map(c => [c.id, `"${c.name}"`, `"${c.slug}"`, `"${c.tagline}"`, c.subcategories ? c.subcategories.length : 0]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ORIVIDA_Categories_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('Delete this category pillar from ORIVIDA?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...categoryForm } : c));
    } else {
      const newCat = {
        id: Date.now(),
        name: categoryForm.name,
        slug: categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tagline: categoryForm.tagline,
        description: categoryForm.description,
        banner: categoryForm.banner,
        subcategories: []
      };
      setCategories([...categories, newCat]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 p-6 sm:p-8 bg-[#FAF9F6] min-h-screen">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Store Architecture</span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-1">Categories Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCategoriesCSV}
            className="bg-white hover:bg-gray-100 border border-gray-300 text-[#154734] px-5 py-3 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> EXPORT CATEGORIES (CSV)
          </button>

          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', tagline: '', description: '', banner: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=1600&q=80' });
              setIsModalOpen(true);
            }}
            className="bg-[#154734] hover:bg-[#0F3526] text-white px-6 py-3 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" /> ADD NEW CATEGORY
          </button>
        </div>
      </div>

      {/* Category Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              {/* Category Header Banner */}
              <div className="relative h-44 overflow-hidden bg-gray-100">
                <img src={cat.banner} alt={cat.name} className="w-full h-full object-cover filter brightness-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-6 text-white space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#F0D585]">
                    {cat.subcategories.length} Subcategories
                  </span>
                  <h3 className="font-display font-extrabold text-2xl text-white">{cat.name}</h3>
                </div>
              </div>

              {/* Subcategories Chip List */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-serif italic">"{cat.tagline}"</p>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#154734]">Active Subcategories:</span>
                  <div className="flex flex-wrap gap-2">
                    {cat.subcategories.map(sub => (
                      <span key={sub.id} className="px-3 py-1 rounded-full bg-[#E8F2EC] text-[#154734] font-bold text-xs border border-gray-200">
                        {sub.name} ({sub.count})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Actions Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[10px]">Slug: /category/{cat.slug}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryForm({ name: cat.name, tagline: cat.tagline, description: cat.description, banner: cat.banner });
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-full bg-white border border-gray-200 hover:border-[#154734] text-slate-700 font-bold transition"
                >
                  Edit Category
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white font-bold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <h3 className="font-display font-extrabold text-xl text-slate-900">
              {editingCategory ? 'Edit Category Pillar' : 'Add New Category Pillar'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indoor Botanicals"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tagline *</label>
                <input
                  type="text"
                  required
                  placeholder="Living Luxury for Elevated Spaces"
                  value={categoryForm.tagline}
                  onChange={(e) => setCategoryForm({ ...categoryForm, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Banner Image URL *</label>
                <input
                  type="url"
                  required
                  value={categoryForm.banner}
                  onChange={(e) => setCategoryForm({ ...categoryForm, banner: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 rounded-full border border-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#154734] text-white font-bold hover:bg-[#0F3526]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
