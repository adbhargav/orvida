import React from 'react';
import { X, ShieldCheck, Sparkles, Leaf } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, loginWithGoogle } = useAuth();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 glass-dark bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0B3D2E] text-[#F7F5EF] w-full max-w-md rounded-3xl p-8 border border-[#C9972B]/60 shadow-2xl relative text-center">
        
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-[#F7F5EF]/70 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 rounded-full bg-[#0A3324] border border-[#8A6A16] mb-3">
            <Leaf className="w-8 h-8 text-[#F0D585]" />
          </div>
          <h2 className="font-display font-extrabold text-2xl tracking-widest text-gold-gradient">
            ORIVIDA
          </h2>
          <p className="font-serif italic text-xs text-[#F0D585] mt-1">
            "Our Passion, UR Luxury"
          </p>
        </div>

        <h3 className="font-display font-semibold text-lg text-white mb-2">
          Join the ORIVIDA Luxury Circle
        </h3>
        <p className="text-xs text-[#F7F5EF]/80 mb-6 leading-relaxed">
          Sign in to track orders, save rare botanical wishlists, access private artisan drops, and enjoy express checkout.
        </p>

        {/* Brand Google Sign-In Button */}
        <button
          onClick={loginWithGoogle}
          className="w-full bg-[#FAF8F3] hover:bg-white text-[#1B1B1B] font-bold py-3.5 px-6 rounded-full border-2 border-[#C9972B] flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition duration-300 mb-6 group"
        >
          {/* Google SVG Logo */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-xs tracking-wider group-hover:text-[#0B3D2E]">
            CONTINUE WITH GOOGLE
          </span>
        </button>

        {/* Benefits Trust Row */}
        <div className="pt-4 border-t border-[#8A6A16]/30 grid grid-cols-2 gap-2 text-[10px] text-[#F7F5EF]/70">
          <span className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F0D585]" /> Secure Encryption
          </span>
          <span className="flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F0D585]" /> Exclusive Member Perks
          </span>
        </div>

      </div>
    </div>
  );
}
