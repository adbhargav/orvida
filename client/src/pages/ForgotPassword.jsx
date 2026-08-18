import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, AlertCircle, MailCheck, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { sendResetEmail } from '../config/firebase';
import logoImg from '../assets/logo.png';

const inputClass =
  'w-full px-0 py-3 bg-transparent border-b border-line text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default transition-colors';

const labelClass = 'type-eyebrow text-ink-soft block mb-1';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    try {
      // The backend makes sure Firebase knows this address (accounts created
      // with email/password exist only in our database until now).
      await api.auth.forgotPassword(cleanEmail);

      try {
        await sendResetEmail(cleanEmail);
      } catch (err) {
        // An unknown address must look identical to a known one, so
        // enumeration errors fall through to the same confirmation screen.
        if (err?.code !== 'auth/user-not-found' && err?.code !== 'auth/invalid-email') {
          throw err;
        }
      }

      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-canvas flex items-center justify-center px-6 py-16 sm:py-20">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-5">
          <Link to="/" className="inline-block" aria-label="ORIVIDA home">
            <img src={logoImg} alt="ORIVIDA" className="h-14 w-auto object-contain mx-auto" />
          </Link>
          <div className="space-y-1.5">
            <h1 className="type-display text-3xl text-ink">
              {sent ? 'Check your inbox' : 'Forgot your password?'}
            </h1>
            <p className="text-sm text-ink-soft">
              {sent
                ? `If an account exists for ${email.trim()}, a reset link is on its way.`
                : 'Enter your email and we will send you a link to reset it.'}
            </p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-8 text-center">
            <MailCheck className="w-10 h-10 text-emerald-default mx-auto" strokeWidth={1.5} />
            <p className="text-sm text-ink-soft leading-relaxed">
              The link stays valid for a short while. If it does not arrive within a few minutes,
              check your spam folder or request a new one.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-emerald-default link-underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div role="alert" className="flex items-start gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className={labelClass}>Email address</label>
                <input
                  id="email" type="email" required autoComplete="email" autoFocus
                  value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={inputClass} placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-default hover:bg-emerald-deep disabled:opacity-60 text-white text-[11px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Send reset link</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>

            <p className="text-center text-sm text-ink-soft">
              Remembered it?{' '}
              <Link to="/login" className="text-emerald-default link-underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
