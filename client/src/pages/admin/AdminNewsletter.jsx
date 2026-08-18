import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, Download, Mail, Search, Copy, Check } from 'lucide-react';
import { api } from '../../services/api';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.newsletter.getAllAdmin();
      setSubscribers(res.subscribers || []);
    } catch (err) {
      setError(err.message || 'Could not load subscribers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  const activeCount = subscribers.filter((s) => s.is_active).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) => s.email.toLowerCase().includes(q));
  }, [subscribers, search]);

  /** Copies active addresses for pasting into an email platform. */
  const handleCopyActive = async () => {
    const list = subscribers.filter((s) => s.is_active).map((s) => s.email).join(', ');
    try {
      await navigator.clipboard.writeText(list);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy to the clipboard.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Email', 'Source', 'Status', 'Subscribed', 'Unsubscribed'];
    const rows = filtered.map((s) => [
      s.email,
      s.source || '',
      s.is_active ? 'Active' : 'Unsubscribed',
      new Date(s.created_at).toISOString().slice(0, 10),
      s.unsubscribed_at ? new Date(s.unsubscribed_at).toISOString().slice(0, 10) : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ORIVIDA_Subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Audience</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Newsletter</h1>
          <p className="text-sm text-ink-soft">
            {loading ? 'Loading…' : `${activeCount} active of ${subscribers.length} total`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyActive}
            disabled={activeCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-line bg-white text-sm font-medium text-ink hover:border-emerald-default hover:text-emerald-default disabled:opacity-40 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-default" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy active'}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-line bg-white text-sm font-medium text-ink hover:border-emerald-default hover:text-emerald-default disabled:opacity-40 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          placeholder="Search by email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} pl-10`}
        />
      </div>

      <div className="surface-card rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center gap-3 text-ink-soft">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm">Loading subscribers…</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center space-y-3">
            <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
            <p className="text-sm text-ink font-medium">{error}</p>
            <button onClick={loadSubscribers} className="text-sm text-emerald-default link-underline">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Mail className="w-7 h-7 text-ink-faint mx-auto" />
            <p className="type-heading text-lg text-ink">No subscribers yet</p>
            <p className="text-sm text-ink-soft">Signups from the footer form will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-emerald-subtle border-b border-line">
                <tr className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                  <th className="py-3.5 px-6 font-semibold">Email</th>
                  <th className="py-3.5 px-6 font-semibold">Source</th>
                  <th className="py-3.5 px-6 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold">Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-emerald-subtle/50 transition">
                    <td className="py-3.5 px-6">
                      <a href={`mailto:${s.email}`} className="text-ink hover:text-emerald-default transition-colors">
                        {s.email}
                      </a>
                    </td>
                    <td className="py-3.5 px-6 text-ink-soft">{s.source || '—'}</td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        s.is_active ? 'bg-emerald-light text-emerald-deep' : 'bg-emerald-subtle text-ink-soft'
                      }`}>
                        {s.is_active ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-ink-soft">
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
