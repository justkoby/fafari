/* Fafari Assistant — client-side config and pure helpers.

   Copy, the endpoint path and the WhatsApp fallback live here so they can
   be revised in one place. The catalogue stays the single source of truth:
   the server returns product *ids* and we resolve them back to the real
   Product objects (real image, name, GH₵ price and /product/<id> link)
   before rendering, so a bad id can never reach the screen. */

import { PRODUCT_CATEGORIES, categorySlug, formatPrice, productBySlug, type Product } from './products';

/** Same-origin serverless route (Vercel function; Vite middleware in dev). */
export const ASSISTANT_ENDPOINT = '/api/assistant';

/** Bespoke-order escape hatch when nothing in the catalogue fits. */
export const ASSISTANT_WHATSAPP = 'https://wa.me/233506580545';

export const ASSISTANT_TITLE = 'Fafari Assistant';

export const ASSISTANT_GREETING =
  "Hi — I'm the Fafari Assistant. Tell me the occasion, who it's for and your budget, and I'll suggest something from the studio.";

/** Shown when the request itself fails (offline, non-JSON, server error). */
export const ASSISTANT_FALLBACK =
  "I'm having trouble reaching the studio assistant right now. Please try again in a moment, or message us on WhatsApp and a real person will help you personally.";

/** Hard caps mirror the server so the client never sends an oversized body. */
export const MAX_MESSAGE_CHARS = 600;
export const MAX_HISTORY_TURNS = 6;

export interface AssistantSeed {
  query?: string;
  category?: string | null;
  price?: string | null;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Price bands mirror SearchResultsView so the summary reads the same. */
const PRICE_LABELS: Record<string, string> = {
  'under-500': `Under ${formatPrice(500)}`,
  '500-1000': `${formatPrice(500)} – ${formatPrice(1000)}`,
  'over-1000': `Over ${formatPrice(1000)}`,
};

/** Resolve validated ids to real catalogue products, dropping unknowns. */
export function resolveProducts(ids: string[] | null | undefined): Product[] {
  if (!Array.isArray(ids)) return [];
  const out: Product[] = [];
  for (const id of ids) {
    const product = typeof id === 'string' ? productBySlug(id) : undefined;
    if (product && !out.some((existing) => existing.id === product.id)) out.push(product);
    if (out.length >= 3) break;
  }
  return out;
}

/** Turn a comma-separated category slug filter into readable labels. */
function labelCategories(category: string | null | undefined): string[] {
  if (!category) return [];
  const slugs = category.split(',').filter(Boolean);
  return PRODUCT_CATEGORIES.filter((item) => slugs.includes(categorySlug(item)));
}

/** Human-readable summary of the seed carried into the conversation. */
export function describeSeed(seed: AssistantSeed | null): string {
  if (!seed) return '';
  const parts: string[] = [];
  if (seed.query && seed.query.trim()) parts.push(`search text "${seed.query.trim()}"`);
  const categories = labelCategories(seed.category);
  if (categories.length) parts.push(`category filter ${categories.join(', ')}`);
  const price = seed.price ? PRICE_LABELS[seed.price] : undefined;
  if (price) parts.push(`price filter ${price}`);
  return parts.join('; ');
}

/** Recent turns as plain {role, content}, bounded for the request body. */
export function buildHistory(turns: ChatTurn[]): ChatTurn[] {
  return turns.slice(-MAX_HISTORY_TURNS).map((turn) => ({
    role: turn.role,
    content: turn.content.slice(0, MAX_MESSAGE_CHARS),
  }));
}
