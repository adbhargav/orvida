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
        colors: ['#154734', '#C9972B', '#F0F5F2', '#FFFFFF']
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
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 bg-[#FAF9F6]">
      
      {/* Header Banner */}
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-200 text-center space-y-4 shadow-md relative overflow-hidden">
        <div className="p-4 rounded-full bg-[#F0F5F2] border border-[#154734] w-20 h-20 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-[#154734]" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-[#154734]">Order Placed Successfully</span>
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-slate-900">
          Thank You For Choosing ORIVIDA
        </h1>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Your botanical luxury items are being prepped at our nursery atelier in Indiranagar, Bengaluru.
        </p>
        <p className="text-sm font-mono font-bold text-[#154734]">
          Order Reference: #{id || order?.orderId || 'ORI-ORD-982131'}
        </p>

        {/* Timeline Tracker */}
        <div className="pt-8 border-t border-gray-100 grid grid-cols-4 gap-2 text-center text-[10px] text-slate-600">
          <div className="space-y-1">
            <div className="w-8 h-8 rounded-full bg-[#154734] text-white font-bold mx-auto flex items-center justify-center">1</div>
            <p className="font-bold text-[#154734]">Confirmed</p>
          </div>
          <div className="space-y-1">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 mx-auto flex items-center justify-center text-slate-700">2</div>
            <p>Nursery Prep</p>
          </div>
          <div className="space-y-1">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 mx-auto flex items-center justify-center text-slate-700">3</div>
            <p>Dispatched</p>
          </div>
          <div className="space-y-1">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 mx-auto flex items-center justify-center text-slate-700">4</div>
            <p>Delivered</p>
          </div>
        </div>
      </div>

      {/* Invoice Details Box */}
      {order && (
        <div className="p-8 rounded-3xl bg-white border border-gray-200 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Luxury Dispatch Invoice</h3>
              <p className="text-xs text-slate-500">Date: {order.date}</p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs text-[#154734] border border-[#154734] px-4 py-2 rounded-full hover:bg-[#F0F5F2]"
            >
              <Printer className="w-4 h-4" /> Print / Save Invoice
            </button>
          </div>

          <div className="space-y-3">
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between items-center text-xs text-slate-700 py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.name}</h4>
                    <p className="text-[10px] text-slate-500">Qty: {item.quantity} · {item.variant}</p>
                  </div>
                </div>
                <span className="font-serif font-bold text-[#154734]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-serif font-bold text-xl text-[#154734] pt-2">
            <span>Total Paid</span>
            <span>₹{order.total?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      <div className="text-center pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#154734] hover:bg-[#0F3526] text-white px-8 py-3.5 rounded-full font-bold text-xs tracking-widest shadow-md hover:scale-105 transition"
        >
          <span>CONTINUE SHOPPING</span>
        </Link>
      </div>

    </div>
  );
}
