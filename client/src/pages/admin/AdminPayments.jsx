import React, { useState } from 'react';
import { CreditCard, DollarSign, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, Search, Download } from 'lucide-react';

export default function AdminPayments() {
  const transactions = [
    { id: 'PAY-90412', orderId: 'ORD-9821', customer: 'Aarav Sharma', amount: '₹14,998', method: 'UPI (GPay)', status: 'Success', date: '2026-08-06 15:34' },
    { id: 'PAY-90411', orderId: 'ORD-9820', customer: 'Priya Verma', amount: '₹18,500', method: 'Credit Card (HDFC)', status: 'Success', date: '2026-08-06 15:10' },
    { id: 'PAY-90410', orderId: 'ORD-9819', customer: 'Vikram Malhotra', amount: '₹12,499', method: 'Net Banking (ICICI)', status: 'Success', date: '2026-08-06 14:45' },
    { id: 'PAY-90409', orderId: 'ORD-9818', customer: 'Ananya Roy', amount: '₹4,497', method: 'UPI (PhonePe)', status: 'Success', date: '2026-08-06 12:30' },
    { id: 'PAY-90408', orderId: 'ORD-9817', customer: 'Rohan Gupta', amount: '₹8,990', method: 'Debit Card (SBI)', status: 'Refunded', date: '2026-08-05 18:20' },
  ];

  const handleExportPaymentsCSV = () => {
    const headers = ['Transaction ID', 'Order ID', 'Customer', 'Amount', 'Payment Method', 'Status', 'Date'];
    const rows = transactions.map(t => [t.id, t.orderId, `"${t.customer}"`, `"${t.amount}"`, `"${t.method}"`, t.status, `"${t.date}"`]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ORIVIDA_Payments_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 p-6 sm:p-8 bg-[#FAF9F6] min-h-screen">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">Financial Ledger & Gateways</span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-1">Payments & Transactions</h1>
        </div>

        <button
          onClick={handleExportPaymentsCSV}
          className="bg-white hover:bg-gray-100 border border-gray-300 text-[#154734] px-6 py-3 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition"
        >
          <Download className="w-4 h-4" /> EXPORT PAYMENTS (CSV)
        </button>
      </div>

      {/* Gateway Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>RAZORPAY GATEWAY</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-serif font-extrabold text-2xl text-[#154734]">₹11,40,200</p>
          <p className="text-xs text-slate-500 font-medium">99.8% Gateway Health</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>STRIPE VIP PAYOUTS</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-serif font-extrabold text-2xl text-slate-900">₹3,42,700</p>
          <p className="text-xs text-slate-500 font-medium">Next Payout: Tomorrow 09:00 AM</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>REFUNDS PROCESSED</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="font-serif font-extrabold text-2xl text-rose-700">₹8,990</p>
          <p className="text-xs text-slate-500 font-medium">1 Return requested under 7-day guarantee</p>
        </div>
      </div>

      {/* Transaction Log Table with Scroll Container & Sticky Header */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
        <h3 className="font-display font-bold text-base text-slate-900">Payment Gateway Audit Ledger</h3>

        <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs relative">
            <thead className="bg-gray-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-3.5 px-4 bg-gray-50">Transaction ID</th>
                <th className="py-3.5 px-4 bg-gray-50">Order ID</th>
                <th className="py-3.5 px-4 bg-gray-50">Customer</th>
                <th className="py-3.5 px-4 bg-gray-50">Payment Method</th>
                <th className="py-3.5 px-4 bg-gray-50">Amount</th>
                <th className="py-3.5 px-4 bg-gray-50">Status</th>
                <th className="py-3.5 px-4 bg-gray-50">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{tx.id}</td>
                  <td className="py-3.5 px-4 font-bold text-[#154734]">{tx.orderId}</td>
                  <td className="py-3.5 px-4 text-slate-800 font-bold">{tx.customer}</td>
                  <td className="py-3.5 px-4 text-slate-600">{tx.method}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{tx.amount}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      tx.status === 'Success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
