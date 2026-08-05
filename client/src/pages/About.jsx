import React from 'react';
import { Leaf, Award, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { BRAND_STATS } from '../data/mockData';

export default function About() {
  return (
    <div className="pb-24 space-y-20">
      
      {/* Hero Header */}
      <section className="relative py-24 bg-[#062319] border-b border-[#8A6A16]/30 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 space-y-4 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F0D585]">
            Brand Manifesto
          </span>
          <h1 className="font-serif font-extrabold text-4xl sm:text-6xl text-white">
            "Our Passion, UR Luxury"
          </h1>
          <p className="text-sm sm:text-base text-[#F7F5EF]/80 max-w-2xl mx-auto leading-relaxed font-body">
            ORIVIDA was founded with a singular conviction: that living plants and ancestral hand-cast arts belong together in modern sanctuary homes.
          </p>
        </div>
      </section>

      {/* Main Story Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-[#F7F5EF]">
          <span className="text-xs uppercase font-bold tracking-widest text-[#F0D585]">Botanical Nursery Philosophy</span>
          <h2 className="font-serif text-3xl font-bold text-white">18-Month Nursery Acclimatization</h2>
          <p className="text-xs sm:text-sm text-[#F7F5EF]/80 leading-relaxed font-body">
            Unlike commercial plant nurseries that mass-force greenhouse growth with synthetic stimulants, every ORIVIDA botanical specimen is hand-tended for 18 months in our organic nursery in Coorg.
          </p>
          <p className="text-xs sm:text-sm text-[#F7F5EF]/80 leading-relaxed font-body">
            We cultivate strong root systems, inspect leaf fenestrations under natural shade cloth, and pot each plant in custom perlite-coco aeration mixes before shipping.
          </p>
        </div>

        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-[#C9972B] shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=1200&q=80"
            alt="ORIVIDA Organic Nursery"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Heritage Craftsmanship Section */}
      <section className="bg-[#0A3324] py-20 border-y border-[#8A6A16]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-[#C9972B] shadow-2xl order-2 lg:order-1">
            <img
              src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80"
              alt="Bastar Bell Metal Craftsmanship"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-6 text-[#F7F5EF] order-1 lg:order-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#F0D585]">Preserving Heritage Arts</span>
            <h2 className="font-serif text-3xl font-bold text-white">4,000-Year Lost-Wax Metalwork</h2>
            <p className="text-xs sm:text-sm text-[#F7F5EF]/80 leading-relaxed font-body">
              Our Arts & Décor collection directly empowers over 120 artisan families in Chhattisgarh and Rajasthan. Our Bastar bell metal (Dhokra) pieces are hand-sculpted thread-by-thread from bees' wax, encased in river clay, and cast in molten bell metal at 1100°C.
            </p>
            <p className="text-xs sm:text-sm text-[#F7F5EF]/80 leading-relaxed font-body">
              No two pieces are ever identical, guaranteeing that your ORIVIDA planter or sculpture is a unique heirloom investment.
            </p>
          </div>

        </div>
      </section>

      {/* Stats Ticker */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {BRAND_STATS.map((stat, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-[#0A3324] border border-[#8A6A16]/30 space-y-1">
            <p className="font-display font-extrabold text-3xl text-gold-gradient">{stat.value}</p>
            <p className="text-xs uppercase font-semibold text-[#F7F5EF]/70">{stat.label}</p>
          </div>
        ))}
      </section>

    </div>
  );
}
