import type { GestureId, OccasionId } from './discovery';

/* The studio catalogue — the single source of truth for products.
   Images live in public/products/ at a native 5:6 ratio. Prices are
   presentation-only sample data in Ghana cedis: edit the number here and
   every card, detail view and recommendation chip follows. Occasion and
   gesture tags are plain editorial classification derived from the tags
   below, used by the guided gift finder — deterministic, never AI. */

export type ProductCategory = 'Flowers' | 'Gift Hampers' | 'Plants' | 'Wine Gifts' | 'Gift Sets';

export interface Product {
  /** Stable slug — used in /product/<id> routes. */
  id: string;
  name: string;
  category: ProductCategory;
  /** Sample presentation price in GHS. */
  price: number;
  description: string;
  image: { src: string; alt: string };
  tags: string[];
  /** Curated synonyms that qualify a search token for this product.
      Kept separate from tags so broad words like "luxury" only surface
      the pieces we actually merchandise under them. */
  searchTerms: string[];
  occasions: OccasionId[];
  gestures: GestureId[];
  /** Note keywords that rank this product higher in the gift finder. */
  keywords: string[];
  /** One short line explaining why the gift finder picks it. */
  why: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Flowers',
  'Gift Hampers',
  'Plants',
  'Wine Gifts',
  'Gift Sets',
];

/** Fafari's Valentine's Day rose bouquet price list, supplied as a reference.
 * Seasonal guide prices are kept separate from the everyday sample catalogue. */
export const VALENTINE_ROSE_OPTIONS = [
  { roses: 1, price: 85 },
  { roses: 6, price: 500 },
  { roses: 10, price: 800 },
  { roses: 12, price: 950 },
  { roses: 20, price: 1500 },
  { roses: 30, price: 2250 },
  { roses: 50, price: 3700 },
  { roses: 100, price: 7250 },
] as const;

/** GH₵1,850 — thousands separated, cedi prefix. */
export function formatPrice(cedis: number): string {
  return `GH₵${cedis.toLocaleString('en-US')}`;
}

/** URL slug for a category — used by /shop?cat=… deep links. */
export function categorySlug(category: ProductCategory): string {
  return category.toLowerCase().replace(/\s+/g, '-');
}

