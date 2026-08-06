import React, { useState } from 'react';
import { Users, Search, Crown, Mail, Phone, Calendar, ShieldCheck, Download } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Aarav Sharma', email: 'aarav@sharma.com', phone: '+91 98765 43210', role: 'VIP Society Member', orders: 12, totalSpent: '₹84,500', joined: 'Jan 2026' },
    { id: 2, name: 'Priya Verma', email: 'priya.v@gmail.com', phone: '+91 98123 45678', role: 'VIP Society Member', orders: 8, totalSpent: '₹52,100', joined: 'Feb 2026' },
    { id: 3, name: 'Vikram Malhotra', email: 'vikram.m@outlook.com', phone: '+91 97890 12345', role: 'Standard Customer', orders: 4, totalSpent: '₹24,990', joined: 'Mar 2026' },
    { id: 4, name: 'Ananya Roy', email: 'ananya@roy.in', phone: '+91 96543 21098', role: 'VIP Society Member', orders: 15, totalSpent: '₹1,12,000', joined: 'Nov 2025' },
    { id: 5, name: 'Rohan Gupta', email: 'rohan.g@yahoo.com', phone: '+91 95432 10987', role: 'Standard Customer', orders: 2, totalSpent: '₹14,980', joined: 'May 2026' },
  ]);

  const [search, setSearch] = useState('');

  const handleExportUsersCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Orders', 'Total Spent', 'Joined Date'];
    const rows = users.map(u => [u.id, `"${u.name}"`, `"${u.email}"`, `"${u.phone}"`, `"${u.role}"`, u.orders, `"${u.totalSpent}"`, `"${u.joined}"`]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ORIVIDA_VIP_Users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 sm:p-8 bg-[#FAF9F6] min-h-screen">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#154734]">ORIVIDA Private Society</span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-1">Users & VIP Customers</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportUsersCSV}
            className="bg-white hover:bg-gray-100 border border-gray-300 text-[#154734] px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> EXPORT MEMBERS (CSV)
          </button>

          <div className="flex items-center gap-2 bg-[#E8F2EC] text-[#154734] px-4 py-2 rounded-full border border-[#154734]/20 text-xs font-bold">
            <Crown className="w-4 h-4 text-[#F0D585]" />
            <span>1,420 Active Registered Members</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md w-full">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-full border border-gray-200 text-xs text-slate-800 focus:outline-none focus:border-[#154734] bg-white shadow-sm"
        />
      </div>

      {/* User Roster Table with Scroll Container & Sticky Header */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs relative">
            <thead className="bg-gray-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-4 px-4 bg-gray-50">Member Name</th>
                <th className="py-4 px-4 bg-gray-50">Email</th>
                <th className="py-4 px-4 bg-gray-50">Phone</th>
                <th className="py-4 px-4 bg-gray-50">Society Status</th>
                <th className="py-4 px-4 bg-gray-50">Orders</th>
                <th className="py-4 px-4 bg-gray-50">Lifetime Value</th>
                <th className="py-4 px-4 bg-gray-50">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#154734] text-white flex items-center justify-center font-bold text-[10px]">
                      {u.name.charAt(0)}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3.5 px-4 text-slate-600">{u.phone}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                      u.role.includes('VIP') ? 'bg-[#E8F2EC] text-[#154734] border border-[#154734]/30' : 'bg-gray-100 text-slate-700'
                    }`}>
                      {u.role.includes('VIP') && <Crown className="w-3 h-3 text-[#154734]" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{u.orders} orders</td>
                  <td className="py-3.5 px-4 font-serif font-bold text-[#154734] text-sm">{u.totalSpent}</td>
                  <td className="py-3.5 px-4 text-slate-400">{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
