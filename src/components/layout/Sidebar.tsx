import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  BarChart2,
  Package,
  Users,
  Bell,
  Wallet,
  BadgePercent,
  MessageCircle,
  Settings,
  ChevronRight,
  CalendarClock,
  LogOut,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAppSelector } from '@/store/hooks';
import { useLogout } from '@/hooks/useLogout';

const menuItems = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/sales/new', label: 'إضافة عملية بيع', icon: ShoppingCart, isNew: true },
  { to: '/invoices', label: 'المبيعات', icon: Receipt },
  { to: '/products', label: 'إدخال المنتجات', icon: Package },
  { to: '/products/near-expiry', label: 'قرب انتهاء الصلاحية', icon: CalendarClock },
  { to: '/reports', label: 'التقارير', icon: BarChart2 },
  { to: '/credit-dues', label: 'الديون والتحصيل', icon: Wallet },
  { to: '/loyalty', label: 'نقاط العملاء', icon: BadgePercent },
  { to: '/customers', label: 'العملاء', icon: Users },
  { to: '/conversations', label: 'واتساب العملاء', icon: MessageCircle },
  { to: '/notifications', label: 'الإشعارات', icon: Bell, badge: 0 },
];

const adminItems = [
  { to: '/admin/sellers', label: 'البائعون', icon: Users },
  { to: '/admin/products', label: 'إدارة المنتجات', icon: Package },
];

const sections = [
  { title: 'الرئيسية', keys: ['/'] },
  { title: 'المبيعات', keys: ['/sales/new', '/invoices', '/products', '/products/near-expiry'] },
  { title: 'التحليلات', keys: ['/reports', '/credit-dues', '/loyalty', '/customers'] },
  { title: 'الدعم', keys: ['/conversations', '/notifications'] },
] as const;

const sidebarContentClass =
  'h-full flex flex-col bg-card border border-card rounded-2xl shadow-[0_12px_35px_rgba(15,23,42,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)]';

function SidebarContent({ showCloseButton, onClose }: { showCloseButton: boolean; onClose: () => void }) {
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = useAppSelector((s) => s.auth.user?.role) === 'admin';
  const doLogout = useLogout();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const requestLogout = () => {
    onClose();
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    void doLogout();
  };

  const linkClass = (selected: boolean) =>
    `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl mb-1 text-sm transition-colors ${
      selected
        ? 'bg-[color:color-mix(in_srgb,var(--bidex-primary)_12%,transparent)] text-bidex-primary font-semibold'
        : 'text-muted hover:bg-muted-bg'
    }`;

  const itemsBySection = sections.map((section) => ({
    ...section,
    items: menuItems.filter((item) => (section.keys as readonly string[]).includes(item.to)),
  }));

  return (
    <>
    <div className={sidebarContentClass}>
      {showCloseButton && (
        <div className="flex justify-end border-b border-card px-2 py-2">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted-bg"
            style={{ color: 'var(--foreground)' }}
            aria-label="إغلاق القائمة"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      <nav className="flex-1 px-3 py-3 overflow-auto">
        {itemsBySection.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-3 py-2 text-[11px] font-semibold text-muted uppercase tracking-wider">{section.title}</p>
            {section.items.map(({ to, label, icon: Icon, badge, isNew }) => {
              const selected = location.pathname === to || (to === '/' && location.pathname === '/');
              return (
                <Link key={to} to={to} onClick={onClose} className={linkClass(selected)}>
                  <Icon className="w-5 h-5 shrink-0" style={{ color: selected ? 'var(--bidex-primary)' : 'var(--muted)' }} />
                  <span className="flex-1 truncate">{label}</span>
                  {badge != null && badge > 0 && (
                    <span className="min-w-[20px] h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1">
                      {badge}
                    </span>
                  )}
                  {isNew && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bidex-primary)] text-white">جديد</span>}
                </Link>
              );
            })}
          </div>
        ))}
        {isAdmin &&
          adminItems.map(({ to, label, icon: Icon }) => {
            const selected = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={onClose} className={linkClass(selected)}>
                <Icon className="w-5 h-5 shrink-0" style={{ color: selected ? 'var(--bidex-primary)' : 'var(--muted)' }} />
                <span>{label}</span>
              </Link>
            );
          })}
      </nav>
      <div className="p-3 border-t border-card flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold overflow-hidden border border-card text-[var(--foreground)]">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{user?.name || 'مستخدم'}</p>
          <p className="text-xs text-muted truncate">{user?.email || ''}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link to="/settings" onClick={onClose} className="p-2 rounded-lg bg-muted border border-card text-[var(--foreground)]" aria-label="الإعدادات">
            <Settings className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={requestLogout}
            className="p-2 rounded-lg bg-muted border border-card text-red-600 dark:text-red-400 hover:opacity-90"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    <ConfirmDialog
      open={logoutConfirmOpen}
      title="تأكيد تسجيل الخروج"
      description="هل تريد تسجيل الخروج؟ ستحتاج لتسجيل الدخول مرة أخرى للوصول إلى حسابك."
      confirmLabel="تسجيل الخروج"
      cancelLabel="إلغاء"
      danger
      onConfirm={confirmLogout}
      onCancel={() => setLogoutConfirmOpen(false)}
    />
    </>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div className="md:hidden fixed inset-0 z-40">
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
          aria-hidden
        />
        <div className={`absolute top-12 right-0 h-[calc(100vh-3rem)] w-[280px] max-w-[90vw] p-2 transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <SidebarContent showCloseButton onClose={onClose} />
        </div>
      </div>

      <aside className="hidden lg:flex w-[240px] flex-shrink-0">
        <div className="w-full h-full">
          <SidebarContent showCloseButton={false} onClose={onClose} />
        </div>
      </aside>
    </>
  );
}
