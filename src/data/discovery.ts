/* Guided discovery — occasions, gestures and a transparent recommendation
   engine. `recommend()` is a pure function over typed input so a real
   catalogue or AI service can replace its internals later without any
   change to the interface. Until then it only ever returns categories
   that already exist in the site navigation. */

import { PRODUCTS, formatPrice } from './products';

export type OccasionId = 'birthday' | 'love' | 'congratulations' | 'sympathy' | 'just-because';
export type GestureId = 'flowers' | 'flowers-gifts' | 'bespoke';

export interface DiscoveryOption {
  id: string;
  label: string;
}

export const OCCASIONS: DiscoveryOption[] = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'love', label: 'Love & Anniversary' },
  { id: 'congratulations', label: 'Congratulations' },
  { id: 'sympathy', label: 'Sympathy' },
  { id: 'just-because', label: 'Just Because' },
];

export const GESTURES: DiscoveryOption[] = [
  { id: 'flowers', label: 'Flowers' },
  { id: 'flowers-gifts', label: 'Flowers & Gifts' },
  { id: 'bespoke', label: 'Bespoke Gift' },
];

export interface CategoryRef {
  label: string;
  href: string;
}

/** A compact card in the "Picked for you" result area. */
export interface ResultCard {
  kind: 'product' | 'collection';
  name: string;
  /** Absent for products without a route yet — the card renders unlinked. */
  href?: string;
  /** Present only when confirmed in the catalogue. */
  price?: string;
  image: { src: string; alt: string; position: string };
  why: string;
}

export interface DiscoveryInput {
  occasion: OccasionId;
  gesture: GestureId;
  /** Optional free text from the visitor. */
  note: string;
}

export interface Recommendation {
  category: CategoryRef;
  occasionCollection: CategoryRef | null;
  explanation: string;
  /** Words from the note that shaped the result — shown, never hidden. */
  noteMatches: string[];
  cards: ResultCard[];
}

/* Real destinations only — mirrored from src/data/navigation.ts.
   `image` crops the supplied brand photograph (bg-01.jpg) as placeholder
   art until real catalogue imagery exists — no generated images. */
const CATEGORIES = {
  signature: {
    label: 'Signature Bouquets',
    href: '/flowers/signature-bouquets',
    image: { position: '66% 50%', alt: 'Hand-tied bouquet of alstroemeria wrapped in kraft paper' },
  },
  roses: {
    label: 'Roses',
    href: '/flowers/roses',
    image: { position: '80% 40%', alt: 'Bouquet held close against a burgundy studio wall' },
  },
  sympathyFlowers: {
    label: 'Sympathy Flowers',
    href: '/flowers/sympathy',
    image: { position: '60% 62%', alt: 'Soft blush and white stems from the FAFARI studio' },
  },
  bespoke: {
    label: 'Bespoke Arrangements',
    href: '/flowers/bespoke',
    image: { position: '70% 30%', alt: 'Seasonal stems arranged by hand in studio' },
  },
  boxes: {
    label: 'Curated Gift Boxes',
    href: '/gifts/curated-boxes',
    image: { position: '63% 92%', alt: 'Hands tying a red silk ribbon around a kraft-wrapped gift' },
  },
  corporate: {
    label: 'Corporate Gifts',
    href: '/gifts/corporate',
    image: { position: '63% 92%', alt: 'Hands tying a red silk ribbon around a kraft-wrapped gift' },
  },
  wrapping: {
    label: 'Gift Wrapping',
    href: '/gifts/wrapping',
    image: { position: '63% 92%', alt: 'Hands tying a red silk ribbon around a kraft-wrapped gift' },
  },
  dowry: {
    label: 'Engagement & Dowry Wrapping',
    href: '/gifts/engagement-dowry',
    image: { position: '63% 92%', alt: 'Hands tying a red silk ribbon around a kraft-wrapped gift' },
  },
} satisfies Record<string, CategoryRef & { image: { position: string; alt: string } }>;

const CARD_IMAGE_SRC = '/assets/bg-01.jpg';

const OCCASION_COLLECTIONS: Record<OccasionId, CardCategory | null> = {
  birthday: {
    label: 'Birthdays',
    href: '/occasions/birthdays',
    image: { position: '58% 44%', alt: 'Celebratory stems styled for a birthday moment' },
  },
  love: {
    label: 'Love & Anniversaries',
    href: '/occasions/anniversaries',
    image: { position: '80% 40%', alt: 'Deep rose tones from the love & anniversaries edit' },
  },
  congratulations: {
    label: 'Congratulations',
    href: '/occasions/congratulations',
    image: { position: '66% 50%', alt: 'Bright hand-tied bouquet for congratulations' },
  },
  sympathy: {
    label: 'Sympathy',
    href: '/occasions/sympathy',
    image: { position: '60% 62%', alt: 'Soft blush and white stems from the sympathy edit' },
  },
  'just-because': null,
};

