import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppSelector } from '@/store/hooks';
import { isSellerRole, isPathAllowedForSeller, SELLER_HOME_PATH } from '@/lib/sellerAccess';

function SellerOutletGuard() {
  const user = useAppSelector((s) => s.auth.user);
  const { pathname } = useLocation();

  if (isSellerRole(user?.role)) {
    if (pathname === '/') {
      return <Navigate to={SELLER_HOME_PATH} replace />;
    }
    if (!isPathAllowedForSeller(pathname)) {
      return <Navigate to={SELLER_HOME_PATH} replace />;
    }
  }

  return <Outlet />;
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="w-full min-h-screen bg-[var(--background)] pb-16 md:pb-6">
        <div className="max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-6 py-3 sm:py-4 mt-14 md:mt-16">
          <div className="flex gap-3 sm:gap-4">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 min-w-0 bg-[var(--background)]">
              <div className="px-0 sm:px-4 lg:px-6 xl:px-8 py-1 sm:py-3 lg:py-4 max-w-[1600px] mx-auto">
                <div className="bg-card rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:shadow-[0_18px_45px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-card px-3 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-6 lg:py-7">
                  <SellerOutletGuard />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
