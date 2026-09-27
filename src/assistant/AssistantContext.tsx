import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AssistantDrawer } from '../components/AssistantDrawer';
import { AssistantFab } from '../components/AssistantFab';
import type { AssistantSeed } from '../data/assistant';
import { readRoute } from '../router';

interface AssistantContextValue {
  /** Open the single assistant panel, optionally seeded with context. */
  open: (seed?: AssistantSeed) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

/** Open the assistant from anywhere in the tree. */
export function useAssistant(): AssistantContextValue {
  const value = useContext(AssistantContext);
  if (!value) throw new Error('useAssistant must be used inside <AssistantProvider>');
  return value;
}

/** Derive seed context from the current route so the discreet trigger still
    carries the visitor's search text and filters into the conversation. */
function seedFromRoute(): AssistantSeed {
  const route = readRoute();
  if (route.kind === 'search') return { query: route.query, category: route.category, price: route.price };
  if (route.kind === 'shop') return { category: route.category };
  return {};
}

/** Owns the one assistant panel for the site: open state + seed, the discreet
    fab, and the drawer. Mount once near the app root. */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<AssistantSeed | null>(null);

  const openAssistant = useCallback((explicit?: AssistantSeed) => {
    setSeed(explicit ?? seedFromRoute());
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open: openAssistant }), [openAssistant]);

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantFab open={open} onOpen={openAssistant} />
      <AssistantDrawer open={open} seed={seed} onClose={close} />
    </AssistantContext.Provider>
  );
}
