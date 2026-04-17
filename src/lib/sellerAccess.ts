/** Default landing for users with role `seller` (no dashboard). */
export const SELLER_HOME_PATH = '/sales/new';

export function isSellerRole(role: string | undefined): boolean {
  return role === 'seller';
}

/**
 * Paths a normal seller may open. Anything else is redirected to {@link SELLER_HOME_PATH}.
 */
export function isPathAllowedForSeller(pathname: string): boolean {
  if (pathname === '/sales/new') return true;
  if (pathname === '/conversations' || pathname === '/conversation') return true;
  if (pathname === '/products' || /^\/products\/\d+$/.test(pathname)) return true;
  if (pathname === '/customers' || /^\/customers\/.+/.test(pathname)) return true;
  if (pathname === '/loyalty') return true;
  if (pathname === '/sales-limits') return true;
  return false;
}

/** Highlight sidebar item for product list or numeric product id (not near-expiry). */
export function isSellerProductsNavActive(pathname: string): boolean {
  return pathname === '/products' || /^\/products\/\d+$/.test(pathname);
}
