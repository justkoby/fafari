import { useEffect, useRef, useState } from 'react';
import { NAV_ITEMS } from '../data/navigation';
import { IconBag, IconChevron, IconClose, IconSearch, IconUser } from './Icons';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Hands the pressed control over so the search panel can restore focus. */
  onSearch: (opener: HTMLElement) => void;
}

const FOCUSABLE = 'a[href], button:not([disabled])';

export function MobileDrawer({ open, onClose, onSearch }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusables = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.closest('[hidden]'),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  return (
    <div
      id="mobile-drawer"
      ref={drawerRef}
      className="drawer"
      data-open={open}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div className="drawer-head">
        <img className="drawer-logo" src="/assets/fafari-logo.svg" alt="FAFARI" />
        <button type="button" ref={closeRef} className="icon-btn" aria-label="Close menu" onClick={onClose}>
          <IconClose />
        </button>
      </div>

      <nav className="drawer-nav" aria-label="Primary">
        <ul className="drawer-list">
          {NAV_ITEMS.map((item) =>
            item.menu ? (
              <li className="drawer-group" key={item.id}>
                <button
                  type="button"
                  className="drawer-group-toggle"
                  aria-expanded={expanded === item.id}
                  aria-controls={`drawer-panel-${item.id}`}
                  onClick={() => setExpanded((prev) => (prev === item.id ? null : item.id))}
                >
                  <span>{item.label}</span>
                  <IconChevron className="drawer-chevron" />
                </button>
                <div className="drawer-panel" id={`drawer-panel-${item.id}`} hidden={expanded !== item.id}>
                  <ul className="drawer-panel-list">
                    {item.menu.columns.flatMap((column) => column.links).map((link) => (
                      <li key={link.label}>
                        <a className="drawer-sublink" href={link.href}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ) : (
              <li key={item.id}>
                <a className="drawer-link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="drawer-foot">
        <p className="drawer-script">flowers &amp; gifting</p>
        <div className="drawer-actions">
          <button
            type="button"
            className="icon-btn drawer-search"
            aria-label="Search"
            onClick={(event) => onSearch(event.currentTarget)}
          >
            <IconSearch />
          </button>
          <button type="button" className="icon-btn" aria-label="Account">
            <IconUser />
          </button>
          <button type="button" className="icon-btn" aria-label="Shopping bag">
            <IconBag />
          </button>
        </div>
      </div>
    </div>
  );
}
