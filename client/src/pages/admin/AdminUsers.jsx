import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ShieldCheck, ShieldOff, UserPlus, X, Loader2, AlertCircle, Download } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line bg-white text-sm text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default focus:ring-1 focus:ring-emerald-default/30 transition';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [banner, setBanner] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.users.getAll();
      setUsers(res.users || []);
    } catch (err) {
      setError(err.message || 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleRole = async (target) => {
    const nextIsAdmin = !target.is_admin;
    const verb = nextIsAdmin ? 'Grant administrator access to' : 'Revoke administrator access from';
    if (!window.confirm(`${verb} ${target.email}?`)) return;

    try {
      await api.users.setRole(target.id, nextIsAdmin);
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, is_admin: nextIsAdmin } : u)));
      notify('success', `${target.email} is ${nextIsAdmin ? 'now an administrator' : 'no longer an administrator'}.`);
    } catch (err) {
      notify('error', err.message || 'Could not update this role.');
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setFormError('');

    if (adminForm.password.length < 8) {
      setFormError('Choose a password of at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      await api.users.createAdmin(adminForm);
      setIsModalOpen(false);
      setAdminForm({ name: '', email: '', password: '', phone: '' });
      notify('success', `Administrator account ready for ${adminForm.email}.`);
      await loadUsers();
    } catch (err) {
      setFormError(err.message || 'Could not create this administrator.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Administrator', 'Joined'];
    const rows = filtered.map((u) => [
      u.id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      u.email,
      u.phone || '',
      u.is_admin ? 'Yes' : 'No',
      new Date(u.created_at).toISOString().slice(0, 10),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ORIVIDA_Customers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="min-h-screen bg-canvas p-6 sm:p-10 space-y-8">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 border-b border-line pb-6">
        <div className="space-y-1.5">
          <span className="type-eyebrow text-emerald-default">Accounts</span>
          <h1 className="type-display text-3xl sm:text-[2.5rem] text-ink">Customers</h1>
          <p className="text-sm text-ink-soft">
            {loading ? 'Loading…' : `${users.length} registered account${users.length === 1 ? '' : 's'}`}
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
            onClick={() => { setFormError(''); setIsModalOpen(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep transition"
          >
            <UserPlus className="w-4 h-4" /> New administrator
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

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} pl-10`}
        />
      </div>

      <div className="surface-card rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center gap-3 text-ink-soft">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm">Loading customers…</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center space-y-3">
            <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
            <p className="text-sm text-ink font-medium">{error}</p>
            <button onClick={loadUsers} className="text-sm text-emerald-default link-underline">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-1.5">
            <p className="type-heading text-lg text-ink">No customers found</p>
            <p className="text-sm text-ink-soft">Try a different search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-emerald-subtle border-b border-line">
                <tr className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                  <th className="py-3.5 px-6 font-semibold">Customer</th>
                  <th className="py-3.5 px-6 font-semibold">Phone</th>
                  <th className="py-3.5 px-6 font-semibold">Joined</th>
                  <th className="py-3.5 px-6 font-semibold">Role</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-emerald-subtle/50 transition">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {u.photo_url ? (
                            <img src={u.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-line" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-light text-emerald-deep flex items-center justify-center text-sm font-medium">
                              {(u.name || u.email || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{u.name || 'Unnamed'}</p>
                            <p className="text-xs text-ink-faint truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-ink-soft tabular">{u.phone || '—'}</td>
                      <td className="py-3.5 px-6 text-ink-soft">
                        {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.is_admin ? 'bg-emerald-light text-emerald-deep' : 'bg-emerald-subtle text-ink-soft'
                        }`}>
                          {u.is_admin ? 'Administrator' : 'Customer'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot change your own role' : undefined}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-xs font-medium text-ink hover:border-emerald-default hover:text-emerald-default disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          {u.is_admin ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          {u.is_admin ? 'Revoke admin' : 'Make admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-md w-full shadow-overlay border border-line">
            <div className="flex justify-between items-start p-6 border-b border-line">
              <div className="space-y-1">
                <span className="type-eyebrow text-emerald-default">Access</span>
                <h2 className="type-heading text-xl text-ink">New administrator</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 -mt-2 text-ink-faint hover:text-ink transition" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className={labelClass}>Full name</label>
                <input type="text" required value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Email</label>
                <input type="email" required autoComplete="off" value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Password</label>
                <input type="password" required minLength={8} autoComplete="new-password" value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} className={inputClass} />
                <p className="text-xs text-ink-faint">Minimum 8 characters.</p>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Phone (optional)</label>
                <input type="tel" value={adminForm.phone}
                  onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} className={inputClass} />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 mt-4 rounded-md border border-line text-sm font-medium text-ink hover:bg-emerald-subtle transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 mt-4 rounded-md bg-emerald-default text-white text-sm font-medium hover:bg-emerald-deep disabled:opacity-50 transition inline-flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
