/* "A Note from Our Founder" — copy and imagery live here, separate from
   the layout, so the note can be revised verbatim after the founder's
   review without touching the section component. */

export const FOUNDER_NOTE = {
  title: 'A Note from Our Founder',
  body:
    'Flowers have a way of saying what we sometimes struggle to put into words. At Fafari, I want every arrangement to feel personal, whether it is celebrating someone, offering comfort, or simply brightening an ordinary day. We choose each detail with care because the feeling behind the gift matters just as much as the flowers themselves.',
  attribution: 'Founder, Fafari',
};

/* The slideshow frames: one fixed 4:5 window, five studio moments.
   Each slide carries its own alt and its crop is tuned per photo in
   founder.css (.founder-slide--N object-position) so faces and the
   action stay inside the frame at every width. */
export const FOUNDER_SLIDES: { src: string; alt: string }[] = [
  {
    src: '/assets/founder-1.jpg',
    alt: 'Portrait of the Fafari founder smiling, seated on a burgundy velvet sofa in a cream headwrap and kente-print dress',
  },
  {
    src: '/assets/founder-2.jpg',
    alt: 'The founder leaning over a leafy potted plant outdoors, tending it against a green hedge',
  },
  {
    src: '/assets/founder-3.jpg',
    alt: 'The founder and a colleague re-potting a trailing string-of-pearls plant together under a shaded courtyard',
  },
  {
    src: '/assets/founder-4.jpg',
    alt: 'The founder in sheer gloves inspecting an anthurium in a tall white planter beside a sunlit window',
  },
  {
    src: '/assets/founder-5.jpg',
    alt: 'The founder laughing with her Fafari team in the studio, the team in white shirts with celebration balloons behind',
  },
];
