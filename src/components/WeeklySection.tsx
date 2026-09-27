import { WEEKLY_EDIT } from '../data/products';
import { IconArrow } from './Icons';
import { Link } from './Link';
import { ProductCard } from './ProductCard';

/** "This Week at Fafari" — editorial weekly edit directly after the gift
    finder. Off-white ground, burgundy accents; the photography carries
    the colour. */
export function WeeklySection() {
  return (
    <section className="weekly" aria-labelledby="weekly-title">
      <div className="weekly-inner">
        <div className="weekly-head">
          <div>
            <p className="weekly-eyebrow">The Weekly Edit</p>
            <h2 className="section-title weekly-title" id="weekly-title">
              This Week at Fafari
            </h2>
            <p className="weekly-lede">
              Thoughtful flowers, gifts and greenery, selected to make the moment feel special.
            </p>
          </div>
          <Link className="weekly-link" href="/shop">
            Explore All Gifts
            <IconArrow className="weekly-link-icon" />
          </Link>
        </div>
        <ul className="product-grid product-grid--wide product-grid--light">
          {WEEKLY_EDIT.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      </div>
    </section>
  );
}
