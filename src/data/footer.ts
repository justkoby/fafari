/* Site footer — copy and link columns live here, separate from the
   layout. Only routes that actually exist are listed: About Fafari,
   Contact, Delivery Information and FAQs have no pages yet, and a
   WhatsApp link would need a number we do not publish, so those items
   stay out entirely rather than pointing at "#". Add them here once
   their pages ship. */

export const FOOTER = {
  tagline: 'Thoughtful flowers and gifts for the moments that matter.',
  instagram: {
    href: 'https://www.instagram.com/fafari_gh/',
    label: 'Instagram',
  },
  copyright: 'Fafari. All rights reserved.',
};

export interface FooterLink {
  label: string;
  href: string;
  /** Optional element id on the target page to scroll to after routing. */
  anchor?: string;
}

export const FOOTER_COLUMNS: { id: string; title: string; items: FooterLink[] }[] = [
  {
    id: 'shop',
    title: 'Shop',
    items: [
      { label: 'Flowers', href: '/shop?cat=flowers' },
      { label: 'Gifts', href: '/shop?cat=gift-hampers,gift-sets' },
      { label: 'Plants', href: '/shop?cat=plants' },
      { label: 'All Products', href: '/shop' },
    ],
  },
  {
    id: 'explore',
    title: 'Explore',
    items: [
      /* The Client Cam gallery lives on the homepage; the link routes
         home and scrolls to the section. */
      { label: 'Client Cam', href: '/#client-cam', anchor: 'client-cam' },
    ],
  },
];
