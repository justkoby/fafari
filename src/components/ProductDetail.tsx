import { formatPrice, productBySlug } from '../data/products';
import { IconArrow } from './Icons';
import { Link } from './Link';

/** Simple product detail view (route: /product/<slug>). */
export function ProductDetail({ slug }: { slug: string }) {
  const product = productBySlug(slug);

  if (!product) {
    return (
      <section className="shop" aria-labelledby="product-detail-title">
        <div className="shop-inner">
          <p className="shop-eyebrow">Not in the catalogue</p>
          <h1 className="section-title shop-title" id="product-detail-title">
            We couldn&rsquo;t find that piece.
          </h1>
          <Link className="product-detail-back" href="/shop">
            <IconArrow className="product-detail-back-icon" />
            Back to the shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail" aria-labelledby="product-detail-title">
      <div className="product-detail-inner">
        <Link className="product-detail-back" href="/shop">
          <IconArrow className="product-detail-back-icon" />
          Back to the shop
        </Link>

        <div className="product-detail-layout">
          <div className="product-detail-media">
            <img src={product.image.src} alt={product.image.alt} />
          </div>
          <div className="product-detail-info">
            <p className="product-detail-category">{product.category}</p>
            <h1 className="product-detail-name" id="product-detail-title">
              {product.name}
            </h1>
            <p className="product-detail-price">{formatPrice(product.price)}</p>
            <p className="product-detail-description">{product.description}</p>
            <ul className="product-detail-tags" aria-label="Tags">
              {product.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <p className="product-detail-note">Presentation price in Ghana cedis.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
