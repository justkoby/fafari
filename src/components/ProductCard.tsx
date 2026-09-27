import { formatPrice, type Product } from '../data/products';
import { Link } from './Link';

/** Shared product tile: 5:6 image (the native ratio — never cropped),
    category, name and formatted cedi price, linking to the detail view. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <li className="product-card">
      <Link className="product-card-link" href={`/product/${product.id}`}>
        <span className="product-card-media">
          <img src={product.image.src} alt={product.image.alt} loading="lazy" />
        </span>
        <span className="product-card-body">
          <span className="product-card-category">{product.category}</span>
          <span className="product-card-name">{product.name}</span>
          <span className="product-card-price">{formatPrice(product.price)}</span>
        </span>
      </Link>
    </li>
  );
}
