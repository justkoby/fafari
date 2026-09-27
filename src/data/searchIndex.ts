import { NAV_ITEMS } from './navigation';
import { PRODUCTS, type Product } from './products';

export interface SearchEntry {
  label: string;
  href: string;
  category: string;
  tags: string[];
}

/* Curated empty-state suggestions. Popular terms are checked against the
   catalogue — each returns relevant products. Explore chips deep-link into
   the shop with a category selected. */
export const POPULAR_SEARCHES = ['Roses', 'Birthday Gifts', 'Plants', 'Wine Gifts'];

export const EXPLORE_CATEGORIES: { label: string; href: string }[] = [
  { label: 'Flowers', href: '/shop?cat=flowers' },
  { label: 'Gifts & Hampers', href: '/shop?cat=gift-hampers' },
  { label: 'Plants', href: '/shop?cat=plants' },
  { label: 'Wine Gifts', href: '/shop?cat=wine-gifts' },
];

/* Non-product content: navigation categories, their links and column tags.
   Kept separate from the catalogue so service links (Gift Wrapping, …)
   never surface as purchasable results. */
const NAV_ENTRIES: SearchEntry[] = NAV_ITEMS.flatMap((item) => {
  if (!item.menu) {
    return [{ label: item.label, href: item.href ?? '/', category: 'Our Story', tags: ['studio', 'story'] }];
  }
  return item.menu.columns.flatMap((column) =>
    column.links.map((link) => ({
      label: link.label,
      href: link.href,
      category: item.label,
      tags: [column.heading.toLowerCase(), item.id, ...(item.id === 'occasions' ? ['occasion'] : [])],
    })),
  );
});

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

/** Case-insensitive token match across nav labels, categories and tags. */
export function searchNavEntries(query: string): SearchEntry[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  return NAV_ENTRIES.map((entry) => {
    const label = entry.label.toLowerCase();
    const haystack = `${label} ${entry.category.toLowerCase()} ${entry.tags.join(' ')}`;
    let score = 0;
    for (const token of tokens) {
      if (label.startsWith(token)) score += 3;
      else if (label.includes(token)) score += 2;
      else if (haystack.includes(token)) score += 1;
    }
    return { entry, score };
  })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
    .map((result) => result.entry);
}

/* Deterministic product matching shared by the header overlay and the
   results page so the two can never disagree. Every token must qualify
   against the name, curated search terms, category or tags — a description
   mention only reinforces the score, never qualifies on its own. That keeps
   broad words like "luxury" or "gold" from dragging in irrelevant pieces. */
export function searchProducts(query: string): Product[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  return PRODUCTS.map((product) => ({ product, score: scoreProduct(product, tokens) }))
    .filter((result): result is { product: Product; score: number } => result.score !== null)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .map((result) => result.product);
}

function scoreProduct(product: Product, tokens: string[]): number | null {
  const name = product.name.toLowerCase();
  const category = product.category.toLowerCase();
  const tags = product.tags.join(' ').toLowerCase();
  const terms = product.searchTerms.join(' ').toLowerCase();
  const description = product.description.toLowerCase();

  let total = 0;
  for (const token of tokens) {
    /* Plural handling only for real plurals — stripping "s" from short
       tokens ("ros" -> "ro") would over-match unrelated words. */
    const variants = [token, `${token}s`];
    if (token.endsWith('s') && token.length >= 5) variants.push(token.slice(0, -1));
    const unique = variants.filter((variant, index, all) => all.indexOf(variant) === index);
    let best = 0;
    for (const variant of unique) {
      if (name.startsWith(variant)) best = Math.max(best, 4);
      else if (name.includes(variant)) best = Math.max(best, 3);
      else if (terms.includes(variant)) best = Math.max(best, 3);
      else if (category.includes(variant) || tags.includes(variant)) best = Math.max(best, 2);
    }
    if (best === 0) return null;
    total += best;
    if (description.includes(token)) total += 1;
  }
  return total;
}
