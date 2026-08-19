import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, AlertCircle, Layers, Upload } from 'lucide-react';
import { api } from '../../services/api';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft';

const EMPTY = { name: '', slug: '', tagline: '', description: '', banner: '' };

const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
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

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.categories.getAll();
      setCategories(res.categories || []);
    } catch (err) {
      setError(err.message || 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    setFormError('');
    try {
      const res = await api.uploads.images([files[0]]);
      if (res.urls?.[0]) setForm((prev) => ({ ...prev, banner: res.urls[0] }));
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

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      tagline: cat.tagline || '',
      description: cat.description || '',
      banner: cat.banner || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Give the category a name.');

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      banner: form.banner,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.categories.update(editingId, payload);
      } else {
        await api.categories.create(payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setForm(EMPTY);
      notify('success', editingId ? 'Category updated.' : 'Category created.');
      await loadCategories();
    } catch (err) {
      setFormError(err.message || `Could not ${editingId ? 'update' : 'create'} this category.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete the “${category.name}” category?`)) return;
    try {
      await api.categories.remove(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      notify('success', `${category.name} deleted.`);
    } catch (err) {
      // The server refuses to orphan products, and says how many are in the way.
      notify('error', err.message || 'Could not delete this category.');
    }
  };

  /* ---------------- Subcategories ---------------- */

  // { categoryId, categoryName, sub } — sub is null when creating.
  const [subModal, setSubModal] = useState(null);
  const [subForm, setSubForm] = useState({ name: '', slug: '', image: '' });
  const [subSaving, setSubSaving] = useState(false);
  const [subUploading, setSubUploading] = useState(false);
  const [subError, setSubError] = useState('');

  const openSubModal = (category, sub = null) => {
    setSubModal({ categoryId: category.id, categoryName: category.name, sub });
    setSubForm({ name: sub?.name || '', slug: sub?.slug || '', image: sub?.image || '' });
    setSubError('');
  };

  const handleSubUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setSubUploading(true);
    setSubError('');
    try {
      const res = await api.uploads.images([files[0]]);
      if (res.urls?.[0]) setSubForm((prev) => ({ ...prev, image: res.urls[0] }));
    } catch (err) {
      setSubError(err.message || 'Image upload failed.');
    } finally {
      setSubUploading(false);
    }
  };

  const handleSubSave = async (event) => {
    event.preventDefault();
    setSubError('');
    if (!subForm.name.trim()) return setSubError('Give the subcategory a name.');

    const payload = {
      name: subForm.name.trim(),
      slug: slugify(subForm.slug || subForm.name),
      image: subForm.image,
    };

    setSubSaving(true);
    try {
      if (subModal.sub) {
        await api.categories.updateSubcategory(subModal.sub.id, payload);
      } else {
        await api.categories.createSubcategory(subModal.categoryId, payload);
      }
      setSubModal(null);
      notify('success', subModal.sub ? 'Subcategory updated.' : 'Subcategory created.');
      await loadCategories();
    } catch (err) {
      setSubError(err.message || 'Could not save this subcategory.');
    } finally {
      setSubSaving(false);
    }
  };

  const handleSubDelete = async (sub) => {
    if (!window.confirm(`Delete the “${sub.name}” subcategory?`)) return;
    try {
      await api.categories.removeSubcategory(sub.id);
      notify('success', `${sub.name} deleted.`);
      await loadCategories();
    } catch (err) {
      notify('error', err.message || 'Could not delete this subcategory.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Catalogue structure</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Categories</h1>
          <p className="text-sm text-ink-soft">
            {loading ? 'Loading…' : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} powering store navigation`}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep transition"
        >
          <Plus className="w-4 h-4" /> New category
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
          <p className="text-sm">Loading categories…</p>
        </div>
      ) : error ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{error}</p>
          <button onClick={loadCategories} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      ) : categories.length === 0 ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-2">
          <Layers className="w-7 h-7 text-ink-faint mx-auto" />
          <p className="type-heading text-lg text-ink">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {categories.map((cat) => (
            <div key={cat.id} className="surface-card rounded-lg overflow-hidden">
              {cat.banner && (
                <div className="aspect-[3/1] bg-emerald-subtle overflow-hidden">
                  <img src={cat.banner} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1 min-w-0">
                    <h2 className="type-heading text-xl text-ink">{cat.name}</h2>
                    {cat.tagline && <p className="text-sm text-ink-soft italic">{cat.tagline}</p>}
                    <p className="text-xs text-ink-faint">/{cat.slug}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-2 rounded-md text-ink-faint hover:bg-emerald-default hover:text-white transition"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-2 rounded-md text-ink-faint hover:bg-rose-600 hover:text-white transition"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-line space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="type-eyebrow text-ink-soft">
                      {cat.subcategories.length} subcategor{cat.subcategories.length === 1 ? 'y' : 'ies'}
                    </p>
                    <button
                      onClick={() => openSubModal(cat)}
                      className="inline-flex items-center gap-1 text-xs text-emerald-default link-underline"
                    >
                      <Plus className="w-3 h-3" /> Add subcategory
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="group/sub inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-emerald-subtle text-ink-soft text-xs"
                      >
                        {sub.name}
                        <button
                          onClick={() => openSubModal(cat, sub)}
                          className="p-0.5 rounded-full text-ink-faint hover:text-emerald-deep transition"
                          aria-label={`Edit ${sub.name}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleSubDelete(sub)}
                          className="p-0.5 rounded-full text-ink-faint hover:text-rose-600 transition"
                          aria-label={`Delete ${sub.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
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
                <span className="type-eyebrow text-emerald-default">Catalogue</span>
                <h2 className="type-heading text-xl text-ink">{editingId ? 'Edit category' : 'New category'}</h2>
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
                <label className={labelClass}>Name</label>
                <input type="text" required placeholder="Balcony Makeover" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>URL slug</label>
                <input type="text" placeholder={slugify(form.name) || 'balcony-makeover'} value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} />
                <p className="text-xs text-ink-faint">Leave blank to generate from the name.</p>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Tagline</label>
                <input type="text" placeholder="Transform outdoor nooks into private sanctuaries" value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Description</label>
                <textarea rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-y`} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Category banner</label>
                <div className="border border-dashed border-line-strong rounded-md p-5 text-center hover:border-emerald-default transition">
                  <input type="file" accept="image/*" id="category-banner" onChange={handleUpload} className="hidden" disabled={uploading} />
                  <label htmlFor="category-banner" className="cursor-pointer block space-y-1.5">
                    {uploading ? <Loader2 className="w-5 h-5 text-emerald-default mx-auto animate-spin" />
                               : <Upload className="w-5 h-5 text-emerald-default mx-auto" />}
                    <p className="text-sm font-medium text-ink">{uploading ? 'Uploading…' : 'Click to upload'}</p>
                  </label>
                </div>
                {form.banner && (
                  <div className="aspect-[3/1] rounded-md overflow-hidden border border-line mt-2">
                    <img src={form.banner} alt="Category banner preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 mt-4 rounded-md border border-line text-sm font-medium text-ink hover:bg-emerald-subtle transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading}
                  className="px-6 py-2.5 mt-4 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep disabled:opacity-50 transition inline-flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save changes' : 'Create category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {subModal && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg max-w-md w-full my-8 shadow-overlay border border-line">
            <div className="flex justify-between items-start p-6 border-b border-line">
              <div className="space-y-1">
                <span className="type-eyebrow text-emerald-default">{subModal.categoryName}</span>
                <h2 className="type-heading text-xl text-ink">
                  {subModal.sub ? 'Edit subcategory' : 'New subcategory'}
                </h2>
              </div>
              <button onClick={() => setSubModal(null)} className="p-2 -mr-2 -mt-2 text-ink-faint hover:text-ink transition" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubSave} className="p-6 space-y-4">
              {subError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {subError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className={labelClass}>Name</label>
                <input type="text" required placeholder="Vertical Gardens" value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>URL slug</label>
                <input type="text" placeholder={slugify(subForm.name) || 'vertical-gardens'} value={subForm.slug}
                  onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })} className={inputClass} />
                <p className="text-xs text-ink-faint">Leave blank to generate from the name.</p>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Image</label>
                <div className="border border-dashed border-line-strong rounded-md p-5 text-center hover:border-emerald-default transition">
                  <input type="file" accept="image/*" id="subcategory-image" onChange={handleSubUpload} className="hidden" disabled={subUploading} />
                  <label htmlFor="subcategory-image" className="cursor-pointer block space-y-1.5">
                    {subUploading ? <Loader2 className="w-5 h-5 text-emerald-default mx-auto animate-spin" />
                                  : <Upload className="w-5 h-5 text-emerald-default mx-auto" />}
                    <p className="text-sm font-medium text-ink">{subUploading ? 'Uploading…' : subForm.image ? 'Replace image' : 'Click to upload'}</p>
                    <p className="text-xs text-ink-faint">Shown in the homepage collection rail</p>
                  </label>
                </div>
                {subForm.image && (
                  <div className="aspect-square w-28 rounded-full overflow-hidden border border-line mt-2 mx-auto">
                    <img src={subForm.image} alt="Subcategory preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button type="button" onClick={() => setSubModal(null)}
                  className="px-5 py-2.5 mt-4 rounded-md border border-line text-sm font-medium text-ink hover:bg-emerald-subtle transition">
                  Cancel
                </button>
                <button type="submit" disabled={subSaving || subUploading}
                  className="px-6 py-2.5 mt-4 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep disabled:opacity-50 transition inline-flex items-center gap-2">
                  {subSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {subModal.sub ? 'Save changes' : 'Create subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
