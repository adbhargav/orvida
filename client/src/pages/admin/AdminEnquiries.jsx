import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, Download, Trash2, MessageSquare, Search, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';

const STATUSES = ['New', 'Contacted', 'Quoted', 'Won', 'Closed'];

const STATUS_TONE = {
  New: 'bg-amber-50 text-amber-800',
  Contacted: 'bg-sky-50 text-sky-800',
  Quoted: 'bg-indigo-50 text-indigo-800',
  Won: 'bg-emerald-light text-emerald-deep',
  Closed: 'bg-emerald-subtle text-ink-soft',
};

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  };

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.enquiries.getAllAdmin();
      setEnquiries(res.enquiries || []);
    } catch (err) {
      setError(err.message || 'Could not load enquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const handleStatusChange = async (enquiry, status) => {
    if (status === enquiry.status) return;
    setBusyId(enquiry.id);
    try {
      await api.enquiries.updateStatus(enquiry.id, status);
      setEnquiries((prev) => prev.map((e) => (e.id === enquiry.id ? { ...e, status } : e)));
      notify('success', `${enquiry.name} marked as ${status}.`);
    } catch (err) {
      notify('error', err.message || 'Could not update this enquiry.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (enquiry) => {
    if (!window.confirm(`Delete the enquiry from ${enquiry.name}?`)) return;
    try {
      await api.enquiries.remove(enquiry.id);
      setEnquiries((prev) => prev.filter((e) => e.id !== enquiry.id));
      notify('success', 'Enquiry deleted.');
    } catch (err) {
      notify('error', err.message || 'Could not delete this enquiry.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Occasion', 'Quantity', 'Budget', 'Status', 'Notes', 'Received'];
    const rows = filtered.map((e) => [
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${(e.company || '').replace(/"/g, '""')}"`,
      e.email,
      e.phone || '',
      `"${e.occasion || ''}"`,
      `"${e.quantity || ''}"`,
      `"${e.budget_per_hamper || ''}"`,
      e.status,
      `"${(e.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      new Date(e.created_at).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ORIVIDA_Enquiries_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const counts = useMemo(() => {
    const map = { ALL: enquiries.length };
    STATUSES.forEach((s) => { map[s] = enquiries.filter((e) => e.status === s).length; });
    return map;
  }, [enquiries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
      const matchesQuery =
        !q ||
        (e.name || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.company || '').toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [enquiries, statusFilter, search]);

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Concierge</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Gifting enquiries</h1>
          <p className="text-sm text-ink-soft">
            {loading ? 'Loading…' : `${enquiries.length} enquir${enquiries.length === 1 ? 'y' : 'ies'} from the storefront form`}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-line bg-white text-sm font-medium text-ink hover:border-emerald-default hover:text-emerald-default disabled:opacity-40 transition"
        >
          <Download className="w-4 h-4" /> Export CSV
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

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['ALL', ...STATUSES].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2 rounded-full text-sm transition ${
                statusFilter === status
                  ? 'bg-emerald-default text-white'
                  : 'bg-white border border-line text-ink-soft hover:border-emerald-default hover:text-emerald-default'
              }`}
            >
              {status === 'ALL' ? 'All' : status}
              <span className="ml-1.5 text-xs opacity-70 tabular">{counts[status] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            placeholder="Search name, company or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      {loading ? (
        <div className="surface-card rounded-lg p-16 flex flex-col items-center gap-3 text-ink-soft">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Loading enquiries…</p>
        </div>
      ) : error ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-3">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-sm text-ink font-medium">{error}</p>
          <button onClick={loadEnquiries} className="text-sm text-emerald-default link-underline">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card rounded-lg p-16 text-center space-y-2">
          <MessageSquare className="w-7 h-7 text-ink-faint mx-auto" />
          <p className="type-heading text-lg text-ink">No enquiries here</p>
          <p className="text-sm text-ink-soft">
            {enquiries.length === 0
              ? 'Submissions from the Bespoke Gifting page will appear here.'
              : 'Try a different filter or search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((enquiry) => (
            <article key={enquiry.id} className="surface-card rounded-lg p-5 sm:p-6 space-y-4">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="type-heading text-lg text-ink">{enquiry.name}</h2>
                    {enquiry.company && <span className="text-sm text-ink-soft">· {enquiry.company}</span>}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_TONE[enquiry.status] || ''}`}>
                      {enquiry.status}
                    </span>
                  </div>

                  <p className="text-sm text-ink-soft">
                    <a href={`mailto:${enquiry.email}`} className="text-emerald-default link-underline">{enquiry.email}</a>
                    {enquiry.phone && (
                      <> · <a href={`tel:${enquiry.phone}`} className="text-emerald-default link-underline tabular">{enquiry.phone}</a></>
                    )}
                  </p>

                  <p className="text-xs text-ink-faint">
                    {new Date(enquiry.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex items-start gap-2 shrink-0">
                  <div className="relative">
                    <select
                      value={enquiry.status}
                      disabled={busyId === enquiry.id}
                      onChange={(e) => handleStatusChange(enquiry, e.target.value)}
                      className="appearance-none pl-3.5 pr-9 py-2 rounded-md border border-line bg-white text-sm text-ink hover:border-emerald-default focus:outline-none focus:border-emerald-default disabled:opacity-50 transition cursor-pointer"
                      aria-label={`Status for ${enquiry.name}`}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {busyId === enquiry.id
                      ? <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-faint pointer-events-none" />
                      : <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />}
                  </div>

                  <button
                    onClick={() => handleDelete(enquiry)}
                    className="p-2 rounded-md text-ink-faint hover:bg-rose-600 hover:text-white transition"
                    aria-label={`Delete enquiry from ${enquiry.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-line text-sm">
                <div>
                  <dt className="type-eyebrow text-ink-soft mb-0.5">Occasion</dt>
                  <dd className="text-ink">{enquiry.occasion || '—'}</dd>
                </div>
                <div>
                  <dt className="type-eyebrow text-ink-soft mb-0.5">Quantity</dt>
                  <dd className="text-ink">{enquiry.quantity || '—'}</dd>
                </div>
                <div>
                  <dt className="type-eyebrow text-ink-soft mb-0.5">Budget each</dt>
                  <dd className="text-ink">{enquiry.budget_per_hamper || '—'}</dd>
                </div>
              </dl>

              {enquiry.notes && (
                <div className="pt-4 border-t border-line">
                  <span className="type-eyebrow text-ink-soft block mb-1.5">Notes</span>
                  <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">{enquiry.notes}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
