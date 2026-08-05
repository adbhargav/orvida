import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Package, Truck, Home, Printer, ArrowRight, Sparkles } from 'lucide-react';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // Fire celebratory gold confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C9972B', '#F0D585', '#0B3D2E', '#FFFFFF']
      });
    } catch {
      // ignore fallback
    }

    const saved = localStorage.getItem('orvida_last_order');
    if (saved) {
      setOrder(JSON.parse(saved));
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-dark p-8 md:p-12 rounded-3xl border-2 border-[#C9972B] text-center space-y-4 shadow-2xl relative overflow-hidden">
        <div className="p-4 rounded-full bg-[#0A3324] border border-[#F0D585] w-20 h-20 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-[#F0D585]" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-[#F0D585]">Order Placed Successfully</span>
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-white">
          Thank You For Choosing ORIVIDA
        </h1>
        <p className="text-xs text-[#F7F5EF]/80 max-w-md mx-auto">
          Your botanical luxury items are being prepped at our nursery atelier in Indiranagar, Bengaluru.
        </p>
        <p className="text-sm font-mono font-bold text-gold-gradient">
          Order Reference: #{id || order?.orderId || 'ORI-ORD-982131'}
        </p>

        {/* Timeline Tracker */}
        <div className="pt-8 border-t border-[#8A6A16]/30 grid grid-cols-4 gap-2 text-center text-[10px] text-[#F7F5EF]/80">
          <div className="space-y-1">
            <div className="w-8 h-8 rounded-full bg-[#C9972B] text-black font-bold mx-auto flex items-center justify-center">1</div>
            <p className="font-bold text-[#F0D585]">Confirmed</p>
          </div>
          <div className="space-y-1">
            <div className="w-8 h-8 rounded-full bg-[#0A3324] border border-[#8A6A16] mx-auto flex items-center justify-center text-[#F0D585]">2</div>
            <p>Nursery Prep</p>
          </div>
          <div className="space-y-1">
            <div className="w-8 h-8 rounded-full bg-[#0A3324] border border-[#8A6A16] mx-auto flex items-center justify-center text-[#F0D585]">3</div>
            <p>Dispatched</p>
          </div>
          <div className="space-y-1">
            <div className="w-8 h-8 rounded-full bg-[#0A3324] border border-[#8A6A16] mx-auto flex items-center justify-center text-[#F0D585]">4</div>
            <p>Delivered</p>
          </div>
        </div>
      </div>

      {/* Invoice Details Box */}
      {order && (
        <div className="p-8 rounded-3xl bg-[#0A3324] border border-[#8A6A16]/40 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-[#8A6A16]/30 pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Luxury Dispatch Invoice</h3>
              <p className="text-xs text-gray-400">Date: {order.date}</p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs text-[#F0D585] border border-[#8A6A16] px-4 py-2 rounded-full hover:bg-[#0B3D2E]"
            >
              <Printer className="w-4 h-4" /> Print / Save Invoice
            </button>
          </div>

          <div className="space-y-3">
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between items-center text-xs text-gray-200 py-2 border-b border-[#8A6A16]/20">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-semibold text-white">{item.name}</h4>
                    <p className="text-[10px] text-gray-400">Qty: {item.quantity} · {item.variant}</p>
                  </div>
                </div>
                <span className="font-serif font-bold text-[#F0D585]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-serif font-bold text-xl text-gold-gradient pt-2">
            <span>Total Paid</span>
            <span>₹{order.total?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      <div className="text-center pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-gold-gradient text-[#0A3324] px-8 py-3.5 rounded-full font-bold text-xs tracking-widest shadow-xl hover:scale-105 transition"
        >
          <span>CONTINUE SHOPPING</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
