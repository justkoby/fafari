import { IconArrow } from './Icons';

export function Hero() {
  return (
    <section className="hero" id="hero" aria-labelledby="hero-title">
      <div className="hero-media" aria-hidden="true">
        <img className="hero-img" src="/assets/bg-01.jpg" alt="" />
        <div className="hero-scrim hero-scrim--top" />
        <div className="hero-scrim hero-scrim--side" />
      </div>

      <div className="hero-content">
        <div className="hero-copy">
          <h1 className="hero-title" id="hero-title">
            <span className="hero-title-primary">
              Make every gesture <span className="hero-accent">unforgettable.</span>
            </span>
            <span className="hero-title-compact">Every gesture, unforgettable.</span>
          </h1>
          <p className="hero-lede">
            Bespoke flowers and thoughtfully curated gifts for life&rsquo;s meaningful moments.
          </p>
          <div className="hero-cta">
            <a className="btn btn--gold" href="/flowers">
              Explore Flowers
            </a>
            <a className="hero-secondary" href="/services">
              Discover Our Services
              <IconArrow className="hero-secondary-icon" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
