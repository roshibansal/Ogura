export type AppDomain = 'customer' | 'seller' | 'admin';

/**
 * Detects which app to render based on hostname or URL path.
 * 
 * Production:
 *   ogura.in / www.ogura.in → customer
 *   sellers.ogura.in → seller
 *   admin.ogura.in → admin
 * 
 * Development/Preview (path-based fallback):
 *   /seller/* → seller
 *   /admin/* → admin
 *   everything else → customer
 */
export function detectDomain(customPath?: string): AppDomain {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const rawPath = customPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const pathname = rawPath.replace(/\/+$/, '') || '/';

  // Production subdomain detection
  if (hostname.startsWith('sellers.')) return 'seller';
  if (hostname.startsWith('admin.')) return 'admin';

  // Path-based fallback for dev/preview (exact segment match & prefix)
  if (pathname === '/seller' || pathname.startsWith('/seller/')) return 'seller';
  if (pathname === '/seller-login' || pathname === '/seller-signup' || pathname === '/seller/login') return 'seller';
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname === '/admin-login') return 'admin';

  return 'customer';
}

/**
 * Strips the domain prefix from the path for internal routing.
 * e.g. /seller/dashboard → /dashboard
 *      /admin/products → /products
 */
export function getBasePath(domain: AppDomain): string {
  if (domain === 'seller') return '/seller';
  if (domain === 'admin') return '/admin';
  return '';
}