export const PRODUCTS: Product[] = [
  {
    id: 'blush-and-bloom-bouquet',
    name: 'Blush & Bloom Bouquet',
    category: 'Flowers',
    price: 650,
    description:
      'A soft arrangement of pink roses, white and lavender chrysanthemums, and delicate seasonal blooms, finished in blush wrapping with gold detail.',
    image: {
      src: '/products/fafari-blush-bloom-500x600.png',
      alt: 'Hand-tied bouquet of pink roses and white and lavender chrysanthemums in blush wrapping',
    },
    tags: ['romance', 'birthday', 'thank you', 'pink', 'bouquet'],
    searchTerms: [
      'roses',
      'rose',
      'pink',
      'bouquet',
      'flowers',
      'flower',
      'romance',
      'birthday',
      'thank you',
      'chrysanthemum',
    ],
    occasions: ['love', 'birthday', 'just-because'],
    gestures: ['flowers'],
    keywords: ['pink', 'blush', 'rose', 'bouquet'],
    why: 'Soft pink roses and seasonal blooms, hand-tied in blush wrapping.',
  },
  {
    id: 'vlisco-celebration-hamper',
    name: 'The Vlisco Celebration Hamper',
    category: 'Gift Hampers',
    price: 1850,
    description:
      'A generous gift set featuring Vlisco African print fabric, Baylis & Harding bath essentials, Montebolle sparkling wine, two glasses, and a greeting card.',
    image: {
      src: '/products/fafari-vlisco-celebration-hamper-500x600.png',
      alt: 'Vlisco African print hamper with bath essentials, sparkling wine and two glasses',
    },
    tags: ['celebration', 'luxury', 'mother', 'fabric', 'wine', 'hamper'],
    searchTerms: [
      'luxury',
      'gifts',
      'gift',
      'hamper',
      'box',
      'corporate',
      'celebration',
      'birthday',
      'wine',
      'fabric',
      'mother',
    ],
    occasions: ['birthday', 'congratulations'],
    gestures: ['flowers-gifts'],
    keywords: ['vlisco', 'fabric', 'hamper', 'wine', 'luxury'],
    why: 'Vlisco print, bath essentials and sparkling wine for a milestone.',
  },
  {
    id: 'heartfelt-gift-box',
    name: 'Heartfelt Gift Box',
    category: 'Gift Hampers',
    price: 850,
    description:
      'A burgundy gift box with a cream teddy bear, red heart balloon, drink, sweet treat, and greeting card for a warm romantic gesture.',
    image: {
      src: '/products/fafari-heartfelt-gift-box-500x600.png',
      alt: 'Burgundy gift box with cream teddy bear, red heart balloon, drink and sweet treat',
    },
    tags: ['romance', 'anniversary', 'valentine', 'teddy bear', 'balloon'],
    searchTerms: [
      'luxury',
      'gifts',
      'gift',
      'hamper',
      'box',
      'romance',
      'valentine',
      'anniversary',
      'birthday',
      'teddy',
    ],
    occasions: ['love', 'birthday'],
    gestures: ['flowers-gifts'],
    keywords: ['teddy', 'balloon', 'box', 'valentine'],
    why: 'Teddy, balloon and sweet treats in one romantic box.',
  },
  {
    id: 'snake-plant-geometric-pot',
    name: 'Snake Plant in Geometric Pot',
    category: 'Plants',
    price: 350,
    description:
      'A striking, easy-care snake plant presented in a white geometric planter—an elegant gift for the home or office.',
    image: {
      src: '/products/fafari-snake-plant-500x600.png',
      alt: 'Snake plant in a white geometric ceramic planter',
    },
    tags: ['plant', 'home', 'office', 'housewarming', 'green'],
    searchTerms: ['plant', 'plants', 'greenery', 'houseplant', 'pot', 'planter', 'office', 'home', 'green'],
    occasions: ['congratulations', 'just-because'],
    gestures: ['bespoke'],
    keywords: ['snake', 'plant', 'green', 'office'],
    why: 'Easy-care greenery in a sculpted white geometric pot.',
  },
  {
    id: 'lush-palm-wooden-planter',
    name: 'Lush Palm in Wooden Planter',
    category: 'Plants',
    price: 550,
    description:
      'A full, vibrant indoor palm in a dark wooden slat planter, bringing natural texture and greenery to any space.',
    image: {
      src: '/products/fafari-palm-wooden-planter-500x600.png',
      alt: 'Full indoor palm planted in a dark wooden slat planter',
    },
    tags: ['plant', 'home', 'office', 'housewarming', 'palm'],
    searchTerms: [
      'plant',
      'plants',
      'greenery',
      'houseplant',
      'palm',
      'planter',
      'wooden',
      'office',
      'home',
    ],
    occasions: ['congratulations', 'just-because'],
    gestures: ['bespoke'],
    keywords: ['palm', 'wooden', 'planter', 'plant'],
    why: 'A full indoor palm in a dark wooden slat planter.',
  },
  {
    id: 'palm-gold-bowl-planter',
    name: 'Palm in Gold Bowl Planter',
    category: 'Plants',
    price: 950,
    description:
      'Abundant palm foliage arranged in a large textured gold bowl planter—a statement gift for interiors and special spaces.',
    image: {
      src: '/products/fafari-palm-gold-bowl-500x600.png',
      alt: 'Abundant palm foliage in a large textured gold bowl planter',
    },
    tags: ['plant', 'home', 'office', 'palm', 'gold'],
    searchTerms: [
      'plant',
      'plants',
      'greenery',
      'houseplant',
      'palm',
      'planter',
      'gold',
      'bowl',
      'statement',
    ],
    occasions: ['congratulations', 'just-because'],
    gestures: ['bespoke'],
    keywords: ['palm', 'gold', 'bowl', 'plant', 'luxury'],
    why: 'Statement palm foliage in a textured gold bowl.',
  },
  {
    id: 'crimson-wine-gift',
    name: 'The Crimson Wine Gift',
    category: 'Wine Gifts',
    price: 420,
    description:
      'A bottle of wine dressed in sculptural crimson wrapping, greenery, and a matching ribbon for an elegant ready-to-give present.',
    image: {
      src: '/products/fafari-wrapped-wine-gift-500x600.png',
      alt: 'Bottle of wine in sculptural crimson wrapping with greenery and a matching ribbon',
    },
    tags: ['wine', 'celebration', 'anniversary', 'thank you'],
    searchTerms: [
      'wine',
      'bottle',
      'gifts',
      'gift',
      'celebration',
      'anniversary',
      'thank you',
      'wrapped',
    ],
    occasions: ['congratulations', 'love', 'just-because'],
    gestures: ['flowers-gifts', 'bespoke'],
    keywords: ['wine', 'crimson', 'wrapped'],
    why: 'A bottle dressed in sculptural crimson wrapping, ready to give.',
  },
  {
    id: 'sunshine-and-roses-bouquet',
    name: 'Sunshine & Roses Bouquet',
    category: 'Flowers',
    price: 580,
    description:
      'A cheerful mix of yellow and white chrysanthemums, purple blooms, and red roses in crisp white wrapping and a red Fafari gift bag.',
    image: {
      src: '/products/fafari-sunshine-bouquet-500x600.png',
      alt: 'Cheerful bouquet of yellow and white chrysanthemums, purple blooms and red roses in white wrapping',
    },
    tags: ['birthday', 'congratulations', 'cheer up', 'mixed bouquet'],
    searchTerms: [
      'roses',
      'rose',
      'bouquet',
      'flowers',
      'flower',
      'birthday',
      'congratulations',
      'cheer',
      'chrysanthemum',
    ],
    occasions: ['birthday', 'congratulations'],
    gestures: ['flowers'],
    keywords: ['yellow', 'sunshine', 'bouquet', 'cheer'],
    why: 'Yellow and white chrysanthemums with red roses to lift the day.',
  },
  {
    id: 'roses-and-romance-gift-set',
    name: 'Roses & Romance Gift Set',
    category: 'Gift Sets',
    price: 1100,
    description:
      'Red roses in a clear presentation box paired with Amor chocolates, Edikanfo white wine, and a Valentine card.',
    image: {
      src: '/products/fafari-valentine-roses-wine-set-500x600.png',
      alt: 'Red roses in a clear presentation box with chocolates, white wine and a Valentine card',
    },
    tags: ['romance', 'valentine', 'anniversary', 'roses', 'chocolate', 'wine'],
    searchTerms: [
      'roses',
      'rose',
      'luxury',
      'gifts',
      'gift',
      'set',
      'romance',
      'valentine',
      'anniversary',
      'chocolate',
      'wine',
    ],
    occasions: ['love'],
    gestures: ['flowers-gifts'],
    keywords: ['rose', 'chocolate', 'wine', 'valentine', 'romance'],
    why: 'Red roses, chocolates and white wine for the romantics.',
  },
];

