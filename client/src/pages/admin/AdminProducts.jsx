import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Upload, X, Download, Loader2, AlertCircle, ImageOff } from 'lucide-react';
import { api } from '../../services/api';

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  subcategoryId: '',
  price: '',
  discountPrice: '',
  sku: '',
  stock: 10,
  shortDescription: '',
  description: '',
  careInstructions: '',
  isBestseller: false,
  isNew: false,
  isFeatured: false,
  tags: '',
  // Final packed parcel, not the raw plant — used for courier rating.
  shippingWeightKg: '',
  packageLengthCm: '',
  packageWidthCm: '',
  packageHeightCm: '',
};

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [galleryUrls, setGalleryUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [banner, setBanner] = useState(null);

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [prodRes, catRes] = await Promise.all([
        api.products.getAll({ limit: 200 }),
        api.categories.getAll(),
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      // Surfaced rather than silently swapped for mock data, so a broken
      // catalogue is visible instead of looking healthy.
      setLoadError(err.message || 'Could not load the catalogue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const subcategoryOptions = useMemo(() => {
    const cat = categories.find((c) => String(c.id) === String(formState.categoryId));
    return cat?.subcategories || [];
  }, [categories, formState.categoryId]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormState({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? '' });
    setGalleryUrls([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormState({
      name: product.name || '',
      categoryId: product.categoryId ?? '',
      subcategoryId: product.subcategoryId ?? '',
      price: product.price ?? '',
      discountPrice: product.discountPrice ?? '',
      sku: product.sku || '',
      stock: product.stock ?? 0,
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      careInstructions: product.careInstructions || '',
      isBestseller: product.isBestseller,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      tags: (product.tags || []).join(', '),
      shippingWeightKg: product.shippingWeightKg ?? '',
      packageLengthCm: product.packageLengthCm ?? '',
      packageWidthCm: product.packageWidthCm ?? '',
      packageHeightCm: product.packageHeightCm ?? '',
    });
    setGalleryUrls((product.images || []).map((img) => img.url));
    setFormError('');
    setIsModalOpen(true);
  };

  /**
   * Uploads the chosen files to the server and stores the returned public
   * URLs. The previous build used URL.createObjectURL, which produced blob:
   * references that only existed inside that one browser tab.
   */
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    setFormError('');
    try {
      const res = await api.uploads.images(files);
      setGalleryUrls((prev) => [...prev, ...(res.urls || [])]);
    } catch (err) {
      setFormError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();
    setFormError('');

    const price = Number(formState.price);
    const discountPrice = formState.discountPrice === '' ? null : Number(formState.discountPrice);

    if (!formState.name.trim()) return setFormError('Product name is required.');
    if (!formState.categoryId) return setFormError('Please choose a category.');
    if (!Number.isFinite(price) || price <= 0) return setFormError('Enter a valid retail price.');
    if (discountPrice !== null && discountPrice >= price) {
      return setFormError('The offer price must be lower than the retail price.');
    }
    if (galleryUrls.length === 0) return setFormError('Add at least one product image.');

    const shippingWeightKg = Number(formState.shippingWeightKg);
    const packageLengthCm = Number(formState.packageLengthCm);
    const packageWidthCm = Number(formState.packageWidthCm);
    const packageHeightCm = Number(formState.packageHeightCm);
    if (!(shippingWeightKg > 0)) return setFormError('Enter the packed parcel weight in kg (greater than 0).');
    if (!(packageLengthCm > 0)) return setFormError('Enter the package length in cm (greater than 0).');
    if (!(packageWidthCm > 0)) return setFormError('Enter the package width in cm (greater than 0).');
    if (!(packageHeightCm > 0)) return setFormError('Enter the package height in cm (greater than 0).');

    const payload = {
      name: formState.name.trim(),
      categoryId: Number(formState.categoryId),
      subcategoryId: formState.subcategoryId ? Number(formState.subcategoryId) : null,
      price,
      discountPrice,
      sku: formState.sku.trim() || null,
      stock: Number(formState.stock) || 0,
      tags: formState.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isFeatured: formState.isFeatured,
      isNew: formState.isNew,
      isBestseller: formState.isBestseller,
      shortDescription: formState.shortDescription.trim(),
      description: formState.description.trim(),
      careInstructions: formState.careInstructions.trim(),
      images: galleryUrls,
      shippingWeightKg,
      packageLengthCm,
      packageWidthCm,
      packageHeightCm,
    };

    setSaving(true);
    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, payload);
        notify('success', `“${payload.name}” updated.`);
      } else {
        await api.products.create(payload);
        notify('success', `“${payload.name}” published to the store.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Could not save this product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Remove “${product.name}” from the ORIVIDA catalogue?`)) return;
    try {
      await api.products.remove(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      notify('success', `“${product.name}” removed.`);
    } catch (err) {
      notify('error', err.message || 'Could not delete this product.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Product Name', 'SKU', 'Category', 'Retail Price', 'Offer Price', 'Stock', 'Bestseller', 'New'];
    const rows = filteredProducts.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku || '',
      `"${p.categoryName}"`,
      p.price,
      p.discountPrice ?? '',
      p.stock,
      p.isBestseller ? 'Yes' : 'No',
      p.isNew ? 'Yes' : 'No',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ORIVIDA_Catalogue_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchesCat = categoryFilter === 'all' || p.categorySlug === categoryFilter;
      return matchesQuery && matchesCat;
    });
  }, [products, searchQuery, categoryFilter]);

  const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Inventory</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Products</h1>
          <p className="text-sm text-ink-soft">
            {loading ? 'Loading catalogue…' : `${products.length} item${products.length === 1 ? '' : 's'} in the live store`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-line bg-white text-sm font-medium text-ink hover:border-emerald-default hover:text-emerald-default transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep transition"
          >
            <Plus className="w-4 h-4" /> Add product
          </button>
        </div>
      </header>

      {banner && (
        <div
          role="status"
          className={`flex items-center gap-2.5 px-4 py-3 rounded-md border text-sm ${
            banner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-light border-emerald-default/25 text-emerald-deep'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {banner.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            placeholder="Search by name, SKU, tag or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`${inputClass} sm:w-60 cursor-pointer`}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="surface-card rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center gap-3 text-ink-soft">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm">Loading catalogue…</p>
          </div>
        ) : loadError ? (
          <div className="p-16 text-center space-y-3">
            <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
            <p className="text-sm text-ink font-medium">{loadError}</p>
            <button onClick={loadData} className="text-sm text-emerald-default link-underline">
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="type-heading text-xl text-ink">No products found</p>
            <p className="text-sm text-ink-soft">
              {products.length === 0 ? 'Add your first product to populate the store.' : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-emerald-subtle border-b border-line">
                <tr className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                  <th className="py-3.5 px-5 font-semibold">Product</th>
                  <th className="py-3.5 px-5 font-semibold">Category</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Price</th>
                  <th className="py-3.5 px-5 font-semibold text-center">Stock</th>
                  <th className="py-3.5 px-5 font-semibold">Badges</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-emerald-subtle/50 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3.5">
                        {prod.images[0]?.url ? (
                          <img
                            src={prod.images[0].url}
                            alt=""
                            className="w-11 h-11 rounded-md object-cover border border-line shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-md border border-line bg-emerald-subtle flex items-center justify-center shrink-0">
                            <ImageOff className="w-4 h-4 text-ink-faint" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate max-w-[22rem]">{prod.name}</p>
                          {prod.sku && <p className="text-xs text-ink-faint tabular">{prod.sku}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-ink-soft">{prod.categoryName || '—'}</td>

                    <td className="py-3.5 px-5 text-right">
                      <span className="type-price text-ink">{money(prod.effectivePrice)}</span>
                      {prod.discountPrice && (
                        <span className="block text-xs text-ink-faint line-through tabular">{money(prod.price)}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium tabular ${
                          prod.stock === 0
                            ? 'bg-rose-50 text-rose-700'
                            : prod.stock <= 5
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-emerald-light text-emerald-deep'
                        }`}
                      >
                        {prod.stock === 0 ? 'Out of stock' : prod.stock}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="flex flex-wrap gap-1.5">
                        {prod.isNew && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-default text-white text-[10px] uppercase tracking-wider">New</span>
                        )}
                        {prod.isBestseller && (
                          <span className="px-2 py-0.5 rounded-full bg-gold-default text-white text-[10px] uppercase tracking-wider">Bestseller</span>
                        )}
                        {prod.isFeatured && (
                          <span className="px-2 py-0.5 rounded-full border border-line text-ink-soft text-[10px] uppercase tracking-wider">Featured</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-2 rounded-md text-ink-soft hover:bg-emerald-default hover:text-white transition"
                          title={`Edit ${prod.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod)}
                          className="p-2 rounded-md text-ink-soft hover:bg-rose-600 hover:text-white transition"
                          title={`Delete ${prod.name}`}
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
        )}
      </div>

      {/* Create / edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg max-w-3xl w-full my-8 shadow-overlay border border-line">
            <div className="flex justify-between items-start p-6 sm:p-8 border-b border-line">
              <div className="space-y-1">
                <span className="type-eyebrow text-emerald-default">Catalogue</span>
                <h2 className="type-heading text-2xl text-ink">
                  {editingProduct ? 'Edit product' : 'Add a new product'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 -mr-2 -mt-2 text-ink-faint hover:text-ink transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 sm:p-8 space-y-6">
              {formError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className={labelClass}>Product name</label>
                <input
                  type="text"
                  required
                  placeholder="Royal Variegated Monstera Deliciosa"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Category</label>
                  <select
                    required
                    value={formState.categoryId}
                    onChange={(e) => setFormState({ ...formState, categoryId: e.target.value, subcategoryId: '' })}
                    className={inputClass}
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Subcategory</label>
                  <select
                    value={formState.subcategoryId}
                    onChange={(e) => setFormState({ ...formState, subcategoryId: e.target.value })}
                    className={inputClass}
                    disabled={subcategoryOptions.length === 0}
                  >
                    <option value="">None</option>
                    {subcategoryOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Retail price (₹)</label>
                  <input
                    type="number" required min="1" step="0.01" placeholder="7999"
                    value={formState.price}
                    onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Offer price (₹)</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="Optional"
                    value={formState.discountPrice}
                    onChange={(e) => setFormState({ ...formState, discountPrice: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Stock</label>
                  <input
                    type="number" required min="0"
                    value={formState.stock}
                    onChange={(e) => setFormState({ ...formState, stock: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>SKU</label>
                  <input
                    type="text" placeholder="ORI-PLNT-001"
                    value={formState.sku}
                    onChange={(e) => setFormState({ ...formState, sku: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Tags (comma separated)</label>
                  <input
                    type="text" placeholder="Rare & Exotic, Air Purifying"
                    value={formState.tags}
                    onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Shipping details — the FINAL PACKED PARCEL, priced by Delhivery */}
              <div className="space-y-3 pt-4 border-t border-line">
                <div>
                  <p className="type-eyebrow text-emerald-default">Shipping details</p>
                  <p className="text-xs text-ink-faint mt-1">
                    Enter the final packed parcel — box, soil, padding included — not the raw plant.
                    Delivery charges are quoted from these figures.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Weight (kg)</label>
                    <input
                      type="number" required min="0.01" step="0.01" placeholder="1.20"
                      value={formState.shippingWeightKg}
                      onChange={(e) => setFormState({ ...formState, shippingWeightKg: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Length (cm)</label>
                    <input
                      type="number" required min="1" step="0.5" placeholder="40"
                      value={formState.packageLengthCm}
                      onChange={(e) => setFormState({ ...formState, packageLengthCm: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Width (cm)</label>
                    <input
                      type="number" required min="1" step="0.5" placeholder="20"
                      value={formState.packageWidthCm}
                      onChange={(e) => setFormState({ ...formState, packageWidthCm: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Height (cm)</label>
                    <input
                      type="number" required min="1" step="0.5" placeholder="20"
                      value={formState.packageHeightCm}
                      onChange={(e) => setFormState({ ...formState, packageHeightCm: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Short description</label>
                <input
                  type="text" placeholder="One line shown on the product card"
                  value={formState.shortDescription}
                  onChange={(e) => setFormState({ ...formState, shortDescription: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Full description</label>
                <textarea
                  rows={4}
                  placeholder="The story, provenance and detail shown on the product page"
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Care instructions</label>
                <textarea
                  rows={3}
                  placeholder="Light, watering and humidity guidance"
                  value={formState.careInstructions}
                  onChange={(e) => setFormState({ ...formState, careInstructions: e.target.value })}
                  className={`${inputClass} resize-y`}
                />
              </div>

              {/* Badges */}
              <fieldset className="border border-line rounded-md p-4 space-y-3">
                <legend className={`${labelClass} px-2`}>Merchandising badges</legend>
                <div className="flex flex-wrap gap-6">
                  {[
                    { key: 'isNew', label: 'New arrival' },
                    { key: 'isBestseller', label: 'Bestseller' },
                    { key: 'isFeatured', label: 'Featured' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState[key]}
                        onChange={(e) => setFormState({ ...formState, [key]: e.target.checked })}
                        className="w-4 h-4 accent-[#154734]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Gallery */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-baseline">
                  <label className={labelClass}>Image gallery</label>
                  <span className="text-xs text-ink-faint">
                    {galleryUrls.length} image{galleryUrls.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="border border-dashed border-line-strong rounded-md p-6 text-center hover:border-emerald-default transition">
                  <input
                    type="file" multiple accept="image/*" id="product-images"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="product-images" className="cursor-pointer block space-y-1.5">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-emerald-default mx-auto animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-emerald-default mx-auto" />
                    )}
                    <p className="text-sm font-medium text-ink">
                      {uploading ? 'Uploading…' : 'Click to upload images'}
                    </p>
                    <p className="text-xs text-ink-faint">JPEG, PNG, WebP or AVIF · up to 10 MB each</p>
                  </label>
                </div>

                {galleryUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {galleryUrls.map((url, idx) => (
                      <div key={`${url}-${idx}`} className="relative w-20 h-20 rounded-md overflow-hidden border border-line group">
                        <img src={url} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-emerald-default/90 text-white text-[9px] text-center py-0.5 uppercase tracking-wider">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-white/90 text-rose-600 rounded-full opacity-0 group-hover:opacity-100 transition"
                          aria-label={`Remove image ${idx + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 mt-5 rounded-md border border-line text-sm font-medium text-ink hover:bg-emerald-subtle transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-6 py-2.5 mt-5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep disabled:opacity-50 transition inline-flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProduct ? 'Save changes' : 'Publish to store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
