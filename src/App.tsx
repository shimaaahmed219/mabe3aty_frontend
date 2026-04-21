import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppSelector } from './store/hooks';
import { setUser, setLoaded, logout } from './store/slices/authSlice';
import { authApi } from './lib/api';
import { ThemeInit } from './components/ThemeInit';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { AppToaster } from './components/AppToaster';

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage').then((m) => ({ default: m.InvoicesPage })));
const AddSalePage = lazy(() => import('./pages/AddSalePage').then((m) => ({ default: m.AddSalePage })));
const NewInvoicePage = lazy(() => import('./pages/NewInvoicePage').then((m) => ({ default: m.NewInvoicePage })));
const InvoiceDetailPage = lazy(() =>
  import('./pages/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })),
);
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const SellersPage = lazy(() => import('./pages/admin/SellersPage').then((m) => ({ default: m.SellersPage })));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
);
const NearExpiryProductsPage = lazy(() =>
  import('./pages/NearExpiryProductsPage').then((m) => ({ default: m.NearExpiryProductsPage })),
);
const CustomersPage = lazy(() => import('./pages/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const CustomerDetailPage = lazy(() =>
  import('./pages/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })),
);
const CreditDuesPage = lazy(() => import('./pages/CreditDuesPage').then((m) => ({ default: m.CreditDuesPage })));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage').then((m) => ({ default: m.LoyaltyPage })));
const SalesLimitsManagePage = lazy(() =>
  import('./pages/SalesLimitsManagePage').then((m) => ({ default: m.SalesLimitsManagePage })),
);
const SellerLandingPage = lazy(() =>
  import('./pages/SellerLandingPage').then((m) => ({ default: m.SellerLandingPage })),
);
const ConversationsPage = lazy(() =>
  import('./pages/ConversationsPage').then((m) => ({ default: m.ConversationsPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="جاري التحميل">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--bidex-primary)] dark:border-slate-600 dark:border-t-sky-400"
        aria-hidden
      />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AuthLoader() {
  const dispatch = useDispatch();
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (!token) {
      dispatch(setLoaded(true));
      return;
    }
    authApi
      .user()
      .then((r) => dispatch(setUser(r.data)))
      .catch(() => dispatch(logout()))
      .finally(() => dispatch(setLoaded(true)));
  }, [token, dispatch]);

  useEffect(() => {
    const handler = () => dispatch(logout());
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [dispatch]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <ThemeInit />
      <AuthLoader />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="seller" element={<SellerLandingPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="sales/new" element={<AddSalePage />} />
            <Route path="invoices/new" element={<NewInvoicePage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="sales-limits" element={<SalesLimitsManagePage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:buyerName" element={<CustomerDetailPage />} />
            <Route path="credit-dues" element={<CreditDuesPage />} />
            <Route path="loyalty" element={<LoyaltyPage />} />
            <Route path="conversations" element={<ConversationsPage />} />
            <Route path="conversations/:id" element={<Navigate to="/conversations" replace />} />
            <Route path="conversation" element={<ConversationsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="products/near-expiry" element={<NearExpiryProductsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route
              path="admin/sellers"
              element={
                <AdminRoute>
                  <SellersPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/products"
              element={
                <AdminRoute>
                  <ProductsPage />
                </AdminRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <AppToaster />
    </QueryClientProvider>
  );
}
