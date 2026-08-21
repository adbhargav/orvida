import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Loader2, AlertCircle, Pencil, Copy, Trash2, Eye, ExternalLink,
  ChevronLeft, ChevronRight, Globe, FileEdit, Clock,
} from 'lucide-react';
import { api } from '../../services/api';
import SeoPageEditor from '../../components/admin/SeoPageEditor';
import { scoreFromRow, scoreBandTone } from '../../lib/seoScore';
import { SITE_URL } from '../../lib/seo';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const STATUS_TONE = {
  published: 'bg-emerald-light text-emerald-deep',
  draft: 'bg-amber-50 text-amber-800',
  scheduled: 'bg-sky-50 text-sky-800',
};

const STATUS_ICON = { published: Globe, draft: FileEdit, scheduled: Clock };

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/**
 * SEO landing pages — list, filters, bulk actions, and the editor.
 *
 * The editor replaces this view rather than opening in a modal: the form is
 * far too tall for a dialog, and a full view keeps the scoring rail visible
 * beside the fields.
 */
export default function AdminSeoPages() {
  const [pages, setPages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('updated');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  // null = list; { id } = editing; { id: null } = creating
  const [editor, setEditor] = useState(null);

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.seo.listPages({ search, status, sort, page, limit: 20 });
      setPages(res.pages || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
      setSelected([]);
    } catch (err) {
      setError(err.message || 'Could not load landing pages.');
    } finally {
      setLoading(false);
    }
  }, [search, status, sort, page]);

  useEffect(() => {
    // Debounced so typing in the search box does not fire a request per key.
    const handle = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(handle);
  }, [load, search]);

  useEffect(() => {
    api.seo.listTemplates().then((res) => setTemplates(res.templates || [])).catch(() => setTemplates([]));
  }, []);

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () =>
    setSelected((prev) => (prev.length === pages.length ? [] : pages.map((p) => p.id)));

  const runBulk = async (action) => {
    const verb = { publish: 'Publish', unpublish: 'Unpublish', delete: 'Delete' }[action];
    if (action === 'delete' && !window.confirm(`Delete ${selected.length} page(s)? This cannot be undone.`)) return;
    if (action !== 'delete' && !window.confirm(`${verb} ${selected.length} page(s)?`)) return;

    setBusy(true);
    try {
      const res = await api.seo.bulkPages(action, selected);
      notify('success', res.message);
      await load();
    } catch (err) {
      notify('error', err.message || 'That action could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (row) => {
    try {
      const res = await api.seo.duplicatePage(row.id);
      notify('success', `Duplicated as “${res.page.name}” (draft).`);
      await load();
    } catch (err) {
      notify('error', err.message || 'Could not duplicate this page.');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete “${row.name}”? This cannot be undone.`)) return;
    try {
      await api.seo.removePage(row.id);
      notify('success', 'Page deleted.');
      await load();
    } catch (err) {
      notify('error', err.message || 'Could not delete this page.');
    }
  };

  const handleTogglePublish = async (row) => {
    const action = row.status === 'published' ? 'unpublish' : 'publish';
    try {
      await api.seo.bulkPages(action, [row.id]);
      notify('success', action === 'publish' ? 'Page published.' : 'Page moved to draft.');
      await load();
    } catch (err) {
      notify('error', err.message || 'Could not change the status.');
    }
  };

  if (editor) {
    return (
      <SeoPageEditor
        pageId={editor.id}
        templates={templates}
        notify={notify}
        onClose={() => { setEditor(null); load(); }}
        onSaved={(saved) => { if (!editor.id) setEditor({ id: saved.id }); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Search content</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Landing pages</h1>
          <p className="text-sm text-ink-soft">
            Standalone pages built to rank — {pagination.total} in total.
          </p>
        </div>
        <button
          onClick={() => setEditor({ id: null })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep transition"
        >
          <Plus className="w-4 h-4" /> New landing page
        </button>
      </header>

      {banner && (
        <div role="status" className={`flex items-center gap-2.5 px-4 py-3 rounded-md border text-sm ${
          banner.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-light border-emerald-default/25 text-emerald-deep'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" /> {banner.text}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, slug or SEO title"
            className={`${inputClass} pl-10`}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={inputClass}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputClass}>
          <option value="updated">Recently updated</option>
          <option value="created">Recently created</option>
          <option value="name">Name A–Z</option>
          <option value="slug">Slug A–Z</option>
        </select>
      </div>

      {/* Bulk bar — only present when it has something to act on */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-md bg-emerald-subtle border border-emerald-default/25">
          <span className="text-sm text-emerald-deep">{selected.length} selected</span>
          <div className="flex flex-wrap gap-2 ml-auto">
            <button onClick={() => runBulk('publish')} disabled={busy}
              className="px-3.5 py-2 rounded-md bg-emerald-default text-white text-xs font-medium hover:bg-emerald-deep disabled:opacity-50 transition">
              Publish
            </button>
            <button onClick={() => runBulk('unpublish')} disabled={busy}
              className="px-3.5 py-2 rounded-md border border-line bg-white text-xs text-ink hover:bg-white/70 disabled:opacity-50 transition">
              Unpublish
            </button>
            <button onClick={() => runBulk('delete')} disabled={busy}
              className="px-3.5 py-2 rounded-md border border-rose-200 bg-white text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="surface-card rounded-lg p-16 flex flex-col items-center gap-3 text-ink-soft">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Loading pages…</p>
        </div>
      ) : error ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{error}</p>
          <button onClick={load} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      ) : pages.length === 0 ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-3">
          <Search className="w-7 h-7 text-ink-faint mx-auto" />
          <p className="type-heading text-lg text-ink">
            {search || status ? 'No pages match those filters' : 'No landing pages yet'}
          </p>
          <p className="text-sm text-ink-soft max-w-md mx-auto">
            {search || status
              ? 'Try a different search or clear the status filter.'
              : 'Landing pages target searches your product pages cannot — “rare indoor plants”, “plant delivery in Hyderabad”.'}
          </p>
          {!search && !status && (
            <button onClick={() => setEditor({ id: null })} className="text-sm text-emerald-default link-underline">
              Create the first one
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="surface-card rounded-lg overflow-hidden hidden lg:block">
            <table className="w-full text-sm">
              <thead className="bg-emerald-subtle/60 text-left">
                <tr className="type-eyebrow text-ink-soft">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.length === pages.length}
                      onChange={toggleAll} className="accent-[#154734]" aria-label="Select all" />
                  </th>
                  <th className="px-4 py-3">Page</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Indexing</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pages.map((row) => {
                  const { score } = scoreFromRow(row);
                  const StatusIcon = STATUS_ICON[row.status] || FileEdit;
                  return (
                    <tr key={row.id} className="hover:bg-emerald-subtle/30 transition">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(row.id)}
                          onChange={() => toggleSelect(row.id)} className="accent-[#154734]"
                          aria-label={`Select ${row.name}`} />
                      </td>
                      <td className="px-4 py-3 min-w-0">
                        <button onClick={() => setEditor({ id: row.id })}
                          className="block text-ink hover:text-emerald-default transition text-left truncate max-w-xs">
                          {row.name}
                        </button>
                        <span className="text-xs text-ink-faint font-mono">/{row.slug}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`type-price ${scoreBandTone(score)}`}>{score}</span>
                        <span className="text-xs text-ink-faint">/100</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${STATUS_TONE[row.status]}`}>
                          <StatusIcon className="w-3 h-3" />
                          {row.status === 'scheduled' && row.scheduled_at
                            ? formatDate(row.scheduled_at)
                            : row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${row.robots_index === false ? 'text-rose-600' : 'text-ink-soft'}`}>
                          {row.robots_index === false ? 'No index' : 'Index'}
                          {row.include_in_sitemap === false && ' · not in sitemap'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-soft whitespace-nowrap">{formatDate(row.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditor({ id: row.id })}
                            className="p-2 rounded-md text-ink-faint hover:bg-emerald-default hover:text-white transition"
                            aria-label={`Edit ${row.name}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {row.status === 'published' && (
                            <a href={`${SITE_URL}/${row.slug}`} target="_blank" rel="noreferrer"
                              className="p-2 rounded-md text-ink-faint hover:bg-emerald-default hover:text-white transition"
                              aria-label={`Preview ${row.name}`}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button onClick={() => handleTogglePublish(row)}
                            className="p-2 rounded-md text-ink-faint hover:bg-emerald-default hover:text-white transition"
                            aria-label={row.status === 'published' ? 'Unpublish' : 'Publish'}>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDuplicate(row)}
                            className="p-2 rounded-md text-ink-faint hover:bg-emerald-default hover:text-white transition"
                            aria-label={`Duplicate ${row.name}`}>
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(row)}
                            className="p-2 rounded-md text-ink-faint hover:bg-rose-600 hover:text-white transition"
                            aria-label={`Delete ${row.name}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — a table this wide is unusable on a phone */}
          <div className="space-y-3 lg:hidden">
            {pages.map((row) => {
              const { score } = scoreFromRow(row);
              return (
                <article key={row.id} className="surface-card rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button onClick={() => setEditor({ id: row.id })}
                        className="type-heading text-base text-ink text-left truncate block w-full">
                        {row.name}
                      </button>
                      <span className="text-xs text-ink-faint font-mono">/{row.slug}</span>
                    </div>
                    <span className={`type-price text-lg shrink-0 ${scoreBandTone(score)}`}>{score}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${STATUS_TONE[row.status]}`}>
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                    <span className="text-xs text-ink-faint">{formatDate(row.updated_at)}</span>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-line">
                    <button onClick={() => setEditor({ id: row.id })}
                      className="flex-1 py-2 rounded-md border border-line text-xs text-ink">Edit</button>
                    <button onClick={() => handleTogglePublish(row)}
                      className="flex-1 py-2 rounded-md border border-line text-xs text-ink">
                      {row.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => handleDelete(row)}
                      className="px-3 py-2 rounded-md border border-rose-200 text-xs text-rose-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-ink-soft">
                Page {pagination.page} of {pagination.pages} · {pagination.total} pages
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-md border border-line text-ink disabled:opacity-40 hover:bg-emerald-subtle transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2 rounded-md border border-line text-ink disabled:opacity-40 hover:bg-emerald-subtle transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
