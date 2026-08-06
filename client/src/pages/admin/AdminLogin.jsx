import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@orvida.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (email === 'admin@orvida.com' && password === 'admin123') {
      onLoginSuccess({
        name: 'Master Atelier Admin',
        email: 'admin@orvida.com',
        role: 'Super Administrator'
      });
    } else {
      setError('Invalid admin credentials. Use admin@orvida.com / admin123');
    }
  };

  return (
    <div className="min-h-screen bg-[#0C2B21] flex items-center justify-center p-4 relative overflow-hidden font-body">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#154734]/40 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-[#123E30] border border-[#1E5644] rounded-3xl p-8 shadow-2xl space-y-6 text-white">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <img src={logoImg} alt="ORIVIDA Atelier" className="h-12 w-auto object-contain mx-auto filter brightness-200" />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#F0D585] bg-[#154734] px-3 py-1 rounded-full border border-[#2A6A52]">
              ADMINISTRATION PORTAL
            </span>
            <h1 className="font-display font-extrabold text-2xl text-white mt-2">Atelier Executive Login</h1>
            <p className="text-xs text-[#C2D6CB]">Access ORIVIDA inventory, financial ledger & customer analytics</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-900/60 border border-rose-700 text-rose-200 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-[#E8F2EC] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#F0D585]" /> Admin Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0C2B21] border border-[#2A6A52] rounded-2xl px-4 py-3 text-white placeholder-[#C2D6CB]/60 focus:outline-none focus:border-[#F0D585] text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[#E8F2EC] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#F0D585]" /> Secret Password / Key
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0C2B21] border border-[#2A6A52] rounded-2xl px-4 py-3 text-white placeholder-[#C2D6CB]/60 focus:outline-none focus:border-[#F0D585] text-xs font-medium"
            />
          </div>

          {/* Quick Demo Credentials Help */}
          <div className="p-3 rounded-2xl bg-[#154734]/60 border border-[#2A6A52] text-[11px] text-[#C2D6CB] space-y-1">
            <span className="text-[#F0D585] font-bold block">Demo Admin Credentials:</span>
            <p>Email: <code className="text-white font-mono font-bold">admin@orvida.com</code></p>
            <p>Password: <code className="text-white font-mono font-bold">admin123</code></p>
          </div>

          <button
            type="submit"
            className="w-full bg-[#154734] hover:bg-[#1E5644] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition duration-300 flex items-center justify-center gap-2 border border-[#F0D585]/30 hover:scale-[1.02]"
          >
            <span>AUTHENTICATE & ENTER PORTAL</span>
            <ArrowRight className="w-4 h-4 text-[#F0D585]" />
          </button>
        </form>

        <div className="text-center pt-2">
          <span className="text-[10px] text-[#C2D6CB]/70 uppercase font-bold tracking-wider">
            🔒 Protected by 256-Bit SSL Atelier Encryption
          </span>
        </div>

      </div>
    </div>
  );
}
