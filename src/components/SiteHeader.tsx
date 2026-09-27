import { useCallback, useEffect, useRef, useState } from 'react';
import { NAV_ITEMS } from '../data/navigation';
import { AnnouncementBar } from './AnnouncementBar';
import { MegaPanel } from './MegaPanel';
import { MobileDrawer } from './MobileDrawer';
import { SearchPanel } from './SearchPanel';
import { IconBag, IconChevron, IconMenu, IconSearch, IconUser } from './Icons';

/** Grace period so the pointer can travel from a trigger into the open panel. */
const CLOSE_DELAY_MS = 140;

interface SiteHeaderProps {
  /** Routes a submitted term to the results view (/?q=…). */
  onSearchSubmit: (query: string) => void;
}

export function SiteHeader({ onSearchSubmit }: SiteHeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);
  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const searchOpenerRef = useRef<HTMLElement | null>(null);
  const searchWasOpen = useRef(false);

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== undefined) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  const closeNow = useCallback(() => {
    cancelClose();
    setOpenMenu(null);
  }, [cancelClose]);

  /* Transparent only at the very top; solid near-black on any scroll,
     in either direction, until the page returns to the top. */
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  /* Escape closes search first, then an open mega menu (focus returns). */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (searchOpen) {
        setSearchOpen(false);
        return;
      }
      if (openMenu) {
        setOpenMenu(null);
        triggerRefs.current[openMenu]?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, openMenu]);

  /* Search and mega menus are mutually exclusive. */
  useEffect(() => {
    if (searchOpen) setOpenMenu(null);
  }, [searchOpen]);

  useEffect(() => {
    if (openMenu) setSearchOpen(false);
  }, [openMenu]);

  /* No background scrolling while the search panel is open. */
  useEffect(() => {
    if (!searchOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [searchOpen]);

  /* Closing search returns focus to the control that opened it. */
  useEffect(() => {
    if (searchOpen) {
      searchWasOpen.current = true;
      return;
    }
    if (!searchWasOpen.current) return;
    searchWasOpen.current = false;
    const isVisible = (el: HTMLElement | null): el is HTMLElement =>
      !!el &&
      el.isConnected &&
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== 'hidden';
    const target = [searchOpenerRef.current, searchTriggerRef.current, menuToggleRef.current].find(isVisible);
    target?.focus();
  }, [searchOpen]);

  const openSearch = useCallback(
    (opener?: HTMLElement | null) => {
      cancelClose();
      setOpenMenu(null);
      setDrawerOpen(false);
      searchOpenerRef.current = opener ?? null;
      setSearchOpen(true);
    },
    [cancelClose],
  );

  const handleSearchSubmit = useCallback(
    (query: string) => {
      onSearchSubmit(query);
      setSearchOpen(false);
    },
    [onSearchSubmit],
  );

  /* Clicking anywhere outside the header closes an open mega menu. */
  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) closeNow();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openMenu, closeNow]);

  /* Tabbing out of the header closes an open mega menu. */
  const handleFocusOut = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!wrapRef.current?.contains(event.relatedTarget as Node)) closeNow();
  };

  const toggleMenu = (id: string) => setOpenMenu((prev) => (prev === id ? null : id));

  return (
    <>
      <AnnouncementBar />
      <div
        ref={wrapRef}
        className="header-wrap"
        data-solid={scrolled || openMenu !== null || drawerOpen || searchOpen}
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
        onBlur={handleFocusOut}
      >
        <header className="header">
          <div className="header-inner">
            <button
              type="button"
              ref={menuToggleRef}
              className="icon-btn header-menu-toggle"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
              onClick={() => setDrawerOpen(true)}
            >
              <IconMenu />
            </button>

            <a className="brand" href="/" aria-label="FAFARI — home">
              <img className="brand-logo" src="/assets/fafari-logo.svg" alt="" width={132} height={40} />
            </a>

            <nav className="primary-nav" aria-label="Primary">
              <ul className="primary-nav-list">
                {NAV_ITEMS.map((item) => (
                  <li
                    key={item.id}
                    className="nav-item"
                    onPointerEnter={(event) => {
                      if (event.pointerType !== 'mouse') return;
                      if (item.menu) {
                        cancelClose();
                        setOpenMenu(item.id);
                      } else {
                        scheduleClose();
                      }
                    }}
                  >
                    {item.menu ? (
                      <button
                        type="button"
                        id={`nav-trigger-${item.id}`}
                        ref={(el) => {
                          triggerRefs.current[item.id] = el;
                        }}
                        className="nav-link nav-link--trigger"
                        aria-expanded={openMenu === item.id}
                        aria-controls={`mega-${item.id}`}
                        onClick={() => toggleMenu(item.id)}
                      >
                        {item.label}
                        <IconChevron className="nav-chevron" />
                      </button>
                    ) : (
                      <a className="nav-link" href={item.href}>
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="header-actions">
              <button
                type="button"
                ref={searchTriggerRef}
                className="icon-btn header-search"
                aria-label="Search"
                aria-expanded={searchOpen}
                aria-controls="search-panel"
                onClick={(event) => openSearch(event.currentTarget)}
              >
                <IconSearch />
              </button>
              <button type="button" className="icon-btn header-account" aria-label="Account">
                <IconUser />
              </button>
              <button type="button" className="icon-btn header-bag" aria-label="Shopping bag">
                <IconBag />
              </button>
            </div>
          </div>

          {NAV_ITEMS.map((item) =>
            item.menu ? (
              <MegaPanel
                key={item.id}
                menu={item.menu}
                open={openMenu === item.id}
                labelledBy={`nav-trigger-${item.id}`}
              />
            ) : null,
          )}

          <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} onSubmit={handleSearchSubmit} />
        </header>
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSearch={(opener) => openSearch(opener)}
      />
    </>
  );
}
