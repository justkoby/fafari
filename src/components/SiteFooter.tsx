import type { MouseEvent } from 'react';
import { FOOTER, FOOTER_COLUMNS } from '../data/footer';
import { IconArrow } from './Icons';
import { Link } from './Link';
import { navigate, readRoute } from '../router';

/** Site footer — a deep burgundy close to the page: the wordmark and a
    one-line promise, the link columns that have real routes today, and a
    quiet copyright row. Columns stack on mobile. */
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

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <img className="footer-logo" src="/assets/fafari-logo.svg" alt="FAFARI" width={132} height={40} />
            <p className="footer-tagline">{FOOTER.tagline}</p>
            <a
              className="footer-instagram"
              href={FOOTER.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {FOOTER.instagram.label}
              <IconArrow className="footer-instagram-icon" />
            </a>
          </div>
          {FOOTER_COLUMNS.filter((column) => column.items.length > 0).map((column) => (
            <nav key={column.id} className="footer-col" aria-labelledby={`footer-col-${column.id}`}>
              <h3 className="footer-col-title" id={`footer-col-${column.id}`}>
                {column.title}
              </h3>
              <ul className="footer-list">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      className="footer-link"
                      href={item.href}
                      onClick={item.anchor ? (event) => handleAnchor(event, item.anchor as string) : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
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
