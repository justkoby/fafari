import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  ASSISTANT_ENDPOINT,
  ASSISTANT_FALLBACK,
  ASSISTANT_GREETING,
  ASSISTANT_TITLE,
  ASSISTANT_WHATSAPP,
  MAX_MESSAGE_CHARS,
  buildHistory,
  describeSeed,
  resolveProducts,
  type AssistantSeed,
  type ChatTurn,
} from '../data/assistant';
import type { Product } from '../data/products';
import { IconArrow, IconClose } from './Icons';
import { ProductCard } from './ProductCard';

/* Focus-trap scope: everything a visitor can tab to inside the sheet. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])';

interface AssistantDrawerProps {
  open: boolean;
  /** Search text + filters carried in when the panel was opened. */
  seed: AssistantSeed | null;
  onClose: () => void;
}

type Message =
  | { id: number; role: 'user'; content: string }
  | {
      id: number;
      role: 'assistant';
      content: string;
      products: Product[];
      customOrder: boolean;
      degraded?: boolean;
    };

/** The one assistant panel for the site: a right-side drawer on desktop and
    a full-height sheet on mobile. It talks to the same-origin serverless
    route, which calls Groq; recommendations are resolved back to real
    catalogue products before they render. Escape closes, focus is trapped
    and returned, and "Start over" resets the conversation. */
export function AssistantDrawer({ open, seed, onClose }: AssistantDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const idRef = useRef(0);
  const titleId = useId();
  const inputId = useId();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const context = describeSeed(seed);
  const greeting = context
    ? `${ASSISTANT_GREETING} I can see you're browsing ${context}.`
    : ASSISTANT_GREETING;

  const nextId = () => (idRef.current += 1);

  /* A fresh greeting each time the panel opens (or the seed changes). */
  useEffect(() => {
    if (!open) return;
    setMessages([{ id: nextId(), role: 'assistant', content: greeting, products: [], customOrder: false }]);
    setInput('');
    setLoading(false);
  }, [open, greeting]);

  /* Body scroll lock, focus-in, Escape, focus trap, and focus-restore. */
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
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
      window.cancelAnimationFrame(frame);
      previous?.focus();
    };
  }, [open, onClose]);

  /* Keep the newest turn in view. */
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, loading, open]);

  const send = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || loading) return;

      const history: ChatTurn[] = buildHistory(messages.map((m) => ({ role: m.role, content: m.content })));
      setMessages((prev) => [...prev, { id: nextId(), role: 'user', content }]);
      setInput('');
      setLoading(true);

      try {
        const response = await fetch(ASSISTANT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, history, context }),
        });
        const data = response.ok ? await response.json().catch(() => null) : null;
        if (!data) throw new Error('bad response');

        const products = resolveProducts(data.productIds);
        const followUp = Boolean(data.needsFollowUp);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            content:
              typeof data.reply === 'string' && data.reply.trim() ? data.reply.trim() : ASSISTANT_FALLBACK,
            products,
            customOrder: Boolean(data.customOrder) || (products.length === 0 && !followUp),
            degraded: Boolean(data.degraded),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            content: ASSISTANT_FALLBACK,
            products: [],
            customOrder: true,
            degraded: true,
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [context, loading, messages],
  );

  const startOver = () => {
    setMessages([{ id: nextId(), role: 'assistant', content: greeting, products: [], customOrder: false }]);
    setInput('');
    setLoading(false);
    inputRef.current?.focus();
  };

  /* A product click both routes (inside ProductCard) and closes the sheet. */
  const onProductPick = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('a')) onClose();
  };

  return (
    <>
      <div className="assistant-backdrop" data-open={open} onClick={onClose} aria-hidden="true" />
      <div
        className="assistant-drawer"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <header className="assistant-head">
          <div className="assistant-head-text">
            <p className="assistant-eyebrow">Fafari</p>
            <h2 className="assistant-title" id={titleId}>
              {ASSISTANT_TITLE}
            </h2>
          </div>
          <div className="assistant-head-actions">
            <button type="button" className="assistant-startover" onClick={startOver}>
              Start over
            </button>
            <button type="button" className="icon-btn assistant-close" aria-label="Close assistant" onClick={onClose}>
              <IconClose />
            </button>
          </div>
        </header>

        <div className="assistant-log" ref={logRef}>
          {messages.map((message) => (
            <div key={message.id} className={`assistant-msg assistant-msg--${message.role}`}>
              <div className="assistant-bubble">
                <p className="assistant-text">{message.content}</p>
              </div>

              {message.role === 'assistant' && message.products.length > 0 && (
                <ul className="assistant-products" onClick={onProductPick}>
                  {message.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </ul>
              )}

              {message.role === 'assistant' && message.customOrder && (
                <a
                  className="assistant-cta"
                  href={ASSISTANT_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discuss a custom order
                  <IconArrow className="assistant-cta-icon" />
                </a>
              )}
            </div>
          ))}

          {loading && (
            <div className="assistant-msg assistant-msg--assistant">
              <div className="assistant-bubble assistant-typing" role="status" aria-live="polite">
                <span className="assistant-dot" />
                <span className="assistant-dot" />
                <span className="assistant-dot" />
                <span className="visually-hidden">The assistant is thinking</span>
              </div>
            </div>
          )}
        </div>

        <form
          className="assistant-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <label className="visually-hidden" htmlFor={inputId}>
            Message the Fafari Assistant
          </label>
          <input
            id={inputId}
            ref={inputRef}
            className="assistant-input"
            type="text"
            value={input}
            placeholder="e.g. a birthday gift for my mum under GH₵500"
            autoComplete="off"
            autoCorrect="on"
            enterKeyHint="send"
            maxLength={MAX_MESSAGE_CHARS}
            onChange={(event) => setInput(event.target.value)}
          />
          <button type="submit" className="assistant-send" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </>
  );
}
