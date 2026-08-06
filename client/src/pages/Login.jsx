import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password should be at least 6 characters');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        signupWithEmail(formData.name, formData.email, formData.password);
        setLoading(false);
        navigate('/account');
      }, 500);
    } else {
      if (!formData.email || !formData.password) {
        setError('Please enter your email and password');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        loginWithEmail(formData.email, formData.password);
        setLoading(false);
        navigate('/account');
      }, 500);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
    navigate('/account');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-body">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-xl">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block">
            <img src={logoImg} alt="ORIVIDA Atelier" className="h-12 w-auto object-contain mx-auto" />
          </Link>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#154734] bg-[#E8F2EC] px-3 py-1 rounded-full border border-[#154734]/20">
              ORIVIDA PRIVILEGE CIRCLE
            </span>
            <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-2">
              {mode === 'signin' ? 'Welcome Back to ORIVIDA' : 'Create Your Luxury Account'}
            </h1>
            <p className="text-xs text-slate-500">
              {mode === 'signin' 
                ? 'Sign in to access VIP member rewards, order tracking & private drops' 
                : 'Join the ORIVIDA luxury circle for exclusive nursery & artisan perks'}
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl transition duration-200 ${
              mode === 'signin' ? 'bg-white text-[#154734] shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl transition duration-200 ${
              mode === 'signup' ? 'bg-white text-[#154734] shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#154734]" /> Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Princess Radhika"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:border-[#154734] bg-gray-50 text-xs font-medium"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#154734]" /> Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="radhika@orvida-luxury.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:border-[#154734] bg-gray-50 text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#154734]" /> Password *
              </label>
              {mode === 'signin' && (
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to your registered email!'); }} className="text-[11px] font-semibold text-[#154734] hover:underline">
                  Forgot Password?
                </a>
              )}
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:border-[#154734] bg-gray-50 text-xs font-medium"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#154734]" /> Confirm Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:border-[#154734] bg-gray-50 text-xs font-medium"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#154734] hover:bg-[#0F3526] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition duration-300 flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <span>{loading ? 'Processing...' : mode === 'signin' ? 'SIGN IN TO YOUR ACCOUNT' : 'CREATE LUXURY ACCOUNT'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">OR</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-slate-700 font-bold py-3 px-4 rounded-2xl transition duration-300 flex items-center justify-center gap-3 text-xs shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>CONTINUE WITH GOOGLE</span>
        </button>

        {/* Guarantee Badge */}
        <div className="pt-2 text-center text-[10px] text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1 font-semibold text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-[#154734]" /> 256-Bit SSL Encrypted Account Protection
          </p>
        </div>

      </div>
    </div>
  );
}
