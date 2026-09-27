import { useCallback, useEffect, useState } from 'react';
import { CategorySection } from './components/CategorySection';
import { ClientCamSection } from './components/ClientCamSection';
import { FounderSection } from './components/FounderSection';
import { Hero } from './components/Hero';
import { DiscoverySection } from './components/DiscoverySection';
import { ProductDetail } from './components/ProductDetail';
import { SearchResultsView } from './components/SearchResultsView';
import { ShopPage } from './components/ShopPage';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { WeeklySection } from './components/WeeklySection';
import { productBySlug } from './data/products';
import { readRoute, navigate, type Route } from './router';

const SITE_TITLE = 'FAFARI — Floral & Gifting Studio';

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (route.kind === 'product') {
      document.title = `${productBySlug(route.slug)?.name ?? 'Piece'} · FAFARI`;
    } else if (route.kind === 'shop') {
      document.title = 'Shop · FAFARI';
    } else if (route.kind === 'search') {
      document.title = `Search · FAFARI`;
    } else {
      document.title = SITE_TITLE;
    }
  }, [route]);

  /** The results view lives on a real, shareable route: /?q=<term>. */
  const handleSearchSubmit = useCallback((term: string) => {
    navigate(`/?q=${encodeURIComponent(term)}`);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader onSearchSubmit={handleSearchSubmit} />
      <main id="main">
        {route.kind === 'search' ? (
          /* key: a new query remounts the view so the refine field resyncs */
          <SearchResultsView key={route.query} query={route.query} category={route.category} price={route.price} />
        ) : route.kind === 'shop' ? (
          <ShopPage category={route.category} />
        ) : route.kind === 'product' ? (
          <ProductDetail slug={route.slug} />
        ) : (
          <>
            <Hero />
            <DiscoverySection />
            <WeeklySection />
            <CategorySection />
            <FounderSection />
            <ClientCamSection />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
