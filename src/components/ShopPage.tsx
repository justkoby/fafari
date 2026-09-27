import { PRODUCT_CATEGORIES, PRODUCTS, VALENTINE_ROSE_OPTIONS, categorySlug, formatPrice } from '../data/products';
import { navigate } from '../router';
import { ProductCard } from './ProductCard';

/** Responsive shop listing (route: /shop, filter deep-link: /shop?cat=…).
    The cat param accepts a comma-separated slug list so homepage category
    tiles can span two catalogue categories (Gift Sets & Hampers). */
export function ShopPage({ category }: { category: string | null }) {
  const showValentineRoses = category === 'valentines-roses';
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
            aria-pressed={active.length === 0 && !showValentineRoses}
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
          <button
            type="button"
            className="choice shop-choice"
            aria-pressed={showValentineRoses}
            onClick={() => navigate('/shop?cat=valentines-roses')}
          >
            Valentine Roses
          </button>
        </div>

        {showValentineRoses ? (
          <div className="rose-guide">
            <h2 className="rose-guide-title">Valentine&rsquo;s rose bouquets</h2>
            <p className="rose-guide-intro">
              Fafari&rsquo;s Valentine&rsquo;s Day price guide. These are seasonal reference prices, so please confirm
              the current price and availability before ordering. Fillers are available at an extra charge.
            </p>
            <ul className="rose-guide-list" aria-label="Valentine rose bouquet options">
              {VALENTINE_ROSE_OPTIONS.map(({ roses, price }) => {
                const name = `${roses} ${roses === 1 ? 'rose' : 'roses'} bouquet`;
                const message = `Hello Fafari, I would like to ask about the ${name} from your Valentine's price list. Please confirm the current price and availability.`;
                return (
                  <li className="rose-guide-item" key={roses}>
                    <span className="rose-guide-name">{name}</span>
                    <span className="rose-guide-price">{formatPrice(price)}</span>
                    <a
                      className="rose-guide-link"
                      href={`https://wa.me/233506580545?text=${encodeURIComponent(message)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Enquire about ${name} on WhatsApp`}
                    >
                      Enquire
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <>
            <p className="shop-count" role="status">
              {visible.length} {visible.length === 1 ? 'piece' : 'pieces'}
              {active.length === 0 ? '' : ` in ${active.join(' & ')}`}
            </p>
            <ul className="product-grid">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
