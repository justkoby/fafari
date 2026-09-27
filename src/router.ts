/* Minimal path router — no library. Routes are read from the address bar
   on boot and on popstate; `navigate()` pushes state and re-reads, so real
   <a href> semantics (middle-click, new tab) still work on a full load. */

export type Route =
  | { kind: 'home' }
  | { kind: 'search'; query: string; category: string | null; price: string | null }
  | { kind: 'shop'; category: string | null }
  | { kind: 'product'; slug: string };

export function readRoute(): Route {
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  const query = params.get('q');

  if (pathname === '/shop' || pathname === '/shop/') {
    return { kind: 'shop', category: params.get('cat') };
  }
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) return { kind: 'product', slug: decodeURIComponent(productMatch[1]) };
  if (query && query.trim()) {
    return { kind: 'search', query: query.trim(), category: params.get('cat'), price: params.get('price') };
  }
  return { kind: 'home' };
}

export function navigate(to: string): void {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}