/* "This Week at Fafari" — merchandising order for the homepage weekly edit. */
const WEEKLY_EDIT_SLUGS = [
  'blush-and-bloom-bouquet',
  'heartfelt-gift-box',
  'snake-plant-geometric-pot',
  'vlisco-celebration-hamper',
];

export const WEEKLY_EDIT: Product[] = WEEKLY_EDIT_SLUGS.map((slug) => productBySlug(slug)).filter(
  (product): product is Product => product !== undefined,
);

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === slug);
}

/* "Shop by Category" — one full-bleed editorial tile per collection on the
   homepage. Imagery lives in public/assets/; hrefs deep-link into the shop
   with the matching filter applied (Gifts & Hampers spans two catalogue
   categories). */
export interface CategoryTile {
  label: string;
  href: string;
  image: { src: string; alt: string };
}

export const CATEGORY_TILES: CategoryTile[] = [
  {
    label: 'Flowers',
    href: '/shop?cat=flowers',
    image: {
      src: '/assets/flowers-category.png',
      alt: 'Hand-tied bouquet of coral carnations, burgundy daisies and yellow blooms',
    },
  },
  {
    label: 'Gifts & Hampers',
    href: '/shop?cat=gift-hampers,gift-sets',
    image: {
      src: '/assets/gifts-category.png',
      alt: 'Couple embracing behind a burgundy Fafari gift box tied with a satin bow',
    },
  },
  {
    label: 'Plants',
    href: '/shop?cat=plants',
    image: {
      src: '/assets/plants-cart.png',
      alt: 'Stylist arranging pale blossom branches in a gold cylinder vase',
    },
  },
  {
    label: 'Wine Gifts',
    href: '/shop?cat=wine-gifts',
    image: {
      src: '/assets/wine-gift-category.png',
      alt: 'Bottle of red wine revealed in a velvet-lined presentation box',
    },
  },
];
