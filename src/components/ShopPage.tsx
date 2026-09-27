import { PRODUCT_CATEGORIES, PRODUCTS, categorySlug } from '../data/products';
import { navigate } from '../router';
import { ProductCard } from './ProductCard';

/** Responsive shop listing (route: /shop, filter deep-link: /shop?cat=…).
    The cat param accepts a comma-separated slug list so homepage category
    tiles can span two catalogue categories (Gift Sets & Hampers). */
export function ShopPage({ category }: { category: string | null }) {
  const activeSlugs = (category ?? '').split(',').filter(Boolean);
  const active = PRODUCT_CATEGORIES.filter((item) => activeSlugs.includes(categorySlug(item)));
  const visible =
    active.length === 0 ? PRODUCTS : PRODUCTS.filter((product) => active.includes(product.category));

  return (
    <section className="shop" aria-labelledby="shop-title">
      <div className="shop-inner">
        <p className="shop-eyebrow">The FAFARI shop</p>
        <h1 className="section-title shop-title" id="shop-title">
          Flowers, gifts &amp; greenery
        </h1>
        <p className="shop-lede">
          Studio pieces hand-finished in Accra, from hand-tied bouquets to statement planters.
        </p>

        <div className="shop-filters" role="group" aria-label="Filter products by category">
          <button
            type="button"
            className="choice shop-choice"
            aria-pressed={active.length === 0}
            onClick={() => navigate('/shop')}
          >
            All
          </button>
          {PRODUCT_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              className="choice shop-choice"
              aria-pressed={active.includes(item)}
              onClick={() => navigate(`/shop?cat=${categorySlug(item)}`)}
            >
              {item}
            </button>
          ))}
        </div>

        <p className="shop-count" role="status">
          {visible.length} {visible.length === 1 ? 'piece' : 'pieces'}
          {active.length === 0 ? '' : ` in ${active.join(' & ')}`}
        </p>

        <ul className="product-grid">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      </div>
    </section>
  );
}
