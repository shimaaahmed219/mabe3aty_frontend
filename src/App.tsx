import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppSelector } from './store/hooks';
import { setUser, setLoaded, logout } from './store/slices/authSlice';
import { authApi } from './lib/api';
import { ThemeInit } from './components/ThemeInit';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { AddSalePage } from './pages/AddSalePage';
import { NewInvoicePage } from './pages/NewInvoicePage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SellersPage } from './pages/admin/SellersPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { NearExpiryProductsPage } from './pages/NearExpiryProductsPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { CreditDuesPage } from './pages/CreditDuesPage';
import { LoyaltyPage } from './pages/LoyaltyPage';
import { ConversationsPage } from './pages/ConversationsPage';

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
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="sales/new" element={<AddSalePage />} />
            <Route path="invoices/new" element={<NewInvoicePage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="reports" element={<ReportsPage />} />
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
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
