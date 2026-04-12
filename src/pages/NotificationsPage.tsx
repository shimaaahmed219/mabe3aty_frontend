import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { hoverSurfaceBidex, interactiveSubCard, textAccentBidex } from '@/lib/theme';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then((r) => r.data),
  });
  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const notifications = data?.data ?? [];

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
            <div className="flex flex-col gap-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 ${interactiveSubCard} ${n.read_at ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                      {n.message && <p className="text-sm text-slate-500 dark:text-slate-400">{n.message}</p>}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{n.created_at}</p>
                    </div>
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
