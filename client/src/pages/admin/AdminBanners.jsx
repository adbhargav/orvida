import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, AlertCircle, Upload, ImageIcon } from 'lucide-react';
import { api } from '../../services/api';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft';

const EMPTY = { title: '', subtitle: '', image: '', mobileImage: '', link: '/category/plants', buttonText: 'Discover collection', displayOrder: 1 };

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  };

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.banners.getAll();
      setBanners(res.banners || []);
    } catch (err) {
      setError(err.message || 'Could not load banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const handleUpload = (field) => async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    setFormError('');
    try {
      const res = await api.uploads.images([files[0]]);
      if (res.urls?.[0]) setForm((prev) => ({ ...prev, [field]: res.urls[0] }));
    } catch (err) {
      setFormError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      subtitle: item.subtitle || '',
      image: item.image || '',
      mobileImage: item.mobile_image || item.mobileImage || '',
      link: item.link || '',
      buttonText: item.button_text || item.buttonText || '',
      displayOrder: item.display_order || item.displayOrder || 1,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!form.title.trim()) return setFormError('Give the banner a title.');
    if (!form.image) return setFormError('Upload a banner image.');

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      image: form.image,
      mobileImage: form.mobileImage,
      link: form.link.trim(),
      buttonText: form.buttonText.trim(),
      displayOrder: Number(form.displayOrder) || 1,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.banners.update(editingId, payload);
      } else {
        await api.banners.create(payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setForm(EMPTY);
      notify('success', editingId ? 'Banner updated.' : 'Banner published to the homepage.');
      await loadBanners();
    } catch (err) {
      setFormError(err.message || `Could not ${editingId ? 'update' : 'create'} this banner.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete the banner “${item.title}”?`)) return;
    try {
      await api.banners.remove(item.id);
      setBanners((prev) => prev.filter((b) => b.id !== item.id));
      notify('success', 'Banner deleted.');
    } catch (err) {
      notify('error', err.message || 'Could not delete this banner.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Merchandising</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Homepage banners</h1>
          <p className="text-sm text-ink-soft">Shown in the hero carousel, ordered by display position</p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep transition"
        >
          <Plus className="w-4 h-4" /> New banner
        </button>
      </header>

      {banner && (
        <div role="status" className={`flex items-center gap-2.5 px-4 py-3 rounded-md border text-sm ${
          banner.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-light border-emerald-default/25 text-emerald-deep'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {banner.text}
        </div>
      )}

      {loading ? (
        <div className="surface-card rounded-lg p-16 flex flex-col items-center gap-3 text-ink-soft">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Loading banners…</p>
        </div>
      ) : error ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{error}</p>
          <button onClick={loadBanners} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      ) : banners.length === 0 ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-2">
          <ImageIcon className="w-7 h-7 text-ink-faint mx-auto" />
          <p className="type-heading text-lg text-ink">No banners yet</p>
          <p className="text-sm text-ink-soft">Add one to control the homepage hero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {banners.map((item) => (
            <div key={item.id} className="surface-card rounded-lg overflow-hidden">
              <div className="aspect-[21/9] bg-emerald-subtle overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex justify-between items-start gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="type-heading text-lg text-ink truncate">{item.title}</p>
                  {item.subtitle && <p className="text-sm text-ink-soft line-clamp-2">{item.subtitle}</p>}
                  <p className="text-xs text-ink-faint truncate">
                    Position {item.display_order} · links to {item.link || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2 rounded-md text-ink-faint hover:bg-emerald-default hover:text-white transition"
                    aria-label={`Edit ${item.title}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-md text-ink-faint hover:bg-rose-600 hover:text-white transition"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg max-w-lg w-full my-8 shadow-overlay border border-line">
            <div className="flex justify-between items-start p-6 border-b border-line">
              <div className="space-y-1">
                <span className="type-eyebrow text-emerald-default">Merchandising</span>
                <h2 className="type-heading text-xl text-ink">{editingId ? 'Edit banner' : 'New banner'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 -mt-2 text-ink-faint hover:text-ink transition" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className={labelClass}>Title</label>
                <input type="text" required value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Subtitle</label>
                <input type="text" value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Banner image (desktop)</label>
                <div className="border border-dashed border-line-strong rounded-md p-5 text-center hover:border-emerald-default transition">
                  <input type="file" accept="image/*" id="banner-image" onChange={handleUpload('image')} className="hidden" disabled={uploading} />
                  <label htmlFor="banner-image" className="cursor-pointer block space-y-1.5">
                    {uploading ? <Loader2 className="w-5 h-5 text-emerald-default mx-auto animate-spin" />
                               : <Upload className="w-5 h-5 text-emerald-default mx-auto" />}
                    <p className="text-sm font-medium text-ink">{uploading ? 'Uploading…' : 'Click to upload'}</p>
                    <p className="text-xs text-ink-faint">Wide format works best — roughly 21:9</p>
                  </label>
                </div>
                {form.image && (
                  <div className="aspect-[21/9] rounded-md overflow-hidden border border-line mt-2">
                    <img src={form.image} alt="Banner preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Mobile image (optional)</label>
                <div className="border border-dashed border-line-strong rounded-md p-5 text-center hover:border-emerald-default transition">
                  <input type="file" accept="image/*" id="banner-mobile-image" onChange={handleUpload('mobileImage')} className="hidden" disabled={uploading} />
                  <label htmlFor="banner-mobile-image" className="cursor-pointer block space-y-1.5">
                    {uploading ? <Loader2 className="w-5 h-5 text-emerald-default mx-auto animate-spin" />
                               : <Upload className="w-5 h-5 text-emerald-default mx-auto" />}
                    <p className="text-sm font-medium text-ink">
                      {uploading ? 'Uploading…' : form.mobileImage ? 'Replace mobile image' : 'Click to upload'}
                    </p>
                    <p className="text-xs text-ink-faint">
                      Tall format for phones — roughly 4:5. Without one, phones show the full wide image letterboxed.
                    </p>
                  </label>
                </div>
                {form.mobileImage && (
                  <div className="aspect-[4/5] w-32 rounded-md overflow-hidden border border-line mt-2">
                    <img src={form.mobileImage} alt="Mobile banner preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Links to</label>
                  <input type="text" value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Display order</label>
                  <input type="number" min="1" value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Button text</label>
                <input type="text" value={form.buttonText}
                  onChange={(e) => setForm({ ...form, buttonText: e.target.value })} className={inputClass} />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 mt-4 rounded-md border border-line text-sm font-medium text-ink hover:bg-emerald-subtle transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading}
                  className="px-6 py-2.5 mt-4 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep disabled:opacity-50 transition inline-flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save changes' : 'Publish banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
