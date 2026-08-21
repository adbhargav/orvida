import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, Layers, CreditCard, Users,
  Image as ImageIcon, Tag, Ticket, ShoppingBag, LogOut, Store,
  MessageSquare, Mail, FileText, Search, ChevronDown, Globe, SlidersHorizontal,
  PenSquare,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

// Counts are intentionally absent: the sidebar previously showed fixed
// numbers ("28 products", "1,420 users") that never matched the database.
const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'users', label: 'Customers', icon: Users },
  { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
  { id: 'banners', label: 'Banners', icon: ImageIcon },
  { id: 'content', label: 'Site Content', icon: FileText },
  { id: 'blog', label: 'Blog', icon: PenSquare },
  // SEO is a group: one dashboard, the landing-page library, and the global
  // settings that every page falls back to.
  {
    id: 'seo-group',
    label: 'SEO Management',
    icon: Search,
    children: [
      { id: 'seo', label: 'SEO Dashboard', icon: LayoutDashboard },
      { id: 'seo-pages', label: 'Landing Pages', icon: Globe },
      { id: 'seo-settings', label: 'SEO Settings', icon: SlidersHorizontal },
    ],
  },
  { id: 'offers', label: 'Offers', icon: Tag },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
];

export default function AdminSidebar({ activeTab, setActiveTab, user, onLogout }) {
  // The SEO group opens whenever one of its pages is active, so the current
  // location is always visible without hunting.
  const seoIds = ['seo', 'seo-pages', 'seo-settings'];
  const [openGroup, setOpenGroup] = React.useState(seoIds.includes(activeTab));

  React.useEffect(() => {
    if (seoIds.includes(activeTab)) setOpenGroup(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <aside className="w-64 bg-emerald-darker text-white flex flex-col justify-between h-screen border-r border-emerald-deep shrink-0">
      <div className="min-h-0 flex flex-col">
        <div className="p-6 border-b border-emerald-deep flex items-center gap-3">
          <img src={logoImg} alt="" className="h-9 w-auto object-contain brightness-0 invert" />
          <div>
            <span className="type-eyebrow text-gold-mid block">Atelier</span>
            <h2 className="type-heading text-base text-white">Admin Portal</h2>
          </div>
        </div>

        <div className="mx-4 my-4 p-3.5 rounded-md bg-emerald-deep border border-emerald-default flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-default text-gold-light flex items-center justify-center text-sm font-medium shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Administrator'}</p>
            <p className="text-xs text-emerald-light/70 truncate">{user?.email}</p>
          </div>
        </div>

        <nav className="px-3 space-y-0.5 overflow-y-auto scrollbar-none">
          {MENU_ITEMS.map(({ id, label, icon: Icon, children }) => {
            if (children) {
              const groupActive = children.some((c) => c.id === activeTab);
              return (
                <div key={id}>
                  <button
                    onClick={() => setOpenGroup((o) => !o)}
                    aria-expanded={openGroup}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm transition ${
                      groupActive && !openGroup
                        ? 'bg-emerald-default text-white font-medium'
                        : 'text-emerald-light/75 hover:bg-emerald-deep hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${groupActive ? 'text-gold-light' : ''}`} />
                    <span className="flex-1 text-left">{label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openGroup ? 'rotate-180' : ''}`} />
                  </button>

                  {openGroup && (
                    <div className="mt-1 ml-3.5 pl-3 border-l border-emerald-deep space-y-1">
                      {children.map(({ id: childId, label: childLabel, icon: ChildIcon }) => {
                        const isActive = activeTab === childId;
                        return (
                          <button
                            key={childId}
                            onClick={() => setActiveTab(childId)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition ${
                              isActive
                                ? 'bg-emerald-default text-white font-medium'
                                : 'text-emerald-light/70 hover:bg-emerald-deep hover:text-white'
                            }`}
                          >
                            <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-gold-light' : ''}`} />
                            <span>{childLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm transition ${
                  isActive
                    ? 'bg-emerald-default text-white font-medium'
                    : 'text-emerald-light/75 hover:bg-emerald-deep hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gold-light' : ''}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-emerald-deep space-y-2">
        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-emerald-default text-emerald-light/85 text-sm hover:bg-emerald-deep hover:text-white transition"
        >
          <Store className="w-4 h-4" />
          <span>View storefront</span>
        </Link>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-rose-300 text-sm hover:bg-rose-950/50 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