/* Plain keyword rules for the optional note: readable, explainable, no model. */
const NOTE_RULES: { pattern: RegExp; category: CategoryRef; word: string }[] = [
  { pattern: /rose/i, category: CATEGORIES.roses, word: 'roses' },
  { pattern: /sympathy|condolen|loss/i, category: CATEGORIES.sympathyFlowers, word: 'sympathy' },
  { pattern: /box/i, category: CATEGORIES.boxes, word: 'a gift box' },
  { pattern: /dowry|engagement|traditional/i, category: CATEGORIES.dowry, word: 'engagement & dowry' },
  { pattern: /wrap/i, category: CATEGORIES.wrapping, word: 'wrapping' },
  { pattern: /corporate|office|company/i, category: CATEGORIES.corporate, word: 'corporate' },
  { pattern: /bespoke|custom|one-of-a-kind/i, category: CATEGORIES.bespoke, word: 'bespoke' },
  { pattern: /bouquet/i, category: CATEGORIES.signature, word: 'a bouquet' },
];

function baseCategory(occasion: OccasionId, gesture: GestureId): CategoryRef {
  if (gesture === 'flowers-gifts') return CATEGORIES.boxes;
  if (gesture === 'bespoke') return CATEGORIES.bespoke;
  if (occasion === 'sympathy') return CATEGORIES.sympathyFlowers;
  if (occasion === 'love') return CATEGORIES.roses;
  return CATEGORIES.signature;
}

type CardCategory = CategoryRef & { image: { position: string; alt: string } };

function collectionCard(category: CardCategory, why: string): ResultCard {
  return {
    kind: 'collection',
    name: category.label,
    href: category.href,
    image: { src: CARD_IMAGE_SRC, alt: category.image.alt, position: category.image.position },
    why,
  };
}

/** Real products first; while the catalogue is empty, collections instead. */
function pickCards(input: DiscoveryInput, primary: CategoryRef, occasionLabel: string, gestureLabel: string): ResultCard[] {
  const note = input.note.trim().toLowerCase();
  const matching = PRODUCTS.filter(
    (product) => product.occasions.includes(input.occasion) && product.gestures.includes(input.gesture),
  ).sort((a, b) => {
    const aHit = a.keywords?.some((word) => note.includes(word.toLowerCase())) ? 1 : 0;
    const bHit = b.keywords?.some((word) => note.includes(word.toLowerCase())) ? 1 : 0;
    return bHit - aHit;
  });

  if (matching.length > 0) {
    return matching.slice(0, 3).map((product) => ({
      kind: 'product' as const,
      name: product.name,
      href: `/product/${product.id}`,
      price: formatPrice(product.price),
      image: { ...product.image, position: '50% 50%' },
      why: product.why,
    }));
  }

  const cards: ResultCard[] = [];
  cards.push(
    collectionCard(
      primary as CardCategory,
      `Chosen for ${occasionLabel.toLowerCase()} celebrated with ${gestureLabel.toLowerCase()}.`,
    ),
  );
  const occasionCollection = OCCASION_COLLECTIONS[input.occasion];
  if (occasionCollection && occasionCollection.href !== primary.href) {
    cards.push(collectionCard(occasionCollection, `The occasion edit for ${occasionLabel.toLowerCase()}.`));
  }
  if (cards.length < 3 && primary.href !== CATEGORIES.wrapping.href) {
    cards.push(collectionCard(CATEGORIES.wrapping, 'Hand-finished presentation for the gift.'));
  }
  return cards.slice(0, 3);
}

export function recommend(input: DiscoveryInput): Recommendation {
  const occasionLabel = OCCASIONS.find((o) => o.id === input.occasion)?.label ?? '';
  const gestureLabel = GESTURES.find((g) => g.id === input.gesture)?.label ?? '';
  const occasionCollection = OCCASION_COLLECTIONS[input.occasion];
  const note = input.note.trim();

  const hit = note ? NOTE_RULES.find((rule) => rule.pattern.test(note)) : undefined;
  const category = hit ? hit.category : baseCategory(input.occasion, input.gesture);

  const cards = pickCards(input, category, occasionLabel, gestureLabel);
  const productNames = cards.filter((card) => card.kind === 'product').map((card) => card.name);

  let explanation = productNames.length
    ? `When the moment is ${occasionLabel} and the gesture is ${gestureLabel.toLowerCase()}, the studio catalogue offers ${productNames.join(', ')}.`
    : `When the moment is ${occasionLabel} and the gesture is ${gestureLabel.toLowerCase()}, we begin with the ${category.label} collection.`;
  explanation += occasionCollection
    ? ` The ${occasionCollection.label} edit adds pieces chosen for exactly this.`
    : ' And for a moment that needs no reason at all, our stylists let the season lead.';
  if (hit) {
    explanation += ` Your note mentioned ${hit.word}, so we pointed you straight there.`;
  } else if (note) {
    explanation += ' Your note travels with this recommendation so our stylists can honour every detail.';
  }

  return {
    category,
    occasionCollection,
    explanation,
    noteMatches: hit ? [hit.word] : [],
    cards,
  };
}
