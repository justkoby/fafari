export interface NavLeaf {
  label: string;
  href: string;
}

export interface NavColumn {
  heading: string;
  links: NavLeaf[];
}

export interface NavMenu {
  id: string;
  columns: NavColumn[];
  editorial: {
    script: string;
    line: string;
    cta: NavLeaf;
  };
  /** Placeholder art: crops of the supplied brand photo (bg-01.jpg).
      Swap `src` for real campaign imagery when it exists — no generated images. */
  tile: {
    src: string;
    alt: string;
    caption: string;
    /** object-position crop of the source photograph for this tile */
    position: string;
  };
}

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  menu?: NavMenu;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'flowers',
    label: 'Flowers',
    menu: {
      id: 'flowers',
      columns: [
        {
          heading: 'Collections',
          links: [
            { label: 'Signature Bouquets', href: '/flowers/signature-bouquets' },
            { label: 'Roses', href: '/flowers/roses' },
          ],
        },
        {
          heading: 'With Meaning',
          links: [
            { label: 'Sympathy Flowers', href: '/flowers/sympathy' },
            { label: 'Bespoke Arrangements', href: '/flowers/bespoke' },
          ],
        },
      ],
      editorial: {
        script: 'in bloom',
        line: 'Seasonal stems, arranged by hand in studio.',
        cta: { label: 'View all flowers', href: '/flowers' },
      },
      tile: {
        src: '/assets/bg-01.jpg',
        alt: 'Hand-tied bouquet of red, purple and blush alstroemeria wrapped in kraft paper',
        caption: 'The Signature Edit',
        position: '66% 50%',
      },
    },
  },
  {
    id: 'gifts',
    label: 'Gifts',
    menu: {
      id: 'gifts',
      columns: [
        {
          heading: 'Gifting',
          links: [
            { label: 'Curated Gift Boxes', href: '/gifts/curated-boxes' },
            { label: 'Corporate Gifts', href: '/gifts/corporate' },
          ],
        },
        {
          heading: 'Presentation',
          links: [
            { label: 'Gift Wrapping', href: '/gifts/wrapping' },
            { label: 'Engagement & Dowry Wrapping', href: '/gifts/engagement-dowry' },
          ],
        },
      ],
      editorial: {
        script: 'wrapped well',
        line: 'Every box finished by hand, ribbon and all.',
        cta: { label: 'View all gifts', href: '/gifts' },
      },
      tile: {
        src: '/assets/bg-01.jpg',
        alt: 'Hands tying a red silk ribbon around a kraft-wrapped bouquet',
        caption: 'The Gifting Table',
        position: '63% 92%',
      },
    },
  },
  {
    id: 'occasions',
    label: 'Occasions',
    menu: {
      id: 'occasions',
      columns: [
        {
          heading: 'Celebrate',
          links: [
            { label: 'Birthdays', href: '/occasions/birthdays' },
            { label: 'Love & Anniversaries', href: '/occasions/anniversaries' },
          ],
        },
        {
          heading: 'Honour',
          links: [
            { label: 'Congratulations', href: '/occasions/congratulations' },
            { label: 'Sympathy', href: '/occasions/sympathy' },
          ],
        },
      ],
      editorial: {
        script: 'for the moment',
        line: 'Flowers that say what words cannot.',
        cta: { label: 'View all occasions', href: '/occasions' },
      },
      tile: {
        src: '/assets/bg-01.jpg',
        alt: 'A bouquet held close against a burgundy studio wall',
        caption: 'Moments & Milestones',
        position: '80% 40%',
      },
    },
  },
  {
    id: 'events',
    label: 'Events',
    menu: {
      id: 'events',
      columns: [
        {
          heading: 'Style',
          links: [
            { label: 'Weddings', href: '/events/weddings' },
            { label: 'Corporate Events', href: '/events/corporate' },
          ],
        },
        {
          heading: 'Gather',
          links: [
            { label: 'Celebrations', href: '/events/celebrations' },
            { label: 'Enquire About an Event', href: '/events/enquire' },
          ],
        },
      ],
      editorial: {
        script: 'gather well',
        line: 'From first sketch to final stem, we style the room.',
        cta: { label: 'View event styling', href: '/events' },
      },
      tile: {
        src: '/assets/bg-01.jpg',
        alt: 'Warm window light falling across a burgundy plaster studio wall',
        caption: 'Weddings & Events',
        position: '12% 45%',
      },
    },
  },
  {
    id: 'our-story',
    label: 'Our Story',
    href: '/our-story',
  },
];
