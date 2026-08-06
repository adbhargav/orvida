import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, Truck, RefreshCw, Award, Send } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export default function Footer() {
  return (
    <footer className="bg-[#0C2B21] border-t border-[#154734] text-white pt-16 pb-12 relative overflow-hidden">
      
      {/* Brand Trust Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl bg-[#123E30] border border-[#1E5644] shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-[#154734] text-[#F0D585] border border-[#2A6A52]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-white">White-Glove Express</h5>
              <p className="text-xs text-[#C2D6CB]">Temperature-controlled nursery shipping</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-[#154734] text-[#F0D585] border border-[#2A6A52]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-white">7-Day Health Guarantee</h5>
              <p className="text-xs text-[#C2D6CB]">Replacement assurance for live plants</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-[#154734] text-[#F0D585] border border-[#2A6A52]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-white">Master Artisan Arts</h5>
              <p className="text-xs text-[#C2D6CB]">100% authentic heritage handicrafts</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-[#154734] text-[#F0D585] border border-[#2A6A52]">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-white">Bespoke Concierge</h5>
              <p className="text-xs text-[#C2D6CB]">Custom hampers & corporate styling</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
        
        {/* Brand Narrative Column */}
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="inline-block py-1">
            <img src={logoImg} alt="ORIVIDA - Our Passion, UR Luxury" className="h-12 sm:h-14 md:h-16 w-auto object-contain origin-left" />
          </Link>
          <p className="text-xs text-[#C2D6CB] leading-relaxed pr-4">
            ORIVIDA brings together living botanical luxury, hand-nurtured variegated flora, and ancestral metalwork art. Designed for refined homes, curated office suites, and memorable gifting occasions.
          </p>

          {/* Newsletter Signup */}
          <div className="pt-2">
            <p className="text-xs uppercase font-bold tracking-wider text-[#F0D585] mb-2">Join the ORIVIDA Private Society</p>
            <p className="text-xs text-[#C2D6CB] mb-3">Subscribe for rare plant drop alerts and private artisan collection previews.</p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing to ORIVIDA Private Society!'); }} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                className="bg-[#123E30] border border-[#2A6A52] rounded-full px-4 py-2.5 text-xs text-white placeholder-[#C2D6CB]/60 focus:outline-none focus:border-[#F0D585] flex-1"
              />
              <button
                type="submit"
                className="bg-[#F0D585] hover:bg-white text-[#0C2B21] px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md hover:scale-105 transition"
              >
                <span>JOIN</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* Column 2: Collections */}
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-[#F0D585] mb-4">Collections</h4>
          <ul className="space-y-2.5 text-xs text-[#C2D6CB]">
            <li><Link to="/category/plants" className="hover:text-white transition">Indoor Rare Botanicals</Link></li>
            <li><Link to="/category/gifting-solutions" className="hover:text-white transition">Luxury Gift Hampers</Link></li>
            <li><Link to="/category/arts-decor" className="hover:text-white transition">Bastar Bell Metal Arts</Link></li>
            <li><Link to="/category/balcony-makeover" className="hover:text-white transition">Urban Balcony Makeovers</Link></li>
            <li><Link to="/category/arts-decor/pottery-ceramics" className="hover:text-white transition">Jaipur Studio Ceramics</Link></li>
          </ul>
        </div>

        {/* Column 3: Client Care */}
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-[#F0D585] mb-4">Client Services</h4>
          <ul className="space-y-2.5 text-xs text-[#C2D6CB]">
            <li><Link to="/gifting-concierge" className="hover:text-white transition">Bespoke Concierge</Link></li>
            <li><Link to="/account" className="hover:text-white transition">Track Your Shipment</Link></li>
            <li><Link to="/about" className="hover:text-white transition">Plant Care Guides</Link></li>
            <li><Link to="/about" className="hover:text-white transition">Artisan Heritage Origin</Link></li>
            <li><Link to="/admin" className="hover:text-white transition">Admin Portal Preview</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact & Social */}
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-[#F0D585] mb-4">Atelier Contact</h4>
          <div className="text-xs text-[#C2D6CB] space-y-2">
            <p>📍 Atelier ORIVIDA, Indiranagar, Bengaluru 560038</p>
            <p>✉️ concierge@orvida-luxury.com</p>
            <p>📞 +91 (800) ORIVIDA-LUX</p>
          </div>

          <div className="flex gap-3 mt-4 text-[#F0D585]">
            <a href="#instagram" aria-label="Instagram" className="p-2 rounded-full bg-[#123E30] border border-[#2A6A52] hover:border-[#F0D585] transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="#facebook" aria-label="Facebook" className="p-2 rounded-full bg-[#123E30] border border-[#2A6A52] hover:border-[#F0D585] transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.592 9 4.415V8z"/></svg>
            </a>
            <a href="#youtube" aria-label="YouTube" className="p-2 rounded-full bg-[#123E30] border border-[#2A6A52] hover:border-[#F0D585] transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Hairline Gold Divider */}
      <div className="max-w-7xl mx-auto px-4 border-t border-[#1E5644] pt-6 flex flex-col md:flex-row justify-between items-center text-[11px] text-[#C2D6CB]/70 gap-4">
        <p>© 2026 ORIVIDA Luxury Ltd. All Rights Reserved. Crafted for Botanical Aficionados.</p>
        <div className="flex items-center gap-4">
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Terms of Luxury Service</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Plant Guarantee Policy</span>
        </div>
      </div>
    </footer>
  );
}
