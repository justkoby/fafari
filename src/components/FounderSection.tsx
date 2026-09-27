import { useEffect, useState } from 'react';
import { FOUNDER_NOTE, FOUNDER_SLIDES } from '../data/founder';

/** Each slide holds for this long; the CSS opacity transition (800ms)
    forms the crossfade into the next frame. */
const SLIDE_MS = 4000;

/** "A Note from Our Founder" — an editorial ivory band after the category
    cards: a fixed-frame crossfade slideshow of the founder at work anchors
    the left, the static note answers right. The timer pauses while the tab
    is hidden and never starts under prefers-reduced-motion, which leaves
    the first frame showing statically. */
export function FounderSection() {
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let timer: number | undefined;
    const start = () => {
      if (timer === undefined) {
        timer = window.setInterval(() => setActive((i) => (i + 1) % FOUNDER_SLIDES.length), SLIDE_MS);
      }
    };
    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  return (
    <section className="founder" aria-labelledby="founder-title">
      <div className="founder-inner">
        <div
          className="founder-frame"
          role="group"
          aria-roledescription="slideshow"
          aria-label="Photographs of the Fafari founder and her team at work"
        >
          {FOUNDER_SLIDES.map((slide, index) => (
            <img
              key={slide.src}
              className={`founder-slide founder-slide--${index + 1}`}
              src={slide.src}
              alt={slide.alt}
              data-active={index === active}
              aria-hidden={index !== active}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
        </div>
        <div className="founder-note">
          <h2 className="section-title founder-title" id="founder-title">
            {FOUNDER_NOTE.title}
          </h2>
          <p className="founder-body">{FOUNDER_NOTE.body}</p>
          <p className="founder-attribution">{FOUNDER_NOTE.attribution}</p>
        </div>
      </div>
    </section>
  );
}
