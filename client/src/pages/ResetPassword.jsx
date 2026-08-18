import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { verifyResetCode, completePasswordReset, signOutFirebase } from '../config/firebase';
import logoImg from '../assets/logo.png';

const inputClass =
  'w-full px-0 py-3 bg-transparent border-b border-line text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default transition-colors';

const labelClass = 'type-eyebrow text-ink-soft block mb-1';

// Landing page for Firebase's password-reset email link. The link carries a
// one-time oobCode; we verify it, let the visitor choose a new password,
// confirm it with Firebase, then sync the new password to our own backend.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  // 'checking' → 'ready' → 'saving' → 'done', or 'invalid' when the code is bad.
  const [status, setStatus] = useState('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  // Once Firebase accepts the new password the oobCode is spent; keep the ID
  // token so a failed backend sync can be retried without a fresh email link.
  const idTokenRef = useRef(null);

  useEffect(() => {
    if (!oobCode) {
      setStatus('invalid');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const verifiedEmail = await verifyResetCode(oobCode);
        if (!cancelled) {
          setEmail(verifiedEmail);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('invalid');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [oobCode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) return setError('Choose a password of at least 6 characters.');
    if (password !== confirm) return setError('Those passwords do not match.');

    setStatus('saving');
    try {
      if (!idTokenRef.current) {
        idTokenRef.current = await completePasswordReset(oobCode, email, password);
      }
      await api.auth.resetPassword(idTokenRef.current, password);
      await signOutFirebase();
      setStatus('done');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setStatus(idTokenRef.current ? 'ready' : 'invalid');
      if (err?.code === 'auth/expired-action-code' || err?.code === 'auth/invalid-action-code') {
        setStatus('invalid');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
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
              {status === 'done' ? 'Password updated' : 'Choose a new password'}
            </h1>
            {status === 'ready' && email && (
              <p className="text-sm text-ink-soft">for {email}</p>
            )}
          </div>
        </div>

        {status === 'checking' && (
          <div className="flex flex-col items-center gap-3 text-ink-soft py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm">Verifying your reset link…</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="space-y-8 text-center">
            <div role="alert" className="flex items-start gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 text-sm text-rose-800 text-left">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              This reset link is invalid or has expired. Please request a new one.
            </div>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-sm text-emerald-default link-underline"
            >
              Request a new link <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-default mx-auto" strokeWidth={1.5} />
            <p className="text-sm text-ink-soft leading-relaxed">
              Your password has been changed. Taking you to sign in…
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-emerald-default link-underline">
              Sign in now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {(status === 'ready' || status === 'saving') && (
          <>
            {error && (
              <div role="alert" className="flex items-start gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="new-password" className={labelClass}>New password</label>
                <input
                  id="new-password" type="password" required autoComplete="new-password" autoFocus
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className={inputClass} placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className={labelClass}>Confirm new password</label>
                <input
                  id="confirm-password" type="password" required autoComplete="new-password"
                  value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                  className={inputClass} placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'saving'}
                className="w-full py-3.5 bg-emerald-default hover:bg-emerald-deep disabled:opacity-60 text-white text-[11px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors"
              >
                {status === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Reset password</span>
                {status !== 'saving' && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
