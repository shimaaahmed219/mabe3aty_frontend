import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loaded } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-slate-600 dark:text-slate-400">جاري التحميل...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
