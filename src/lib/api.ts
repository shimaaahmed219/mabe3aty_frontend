import axios, { isAxiosError } from 'axios';

/** في التطوير يُفضّل `/api` ليمر الطلب عبر proxy في Vite (نفس المنفذ 5173) ويتجنب CORS. الباكند يجب أن يعمل: `php artisan serve` على 8000. */
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:8000/api');

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(e);
  }
);

/** رسالة خطأ للمستخدم: شبكة / استجابة Laravel / احتياطي */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) return fallback;
  if (!err.response) {
    return 'تعذّر الاتصال بالخادم. شغّل الباكند من مجلد backend: php artisan serve (المنفذ 8000) ثم أعد المحاولة.';
  }
  const data = err.response.data as { message?: string; errors?: Record<string, string[]> } | undefined;
  if (data?.message) return data.message;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return fallback;
}

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post<{ user: User; token: string }>('/login', { email, password }),
  register: (data: { name: string; email: string; password: string; password_confirmation: string; role?: string }) =>
    api.post<{ user: User; token: string }>('/register', data),
  logout: () => api.post('/logout'),
  user: () => api.get<User>('/user'),
  forgotPassword: (email: string) => api.post('/forgot-password', { email }),
  resetPassword: (data: { email: string; token: string; password: string; password_confirmation: string }) =>
    api.post('/reset-password', data),
};

export const dashboardApi = {
  full: () => api.get<DashboardPayload>('/dashboard'),
};

// Invoices
export const invoicesApi = {
  list: (params?: {
    from?: string;
    to?: string;
    product_id?: number;
    buyer_name?: string;
    buyer_phone?: string;
    buyer_address?: string;
    page?: number;
    per_page?: number;
  }) => api.get<Paginated<Invoice>>('/invoices', { params }),
  get: (id: number) => api.get<Invoice>(`/invoices/${id}`),
  create: (data: CreateInvoiceInput) => api.post<Invoice>('/invoices', data),
  update: (id: number, data: { sale_date?: string; notes?: string }) => api.put(`/invoices/${id}`, data),
  delete: (id: number) => api.delete(`/invoices/${id}`),
  addItem: (invoiceId: number, item: { product_id?: number; description: string; quantity: number; unit_price: number }) =>
    api.post(`/invoices/${invoiceId}/items`, item),
  removeItem: (invoiceId: number, itemId: number) => api.delete(`/invoices/${invoiceId}/items/${itemId}`),
  addPayment: (invoiceId: number, data: { amount: number; method?: string; reference?: string; notes?: string; paid_at?: string }) =>
    api.post(`/invoices/${invoiceId}/payments`, data),
};

// Admin
export const adminApi = {
  dashboard: () => api.get<AdminDashboard>('/admin/dashboard'),
  sellers: () => api.get<User[]>('/admin/sellers'),
  createSeller: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/admin/sellers', data),
  salesReport: (params?: { from?: string; to?: string }) => api.get<SalesReport>('/admin/sales-report', { params }),
};

// Targets
export const targetsApi = {
  list: (params?: { user_id?: number }) => api.get<Target[]>('/targets', { params }),
  create: (data: Partial<Target>) => api.post<Target>('/targets', data),
  update: (id: number, data: Partial<Target>) => api.put(`/targets/${id}`, data),
  delete: (id: number) => api.delete(`/targets/${id}`),
};

// Notifications
export const notificationsApi = {
  list: (params?: { page?: number }) => api.get<Paginated<AppNotification>>('/notifications', { params }),
  markRead: (id: number) => api.post(`/notifications/${id}/read`),
};

