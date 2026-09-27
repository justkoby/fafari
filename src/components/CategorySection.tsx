import { CATEGORY_TILES } from '../data/products';
import { IconArrow } from './Icons';
import { Link } from './Link';

/** "Shop by Category" — a full-bleed editorial band after the weekly edit.
    The heading sits at the normal content width; the four equal, gapless
    tiles run edge to edge and deep-link into the filtered shop. */
export function CategorySection() {
  return (
    <section className="categories" aria-labelledby="categories-title">
      <div className="categories-head">
        <p className="categories-eyebrow">The Collections</p>
        <h2 className="section-title categories-title" id="categories-title">
          Shop by Category
        </h2>
        <p className="categories-intro">
          Four edits, one standard — hand-finished in Accra for the moments that matter.
        </p>
      </div>
      <ul className="categories-grid">
        {CATEGORY_TILES.map((tile) => (
          <li key={tile.label}>
            <Link className="categories-link" href={tile.href}>
              <img className="categories-media" src={tile.image.src} alt={tile.image.alt} loading="lazy" />
              <span className="categories-caption">
                <span className="categories-label">{tile.label}</span>
                <span className="categories-explore">
                  Explore
                  <IconArrow className="categories-explore-icon" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
