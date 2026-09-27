import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../data/products';
import {
  EXPLORE_CATEGORIES,
  POPULAR_SEARCHES,
  searchProducts,
} from '../data/searchIndex';
import { navigate } from '../router';
import { useAssistant } from '../assistant/AssistantContext';
import { IconArrow, IconChat, IconClose, IconSearch } from './Icons';
import { Link } from './Link';

const DEBOUNCE_MS = 200;
const MAX_LIVE_MATCHES = 4;

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
  /** Resolves the term into the results view (real route: /?q=…). */
  onSubmit: (query: string) => void;
}

export function SearchPanel({ open, onClose, onSubmit }: SearchPanelProps) {
  const assistant = useAssistant();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* Fresh panel + focused input on every open. */
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setDebounced('');
    inputRef.current?.focus();
  }, [open]);

  /* Short debounce while typing. */
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const term = debounced.trim();
  /* Same matcher as the results page, narrowed to catalogue products. */
  const matches = term ? searchProducts(term).slice(0, MAX_LIVE_MATCHES) : [];

  const submit = (value: string) => {
    const next = value.trim();
    if (!next) {
      inputRef.current?.focus();
      return;
    }
    onSubmit(next);
  };

  /* Close the panel, then hand over to the guided discovery section. */
  const goToDiscovery = () => {
    const onHome = document.getElementById('find-a-gift') !== null;
    onClose();
    if (!onHome) navigate('/');
    window.setTimeout(
      () => {
        document.getElementById('find-a-gift')?.scrollIntoView({ block: 'start' });
      },
      onHome ? 0 : 80,
    );
  };

  /* Hand the typed term to the assistant, then close the search panel. */
  const openAssistantFromPanel = () => {
    const q = query.trim();
    onClose();
    assistant.open(q ? { query: q } : {});
  };

  return (
    <>
      <div className="search-backdrop" data-open={open} onClick={onClose} aria-hidden="true" />
      <div className="search-panel" id="search-panel" data-open={open} aria-label="Search FAFARI">
        <form
          className="search-form"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            submit(query);
          }}
        >
          <label className="visually-hidden" htmlFor="fafari-search">
            Search flowers, gifts and plants
          </label>
          <IconSearch className="search-form-icon" />
          <input
            ref={inputRef}
            id="fafari-search"
            className="search-input"
            type="search"
            name="fafari-q"
            placeholder="Search flowers, gifts and plants…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" className="icon-btn search-close" aria-label="Close search" onClick={onClose}>
            <IconClose />
          </button>
        </form>

        <div className="search-body">
          {term === '' ? (
            <div className="search-suggestions">
              <div className="search-group">
                <p className="search-heading">Popular searches</p>
                <div className="search-chips">
                  {POPULAR_SEARCHES.map((suggestion) => (
                    <button key={suggestion} type="button" className="search-chip" onClick={() => submit(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              <div className="search-group">
                <p className="search-heading">Explore</p>
                <div className="search-chips">
                  {EXPLORE_CATEGORIES.map((item) => (
                    <Link key={item.href} className="search-chip" href={item.href} onClick={onClose}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <a
                className="search-discovery-link"
                href="#find-a-gift"
                onClick={(event) => {
                  event.preventDefault();
                  goToDiscovery();
                }}
              >
                Not sure what to choose? Find the perfect gesture
                <IconArrow className="search-discovery-link-icon" />
              </a>
            </div>
          ) : matches.length === 0 ? (
            <div className="search-empty" role="status">
              <p className="search-empty-title">No matches for “{term}”.</p>
              <p className="search-empty-hint">
                Check the spelling, try a simpler term, or browse the shop categories.
              </p>
              <div className="search-chips">
                {EXPLORE_CATEGORIES.map((item) => (
                  <Link key={item.href} className="search-chip" href={item.href} onClick={onClose}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="search-matches">
              <ul className="search-match-list" aria-label="Product matches">
                {matches.map((product) => (
                  <li key={product.id}>
                    <Link className="search-match" href={`/product/${product.id}`} onClick={onClose}>
                      <img
                        className="search-match-thumb"
                        src={product.image.src}
                        alt={product.image.alt}
                        loading="lazy"
                      />
                      <span className="search-match-name">{product.name}</span>
                      <span className="search-match-price">{formatPrice(product.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="button" className="search-view-all" onClick={() => submit(term)}>
                View all results
                <IconArrow className="search-view-all-icon" />
              </button>
            </div>
          )}

          <button type="button" className="search-assistant" onClick={openAssistantFromPanel}>
            <IconChat className="search-assistant-icon" />
            Ask the Fafari Assistant
            <IconArrow className="search-assistant-arrow" />
          </button>
        </div>
      </div>
    </>
  );
}
