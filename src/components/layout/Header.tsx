import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleTheme } from '@/store/slices/themeSlice';
import { logout } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const mode = useAppSelector((s) => s.theme.mode);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await authApi.logout();
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <header
      className="fixed top-0 z-40 border-b shadow-sm"
      style={{
        left: 0,
        right: 0,
        width: '100%',
        minWidth: '100%',
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="flex items-center justify-between h-12 sm:h-14 px-2 sm:px-4 gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          style={{ color: 'var(--foreground)' }}
          aria-label="فتح القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 min-w-0 no-underline">
          {/* <img src="/logo.png" alt="مبيعاتي" className="h-[50px] rounded-full sm:h-9 w-auto object-contain shrink-0" /> */}
          <h1 className="text-lg sm:text-xl font-bold truncate hidden sm:block">
            <span className="bg-clip-text text-transparent tracking-tight bidex-gradient">
              مبيعاتي
            </span>
          </h1>
        </Link>
        <div className="flex-1 min-w-0" />
        <button
          type="button"
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          style={{ color: 'var(--foreground)' }}
          aria-label="تبديل الوضع"
        >
          {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 rounded-full text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
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
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                style={{ color: 'var(--foreground)' }}
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
