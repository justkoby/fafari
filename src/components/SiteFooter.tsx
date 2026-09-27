import type { MouseEvent } from 'react';
import { FOOTER, FOOTER_COLUMNS, type FooterLink } from '../data/footer';
import { Link } from './Link';
import { navigate, readRoute } from '../router';

/** Site footer — a near-black close: the ivory wordmark, a one-line
    promise and the studio description on the left; the link columns
    that exist today beside them; a quiet copyright row under a burgundy
    hairline. Columns stack on mobile. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  /** Anchor items route home first (if needed), then scroll to the
      section — the href keeps full-load semantics for new tabs. */
  const handleAnchor = (event: MouseEvent<HTMLAnchorElement>, anchor: string) => {
    event.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scroll = () =>
      document.getElementById(anchor)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (readRoute().kind === 'home') {
      scroll();
      return;
    }
    navigate('/');
    window.requestAnimationFrame(() => window.requestAnimationFrame(scroll));
  };

  const renderItem = (item: FooterLink) => (
    <li key={item.label}>
      {item.prefix && <span className="footer-contact-prefix">{item.prefix} </span>}
      {item.external ? (
        <a className="footer-link" href={item.href} target="_blank" rel="noopener noreferrer">
          {item.label}
        </a>
      ) : (
        <Link
          className="footer-link"
          href={item.href}
          onClick={item.anchor ? (event) => handleAnchor(event, item.anchor as string) : undefined}
        >
          {item.label}
        </Link>
      )}
    </li>
  );

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo" role="img" aria-label="FAFARI" />
            <p className="footer-tagline">{FOOTER.tagline}</p>
            <p className="footer-description">{FOOTER.description}</p>
          </div>
          {FOOTER_COLUMNS.filter((column) => column.items.length > 0).map((column) => (
            <nav key={column.id} className="footer-col" aria-labelledby={`footer-col-${column.id}`}>
              <h3 className="footer-col-title" id={`footer-col-${column.id}`}>
                {column.title}
              </h3>
              <ul className="footer-list">{column.items.map(renderItem)}</ul>
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {year} {FOOTER.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