// Products
export const productsApi = {
  list: () => api.get<Product[]>('/products'),
  lowStock: (params?: { threshold?: number }) => api.get<{ threshold: number; count: number; data: Product[] }>('/products-low-stock', { params }),
  byCode: (code: string) => api.get<Product>(`/products-by-code/${encodeURIComponent(code)}`),
  get: (id: number) => api.get<Product>(`/products/${id}`),
  stats: (id: number, params?: { from?: string; to?: string }) =>
    api.get<ProductStatsPayload>(`/products/${id}/stats`, { params }),
  create: (data: ProductWriteInput) => api.post<Product>('/products', data),
  update: (id: number, data: ProductUpdatePayload) => api.put<Product>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  nearExpiry: (params?: { months?: number }) =>
    api.get<{ within_months: number; count: number; data: NearExpiryBatchRow[] }>('/products-near-expiry', { params }),
  listBatches: (productId: number) =>
    api.get<{ data: ProductStockBatch[] }>(`/products/${productId}/batches`),
  addBatch: (productId: number, data: ProductBatchWriteInput) =>
    api.post<Product>(`/products/${productId}/batches`, data),
};

// Reports
export const reportsApi = {
  daily: (params?: { date?: string }) => api.get<{ date: string; total_sales: number; operations_count: number }>('/reports/daily', { params }),
  monthly: (params?: { year?: number; month?: number }) =>
    api.get<{ year: number; month: number; total_sales: number; operations_count: number }>('/reports/monthly', { params }),
  profits: (params?: { from?: string; to?: string }) =>
    api.get<{ from: string; to: string; total_profits: number }>('/reports/profits', { params }),
  bestSellingProduct: (params?: { from?: string; to?: string }) =>
    api.get<BestSellingProductReport>('/reports/best-selling-product', { params }),
  chartDaily: (params?: { days?: number }) =>
    api.get<{ date: string; total: number; count: number }[]>('/reports/chart-daily', { params }),
  smartInsights: (params?: { from?: string; to?: string }) =>
    api.get<SmartInsights>('/reports/smart-insights', { params }),
  loyaltySummary: () => api.get<LoyaltySummaryItem[]>('/reports/loyalty-summary'),
  creditDues: () => api.get<CreditDueItem[]>('/reports/credit-dues'),
  invoiceStatus: (params?: { from?: string; to?: string }) =>
    api.get<InvoiceStatusReport>('/reports/invoice-status', { params }),
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'seller';
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_revenue: number;
  total_invoices: number;
  paid_invoices: number;
  average_invoice: number;
  available_balance: number;
  escrow_balance: number;
  activity_percent: number;
  rank_title: string;
}

export interface DashboardKpi {
  label: string;
  value: number;
  sub?: string;
}

/** من بداية الأسبوع (السبت) حتى اليوم — حسب نطاق المستخدم. */
export interface DashboardWeeklyRevenue {
  total: number;
  week_start: string;
  week_end: string;
}

export interface DashboardPayload {
  summary: DashboardSummary;
  admin_kpis: DashboardKpi[] | null;
  /** للأدمن فقط: مخزون منتهٍ بحسب تاريخ الصلاحية وتكلفة الشراء */
  expired_inventory: {
    products_count: number;
    /** عدد الدفعات المنتهية (قد يتعدد لنفس المنتج) */
    batches_count?: number;
    estimated_cost_at_purchase: number;
  } | null;
  weekly_revenue: DashboardWeeklyRevenue;
  monthly_revenue_chart: { month_key: string; month_label: string; total: number }[];
  invoice_status: { pending: number; partial: number; paid: number; total: number };
  sales_trend_14d: { date: string; total: number }[];
  total_credit_remaining: number;
  low_stock: { threshold: number; count: number };
  /** منتجات بمخزون وصلاحية تنتهي خلال N شهرًا (لم تنتهِ بعد) */
  near_expiry_products: { count: number; within_months: number };
  loyalty_highlight: { buyer_name: string; available_points: number } | null;
  insights: {
    from: string;
    to: string;
    best_sales_hour: { hour: string; total_sales: number; invoices_count: number } | null;
    top_customer: {
      buyer_name?: string | null;
      buyer_phone?: string | null;
      total_sales: number;
      invoices_count: number;
    } | null;
  };
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id?: number | null;
  description: string;
  sale_type?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  discount_amount?: number;
  product?: Product;
}

