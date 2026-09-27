import { useState } from 'react';
import {
  PRODUCT_CATEGORIES,
  categorySlug,
  formatPrice,
  type ProductCategory,
} from '../data/products';
import { searchNavEntries, searchProducts } from '../data/searchIndex';
import { navigate } from '../router';
import { IconSearch } from './Icons';
import { Link } from './Link';
import { ProductCard } from './ProductCard';

/** Compact price bands the results can be filtered by. */
const PRICE_BANDS: { id: string; label: string; test: (price: number) => boolean }[] = [
  { id: 'under-500', label: `Under ${formatPrice(500)}`, test: (price) => price < 500 },
  { id: '500-1000', label: `${formatPrice(500)} – ${formatPrice(1000)}`, test: (price) => price >= 500 && price <= 1000 },
  { id: 'over-1000', label: `Over ${formatPrice(1000)}`, test: (price) => price > 1000 },
];

interface SearchResultsViewProps {
  query: string;
  category: string | null;
  price: string | null;
}

/** Product results (route: /?q=…) — cards from the shared catalogue, with
    category + price controls and a small related-categories area. */
export function SearchResultsView({ query, category, price }: SearchResultsViewProps) {
  const [term, setTerm] = useState(query);

  const activeSlugs = (category ?? '').split(',').filter(Boolean);
  const activeCategories = PRODUCT_CATEGORIES.filter((item) => activeSlugs.includes(categorySlug(item)));
  const activeBand = PRICE_BANDS.find((band) => band.id === price) ?? null;
  const filtersActive = activeCategories.length > 0 || activeBand !== null;

  const matched = searchProducts(query);
  const products = matched
    .filter((product) => activeCategories.length === 0 || activeCategories.includes(product.category))
    .filter((product) => activeBand === null || activeBand.test(product.price));
  const related = searchNavEntries(query).slice(0, 6);

  const buildUrl = (nextQuery: string, nextCategory: string | null, nextPrice: string | null) => {
    const params = new URLSearchParams();
    params.set('q', nextQuery);
    if (nextCategory) params.set('cat', nextCategory);
    if (nextPrice) params.set('price', nextPrice);
    return `/?${params.toString()}`;
  };

  const setCategory = (slug: string | null) => navigate(buildUrl(query, slug, price));
  const setPrice = (id: string | null) => navigate(buildUrl(query, category, id));

  return (
    <section className="search-results-view" aria-labelledby="search-results-title">
      <div className="search-results-inner">
        <p className="hero-eyebrow">Search</p>
        <h1 className="section-title search-results-title" id="search-results-title">
          Results for &ldquo;{query}&rdquo;
        </h1>

        <form
          className="results-form"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const next = term.trim();
            if (next) navigate(buildUrl(next, category, price));
          }}
        >
          <label className="visually-hidden" htmlFor="results-search">
            Refine your search
          </label>
          <IconSearch className="results-form-icon" />
          <input
            id="results-search"
            className="results-input"
            type="search"
            name="results-q"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="submit" className="results-submit">
            Search
          </button>
        </form>

        <p className="results-count" role="status">
          {products.length} {products.length === 1 ? 'product' : 'products'}
          {filtersActive ? ' with your filters' : ''}
        </p>

        <div className="results-controls">
          <div className="results-cats" role="group" aria-label="Filter results by category">
            <button
              type="button"
              className="choice shop-choice results-choice"
              aria-pressed={activeCategories.length === 0}
              onClick={() => setCategory(null)}
            >
              All
            </button>
            {PRODUCT_CATEGORIES.map((item: ProductCategory) => (
              <button
                key={item}
                type="button"
                className="choice shop-choice results-choice"
                aria-pressed={activeCategories.includes(item)}
                onClick={() => setCategory(categorySlug(item))}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="results-price">
            <span className="results-price-label">Price</span>
            <select
              className="results-select"
              value={activeBand?.id ?? ''}
              onChange={(event) => setPrice(event.target.value || null)}
            >
              <option value="">Any price</option>
              {PRICE_BANDS.map((band) => (
                <option key={band.id} value={band.id}>
                  {band.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {products.length > 0 ? (
          <ul className="product-grid product-grid--wide results-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
        ) : (
          <div className="results-empty">
            <p className="results-empty-title">
              No products match &ldquo;{query}&rdquo;
              {filtersActive ? ' with these filters' : ''}.
            </p>
            <p className="results-empty-hint">
              Try a different term — a flower, a gift style, an occasion — or browse the full catalogue.
            </p>
            <form
              className="results-empty-form"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                const next = term.trim();
                if (next) navigate(buildUrl(next, null, null));
              }}
            >
              <label className="visually-hidden" htmlFor="results-empty-search">
                Search the catalogue
              </label>
              <input
                id="results-empty-search"
                className="results-input results-input--compact"
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button type="submit" className="results-submit">
                Search
              </button>
            </form>
            <div className="results-empty-actions">
              <Link className="results-browse" href="/shop">
                Browse all products
              </Link>
              {filtersActive && (
                <button
                  type="button"
                  className="results-clear"
                  onClick={() => navigate(buildUrl(query, null, null))}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="results-explore">
            <p className="search-heading">Explore related categories</p>
            <div className="search-chips">
              {related.map((entry) => (
                <Link key={`${entry.category}-${entry.label}`} className="search-chip" href={entry.href}>
                  {entry.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
