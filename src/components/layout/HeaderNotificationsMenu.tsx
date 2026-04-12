import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';

type Props = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
};

export function HeaderNotificationsMenu({ open, onToggle, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'header-popover'],
    queryFn: async () => {
      const { data: body } = await notificationsApi.list({ page: 1, per_page: 5 });
      return body;
    },
    staleTime: 30_000,
  });

  const items = data?.data ?? [];
  const unreadCount = data?.unread_count ?? 0;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  const formatWhen = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ar-EG', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        numberingSystem: 'latn',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className="relative rounded-lg p-2 transition-all duration-200 hover:scale-105 hover:bg-violet-500/12 hover:text-violet-800 motion-reduce:hover:scale-100 dark:hover:bg-violet-400/15 dark:hover:text-violet-200"
        style={{ color: 'var(--foreground)' }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute top-0.5 end-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className="absolute end-0 top-full z-50 mt-1 flex max-h-[min(420px,70vh)] w-[min(100vw-1.5rem,20rem)] flex-col overflow-hidden rounded-xl border shadow-lg sm:w-80"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          role="dialog"
          aria-label="آخر الإشعارات"
        >
          <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--card-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              الإشعارات
            </p>
            {unreadCount > 0 ? (
              <p className="text-xs text-muted">{unreadCount} غير مقروء</p>
            ) : (
              <p className="text-xs text-muted">لا يوجد غير مقروء</p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="px-3 py-6 text-center text-sm text-muted">جاري التحميل…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted">لا توجد إشعارات</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                {items.map((n) => (
                  <li key={n.id}>
                    <div
                      className={`px-3 py-2.5 text-start ${n.read_at ? '' : 'bg-muted-bg/80'}`}
                      style={{ color: 'var(--foreground)' }}
                    >
                      <p className="text-sm font-medium leading-snug line-clamp-2">{n.title}</p>
                      {n.message ? (
                        <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.message}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-muted">{formatWhen(n.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t p-2" style={{ borderColor: 'var(--card-border)' }}>
            <Link
              to="/notifications"
              onClick={onClose}
              className="block rounded-lg py-2.5 text-center text-sm font-semibold text-[var(--bidex-primary)] transition-all duration-200 hover:bg-sky-500/12 hover:text-sky-800 dark:text-sky-400 dark:hover:bg-sky-400/15 dark:hover:text-sky-100"
            >
              عرض صفحة الإشعارات
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