/** دفعة مخزون (تاريخ إنتاج/انتهاء مختلف) */
export interface ProductStockBatch {
  id: number;
  quantity: number;
  production_date?: string | null;
  expiry_date?: string | null;
  shelf_life_value?: number | null;
  shelf_life_unit?: 'days' | 'months' | 'years' | null;
  notes?: string | null;
  purchase_price?: number | null;
}

export interface ProductBatchWriteInput {
  quantity: number;
  production_date?: string;
  shelf_life_value?: number | null;
  shelf_life_unit?: 'days' | 'months' | 'years' | null;
  expiry_date?: string;
  purchase_price?: number;
  notes?: string;
}

/** صف في قائمة «قرب انتهاء الصلاحية» — لكل دفعة */
export interface NearExpiryBatchRow {
  batch_id: number;
  quantity: number;
  production_date?: string | null;
  expiry_date?: string | null;
  days_to_expiry: number;
  product: Product;
}

export interface Product {
  id: number;
  code: string | null;
  name: string;
  category?: string | null;
  stock_quantity?: number | null;
  /** سعر البيع المرجعي (السعر الأصلي للعميل) */
  default_price: number | null;
  /** تكلفة الشراء — لا يُعاد للبائع من الـ API */
  purchase_price?: number | null;
  production_date?: string | null;
  shelf_life_days?: number | null;
  shelf_life_value?: number | null;
  shelf_life_unit?: 'days' | 'months' | 'years' | null;
  expiry_date?: string | null;
  created_at: string;
  updated_at: string;
  /** محسوب من الفواتير (حسب دور المستخدم) */
  quantity_sold?: number;
  /** هامش الربح للوحدة = default_price − purchase_price (أدمن فقط) */
  unit_profit?: number | null;
  profit_on_sold_estimate?: number | null;
  is_expired?: boolean;
  /** سالب إذا انتهت الصلاحية */
  days_to_expiry?: number | null;
  expired_stock_cost_estimate?: number | null;
  /** يُعاد مع تفاصيل المنتج / الإحصائيات */
  stock_batches?: ProductStockBatch[];
}

export interface ProductWriteInput {
  code: string;
  name: string;
  category?: string;
  default_price?: number;
  purchase_price?: number;
  stock_quantity?: number;
  production_date?: string;
  shelf_life_days?: number | null;
  shelf_life_value?: number | null;
  shelf_life_unit?: 'days' | 'months' | 'years' | null;
  expiry_date?: string;
}

/** تحديث المنتج — يُسمح بـ null لمسح التواريخ أو التكلفة في الخادم */
export type ProductUpdatePayload = Partial<
  Pick<ProductWriteInput, 'code' | 'name' | 'category' | 'default_price' | 'stock_quantity'>
> & {
  purchase_price?: number | null;
  production_date?: string | null;
  shelf_life_days?: number | null;
  shelf_life_value?: number | null;
  shelf_life_unit?: 'days' | 'months' | 'years' | null;
  expiry_date?: string | null;
};

export interface ProductStatsPayload {
  product: Product;
  period: { from: string; to: string };
  summary: {
    total_revenue: number;
    total_quantity: number;
    lines_count: number;
    invoices_count: number;
    share_of_revenue_percent: number;
    all_products_revenue_in_period: number;
  };
  trend: {
    compare_days: number;
    recent_revenue: number;
    previous_revenue: number;
    change_percent: number;
    direction: 'up' | 'down' | 'flat';
  };
  /** كمية مباعة حسب التقويم حتى اليوم (اليوم / أسبوع من السبت / شهر من أوله). */
  quantity_calendar: {
    day: number;
    week: number;
    month: number;
    week_starts_saturday: boolean;
    week_range: { start: string; end: string };
    month_range: { start: string; end: string };
  };
  sales_by_day: { date: string; revenue: number; quantity: number }[];
  sales_by_week: {
    week_start: string;
    week_end: string;
    week_label: string;
    revenue: number;
    quantity: number;
  }[];
  sales_by_month: { month_key: string; month_label: string; revenue: number; quantity: number }[];
}

