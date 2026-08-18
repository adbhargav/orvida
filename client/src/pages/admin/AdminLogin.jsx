import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, ShieldOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';

export default function AdminLogin({ currentUser }) {
  const { loginWithEmail, loading, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const signedIn = await loginWithEmail(email.trim(), password);
      // Authenticating succeeds for any customer; only administrators may
      // continue past this screen.
      if (!signedIn.isAdmin) {
        setError('This account does not have administrator privileges.');
      }
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your credentials.');
    }
  };

  // Signed in, but as a customer rather than an administrator.
  if (currentUser) {
    return (
      <div className="min-h-screen bg-emerald-darker flex items-center justify-center p-4 font-body">
        <div className="max-w-md w-full bg-emerald-deep border border-emerald-default rounded-lg p-8 text-center space-y-5">
          <ShieldOff className="w-9 h-9 text-gold-mid mx-auto" />
          <div className="space-y-2">
            <h1 className="type-heading text-2xl text-white">Administrator access required</h1>
            <p className="text-sm text-emerald-light/80">
              You are signed in as <span className="text-white">{currentUser.email}</span>, which does not have
              access to the ORIVIDA atelier portal.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-1">
            <button
              onClick={logout}
              className="w-full py-3 rounded-md bg-white text-emerald-deep text-sm font-medium hover:bg-emerald-light transition"
            >
              Sign in with a different account
            </button>
            <Link
              to="/"
              className="w-full py-3 rounded-md border border-emerald-default text-emerald-light text-sm font-medium hover:bg-emerald-default/40 transition"
            >
              Return to the store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-darker flex items-center justify-center p-4 font-body">
      <div className="max-w-md w-full bg-emerald-deep border border-emerald-default rounded-lg p-8 sm:p-10 space-y-8">
        <div className="text-center space-y-4">
          <img src={logoImg} alt="ORIVIDA" className="h-11 w-auto object-contain mx-auto brightness-0 invert" />
          <div className="space-y-1.5">
            <span className="type-eyebrow text-gold-mid">Atelier Portal</span>
            <h1 className="type-heading text-2xl text-white">Administrator sign in</h1>
            <p className="text-sm text-emerald-light/70">
              Inventory, orders, customers and financial records
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 px-4 py-3 rounded-md bg-rose-950/60 border border-rose-800 text-sm text-rose-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-light/80 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gold-mid" /> Email address
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-emerald-darker border border-emerald-default rounded-md px-4 py-3 text-sm text-white placeholder:text-emerald-light/40 focus:outline-none focus:border-gold-mid transition"
              placeholder="you@orvida.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-light/80 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-gold-mid" /> Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-emerald-darker border border-emerald-default rounded-md px-4 py-3 text-sm text-white placeholder:text-emerald-light/40 focus:outline-none focus:border-gold-mid transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-emerald-light text-emerald-deep font-medium py-3 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{loading ? 'Verifying…' : 'Sign in'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-xs text-emerald-light/50">
          Access is verified against your account on every request.
        </p>
      </div>
    </div>
  );
}
