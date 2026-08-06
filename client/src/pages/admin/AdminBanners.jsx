import React, { useState } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Sparkles, Eye, CheckCircle2, Download } from 'lucide-react';
import banner1 from '../../assets/hero-banner-1.png';
import banner2 from '../../assets/hero-banner-2.png';

export default function AdminBanners() {
  const [banners, setBanners] = useState([
    { id: 1, title: 'Add life to every room - Any 4 plants at ₹999/-', image: banner1, ratio: '1024 x 323 (3.17:1)', active: true, targetLink: '/category/plants' },
    { id: 2, title: 'Your space deserves more green - Up to 50% off extra 10%', image: banner2, ratio: '1024 x 323 (3.17:1)', active: true, targetLink: '/category/plants' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=1600&q=80');

  const handleExportBannersCSV = () => {
    const headers = ['Slide ID', 'Title', 'Aspect Ratio', 'Target Link', 'Status'];
    const rows = banners.map(b => [b.id, `"${b.title}"`, `"${b.ratio}"`, `"${b.targetLink}"`, b.active ? 'Active' : 'Inactive']);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ORIVIDA_Hero_Banners_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteBanner = (id) => {
    if (window.confirm('Delete this hero banner slide?')) {
      setBanners(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleAddBanner = (e) => {
    e.preventDefault();
    const created = {
      id: Date.now(),
      title: newTitle || 'Luxury Botanical Banner',
      image: newImage,
      ratio: 'Custom Aspect Ratio',
      active: true,
      targetLink: '/category/plants'
    };
    setBanners([...banners, created]);
    setIsModalOpen(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-8 p-6 sm:p-8 bg-[#FAF9F6] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Storefront Hero Visuals</span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-1">Hero Banners Manager</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportBannersCSV}
            className="bg-white hover:bg-gray-100 border border-gray-300 text-[#154734] px-5 py-3 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> EXPORT SLIDES (CSV)
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#154734] hover:bg-[#0F3526] text-white px-6 py-3 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" /> UPLOAD NEW BANNER
          </button>
        </div>
      </div>

      {/* Banner Cards Scroll List */}
      <div className="space-y-6 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
        {banners.map((b, idx) => (
          <div key={b.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#154734] text-white font-bold text-xs flex items-center justify-center">
                  #{idx + 1}
                </span>
                <h3 className="font-bold text-sm text-slate-900">{b.title}</h3>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live on Homepage
              </span>
            </div>

            {/* Banner Graphic Preview */}
            <div className="relative w-full aspect-[1024/323] rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner">
              <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-500 font-mono">Aspect Ratio: {b.ratio}</span>
              <button
                onClick={() => handleDeleteBanner(b.id)}
                className="px-4 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white font-bold transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Slide
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <h3 className="font-display font-extrabold text-xl text-slate-900">Upload Hero Slide Graphic</h3>

            <form onSubmit={handleAddBanner} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Banner Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monsoon Botanical Sale"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#154734]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Image Graphic URL *</label>
                <input
                  type="url"
                  required
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
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
                  Publish Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
