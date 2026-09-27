/* Site footer — copy and link columns live here, separate from the
   layout. Only routes that actually exist are listed: About Fafari,
   Delivery Information and FAQs have no pages yet, so those items stay
   out entirely rather than pointing at "#". Add them here once their
   pages ship. The contact numbers are the studio's published details. */

export const FOOTER = {
  tagline: 'Thoughtful flowers and gifts for the moments that matter.',
  description:
    'Fafari is a florist in Accra offering bespoke floral arrangements, gifts, interior styling, and event services.',
  copyright: 'Fafari. All rights reserved.',
};

export interface FooterLink {
  label: string;
  href: string;
  /** Plain-text lead-in rendered before the link, e.g. "Call:". */
  prefix?: string;
  /** External targets open in a new tab. */
  external?: boolean;
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
  {
    id: 'contact',
    title: 'Contact Us',
    items: [
      { prefix: 'Call:', label: '+233 24 420 3010', href: 'tel:+233244203010' },
      { prefix: 'WhatsApp:', label: '+233 50 658 0545', href: 'https://wa.me/233506580545', external: true },
      { prefix: 'Instagram:', label: '@fafari_gh', href: 'https://www.instagram.com/fafari_gh/', external: true },
    ],
  },
];
