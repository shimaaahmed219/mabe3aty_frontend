import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { notificationsApi } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { hoverSurfaceBidex, interactiveSubCard, textAccentBidex } from '@/lib/theme';
import { resolveNotificationTarget } from '@/lib/notificationTarget';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then((r) => r.data),
  });
  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'header-popover'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    },
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'header-popover'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    },
  });
  const notifications = data?.data ?? [];
  const unreadCount = data?.unread_count ?? notifications.filter((n) => !n.read_at).length;

  return (
    <PageWrapper>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">الإشعارات</h1>
      <div className={pageCardShell}>
        <div className={`p-5 ${pageCardInner}`}>
          {isLoading ? (
            <p className="text-slate-500 dark:text-slate-400">جاري التحميل...</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-500 dark:text-slate-400">
              <Bell className="w-12 h-12 mb-2 opacity-60" />
              <p>لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg border border-card bg-muted px-3 py-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">غير المقروء: {unreadCount}</p>
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={unreadCount === 0 || markAllRead.isPending}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${textAccentBidex} ${hoverSurfaceBidex}`}
                >
                  تعليم الكل كمقروء
                </button>
              </div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 ${interactiveSubCard} ${n.read_at ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <Link
                      to={resolveNotificationTarget(n)}
                      onClick={() => {
                        if (!n.read_at) markRead.mutate(n.id);
                      }}
                      className="block min-w-0 flex-1"
                    >
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                      {n.message && <p className="text-sm text-slate-500 dark:text-slate-400">{n.message}</p>}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{n.created_at}</p>
                    </Link>
                    {!n.read_at && (
                      <button type="button" onClick={() => markRead.mutate(n.id)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${textAccentBidex} ${hoverSurfaceBidex}`}>
                        تعليم كمقروء
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
