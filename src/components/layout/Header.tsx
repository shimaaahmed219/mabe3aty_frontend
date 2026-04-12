import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { BrandWordmark } from '@/components/BrandWordmark';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleTheme } from '@/store/slices/themeSlice';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useLogout } from '@/hooks/useLogout';
import { HeaderNotificationsMenu } from '@/components/layout/HeaderNotificationsMenu';
import { isSellerRole, SELLER_HOME_PATH } from '@/lib/sellerAccess';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const dispatch = useAppDispatch();
  const doLogout = useLogout();
  const user = useAppSelector((s) => s.auth.user);
  const mode = useAppSelector((s) => s.theme.mode);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openLogoutConfirm = () => {
    setMenuOpen(false);
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    void doLogout();
  };

  return (
    <header
      className="fixed top-0 z-40 border-b shadow-sm transition-shadow duration-300 hover:shadow-md"
      style={{
        left: 0,
        right: 0,
        width: '100%',
        minWidth: '100%',
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="mx-auto flex h-12 max-w-[1700px] items-center justify-between gap-2 px-3 sm:h-14 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-sky-500/15 hover:text-sky-800 motion-reduce:hover:scale-100 dark:hover:bg-sky-400/20 dark:hover:text-sky-200"
          style={{ color: 'var(--foreground)' }}
          aria-label="فتح القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link
          to={isSellerRole(user?.role) ? SELLER_HOME_PATH : '/'}
          aria-label={isSellerRole(user?.role) ? 'مبيعاتي — إضافة عملية بيع' : 'مبيعاتي — لوحة التحكم'}
          className="flex items-center gap-2 min-w-0 rounded-lg border border-transparent px-1 py-0.5 no-underline transition-all duration-200 hover:scale-[1.02] hover:border-sky-400/45 hover:bg-sky-500/10 motion-reduce:hover:scale-100 dark:hover:border-sky-400/35 dark:hover:bg-sky-400/10"
        >
          <BrandWordmark variant="header" />
        </Link>
        <div className="flex-1 min-w-0" />
        {!isSellerRole(user?.role) && (
          <HeaderNotificationsMenu
            open={notifOpen}
            onToggle={() => {
              setMenuOpen(false);
              setNotifOpen((o) => !o);
            }}
            onClose={() => setNotifOpen(false)}
          />
        )}
        <button
          type="button"
          onClick={() => {
            setNotifOpen(false);
            dispatch(toggleTheme());
          }}
          className="p-2 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-amber-500/15 hover:text-amber-700 motion-reduce:hover:scale-100 dark:hover:bg-amber-400/15 dark:hover:text-amber-200"
          style={{ color: 'var(--foreground)' }}
          aria-label="تبديل الوضع"
        >
          {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen(false);
              setMenuOpen((o) => !o);
            }}
            className="p-1.5 rounded-full text-white min-w-[40px] min-h-[40px] flex items-center justify-center transition-all duration-200 hover:scale-105 hover:brightness-110 hover:ring-2 hover:ring-sky-400/70 hover:ring-offset-2 hover:ring-offset-[var(--card-bg)] motion-reduce:hover:scale-100"
            style={{ background: 'var(--bidex-primary)' }}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <span className="text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-full mt-1 py-1 w-56 rounded-xl border shadow-lg z-50" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{user?.name}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={openLogoutConfirm}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-all duration-200 hover:bg-red-500/12 hover:ps-1 hover:text-red-700 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                style={{ color: 'var(--foreground)' }}
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </div>
          )}
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
    </header>
  );
}
