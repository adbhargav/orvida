import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';
import usePageMeta from '../hooks/usePageMeta';

const inputClass =
  'w-full px-0 py-3 bg-transparent border-b border-line text-ink placeholder:text-ink-faint ' +
  'focus:outline-none focus:border-emerald-default transition-colors';

const labelClass = 'type-eyebrow text-ink-soft block mb-1';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { loginWithEmail, signupWithEmail, loginWithGoogle, loading } = useAuth();

  // Where to land after a successful sign-in (e.g. back to /checkout).
  // Only same-site paths are honoured so the param can't redirect elsewhere.
  const redirectParam = searchParams.get('redirect');
  const destination = redirectParam?.startsWith('/') && !redirectParam.startsWith('//')
    ? redirectParam
    : '/account';

  const [mode, setMode] = useState(location.pathname === '/signup' ? 'signup' : 'signin');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  usePageMeta({
    title: mode === 'signup' ? 'Create Account | ORIVIDA' : 'Sign In | ORIVIDA',
    path: mode === 'signup' ? '/signup' : '/login',
    robots: 'noindex, follow',
  });

  const update = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (mode === 'signup') {
        if (!formData.name.trim()) return setError('Please enter your full name.');
        if (formData.password.length < 6) return setError('Choose a password of at least 6 characters.');
        if (formData.password !== formData.confirmPassword) return setError('Those passwords do not match.');
        await signupWithEmail(formData.name.trim(), formData.email.trim(), formData.password);
      } else {
        await loginWithEmail(formData.email.trim(), formData.password);
      }
      navigate(destination);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate(destination);
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-canvas grid lg:grid-cols-2">
      {/* Editorial panel */}
      <div className="hidden lg:block relative bg-emerald-darker overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div className="relative h-full flex flex-col justify-end p-14 text-white">
          <div className="max-w-md space-y-4">
            <span className="type-eyebrow text-gold-light block">The ORIVIDA membership</span>
            <p className="type-display text-4xl leading-tight">
              Rare specimen drops, private previews and white-glove care.
            </p>
            <p className="text-emerald-light/70 leading-relaxed">
              Track every order, save your delivery addresses and keep a wishlist of the pieces you are waiting for.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-16 sm:py-20">
        <div className="w-full max-w-sm space-y-10">
          <div className="text-center space-y-5">
            <Link to="/" className="inline-block" aria-label="ORIVIDA home">
              <img src={logoImg} alt="ORIVIDA" className="h-14 w-auto object-contain mx-auto logo-on-light" />
            </Link>
            <div className="space-y-1.5">
              <h1 className="type-display text-3xl text-ink">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-sm text-ink-soft">
                {mode === 'signup'
                  ? 'Join the house of botanical luxury.'
                  : 'Sign in to your ORIVIDA account.'}
              </p>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className={labelClass}>Full name</label>
                <input
                  id="name" type="text" required autoComplete="name"
                  value={formData.name} onChange={update('name')}
                  className={inputClass} placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className={labelClass}>Email address</label>
              <input
                id="email" type="email" required autoComplete="email"
                value={formData.email} onChange={update('email')}
                className={inputClass} placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                id="password" type="password" required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={formData.password} onChange={update('password')}
                className={inputClass} placeholder="••••••••"
              />
              {mode === 'signin' && (
                <div className="text-right mt-2">
                  <Link to="/forgot-password" className="text-xs text-ink-soft hover:text-emerald-default transition-colors link-underline">
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirm" className={labelClass}>Confirm password</label>
                <input
                  id="confirm" type="password" required autoComplete="new-password"
                  value={formData.confirmPassword} onChange={update('confirmPassword')}
                  className={inputClass} placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-default hover:bg-emerald-deep disabled:opacity-60 text-white text-[11px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mode === 'signup' ? 'Create account' : 'Sign in'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          <div className="flex items-center gap-4">
            <span className="flex-1 h-px bg-line" />
            <span className="type-eyebrow text-ink-faint">or</span>
            <span className="flex-1 h-px bg-line" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 border border-line hover:border-ink text-ink text-sm flex items-center justify-center gap-3 disabled:opacity-60 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-ink-soft">
            {mode === 'signup' ? 'Already have an account?' : 'New to ORIVIDA?'}{' '}
            <button
              onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
              className="text-emerald-default link-underline"
            >
              {mode === 'signup' ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
