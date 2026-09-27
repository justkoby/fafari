/* "Client Cam" — copy and imagery live here, separate from the layout,
   so captions and the Instagram handle can be revised without touching
   the section component. */

export const CLIENT_CAM = {
  eyebrow: 'Client Cam',
  title: 'Flowers, out in the world',
  intro: 'A few of the moments you have shared with us.',
  instagram: {
    href: 'https://www.instagram.com/fafari_gh/',
    label: 'See more on Instagram',
  },
};

/* The gallery frames: client-1 anchors the layout as the featured image,
   client-4 (two subjects side by side) takes the wide slot, and client-2
   and client-3 sit beneath it. Each crop is tuned per photo in
   client-cam.css (.client-tile--N .client-media object-position) so the
   clients and their bouquets stay inside the frame. */
export const CLIENT_CAM_IMAGES: { src: string; alt: string; slot: 'featured' | 'wide' | 'half' }[] = [
  {
    src: '/assets/client-1.jpg',
    alt: 'Two smiling clients standing outdoors beneath palm trees, one holding a pink-wrapped bouquet of white chrysanthemums and pink roses',
    slot: 'featured',
  },
  {
    src: '/assets/client-4.jpg',
    alt: 'A client in a navy dress beside a uniformed officer holding a red-and-gold wrapped bouquet of roses and purple statice in an office',
    slot: 'wide',
  },
  {
    src: '/assets/client-2.jpg',
    alt: 'A client in a yellow dress and glasses holding a lilac-wrapped bouquet of pink roses and burgundy dahlias beside a celebration cake',
    slot: 'half',
  },
  {
    src: '/assets/client-3.jpg',
    alt: 'A mother in a red wax-print dress and black headwrap seated with a bouquet of lilies and chrysanthemums and a Thank Mother card',
    slot: 'half',
  },
];