export interface Invoice {
  id: number;
  seller_id: number;
  invoice_number: string;
  total: number;
  discount_amount?: number;
  sale_date: string;
  due_date?: string | null;
  payment_status?: 'pending' | 'paid' | 'partial';
  payment_method?: string | null;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  buyer_address?: string | null;
  notes?: string;
  loyalty_points_earned?: number;
  loyalty_points_redeemed?: number;
  payments?: Payment[];
  items?: InvoiceItem[];
  seller?: User;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  sale_date: string;
  due_date?: string;
  notes?: string;
  buyer_name?: string;
  buyer_phone?: string;
  buyer_address?: string;
  seller_id?: number;
  payment_status?: 'pending' | 'paid' | 'partial';
  payment_method?: string;
  paid_amount?: number;
  loyalty_points_redeemed?: number;
  discount_amount?: number;
  items: {
    product_id?: number;
    description: string;
    sale_type?: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
  }[];
}

export interface Payment {
  id: number;
  invoice_id: number;
  user_id?: number | null;
  amount: number;
  method?: string | null;
  reference?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  buyer_name: string;
  buyer_phone?: string | null;
  buyer_address?: string | null;
  total: number;
  invoices_count: number;
  last_sale_date: string;
}

export const customersApi = {
  list: () => api.get<Customer[]>('/customers'),
};

export const conversationsApi = {
  list: () => api.get<Conversation[]>('/conversations'),
  create: (data: { customer_id: number; seller_id: number }) => api.post<Conversation>('/conversations', data),
  get: (id: number) => api.get<Conversation>(`/conversations/${id}`),
  sendMessage: (id: number, body: string) => api.post<Message>(`/conversations/${id}/messages`, { body }),
  markRead: (id: number) => api.post(`/conversations/${id}/read`),
};

export interface Target {
  id: number;
  user_id?: number;
  target_amount: number;
  period_type: 'daily' | 'monthly';
  period_start: string;
}

export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
  read_at?: string | null;
  created_at: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminDashboard {
  daily_sales: number;
  weekly_sales: number;
  monthly_sales: number;
  last_3_months_sales: number;
  today_invoices_count: number;
  sellers_count: number;
  monthly_revenue_chart: {
    month_key: string;
    month_label: string;
    total: number;
  }[];
}

export interface SalesReport {
  from: string;
  to: string;
  total_sales: number;
  invoices_count: number;
  by_seller: { seller: User; count: number; total: number }[];
  invoices: Invoice[];
}

export interface BestSellingProductReport {
  best_selling_product: string | null;
  total_quantity: number;
  total_amount: number;
  lines_count?: number;
  period_from?: string;
  period_to?: string;
}

/** نفس منطق لوحة التحكم: مجموع المدفوعات + payment_status */
export interface InvoiceStatusReport {
  pending: number;
  partial: number;
  paid: number;
  total: number;
}

export interface SmartInsights {
  from: string;
  to: string;
  best_selling_product: {
    name: string;
    total_quantity: number;
    total_amount: number;
    lines_count?: number;
  } | null;
  best_sales_hour: { hour: string; total_sales: number; invoices_count: number } | null;
  top_customers: {
    customer_key: string;
    buyer_name?: string | null;
    buyer_phone?: string | null;
    total_sales: number;
    invoices_count: number;
  }[];
}

export interface LoyaltySummaryItem {
  buyer_name: string;
  buyer_phone?: string | null;
  earned_points: number;
  redeemed_points: number;
  available_points: number;
  total_sales: number;
  invoices_count: number;
}

export interface CreditDueItem {
  id: number;
  invoice_number: string;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  sale_date: string;
  due_date?: string | null;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
  sender?: User;
}

export interface Conversation {
  id: number;
  customer_id: number;
  seller_id: number;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
  customer?: User;
  seller?: User;
  messages?: Message[];
}
