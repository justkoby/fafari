import { CUSTOM_ORDER } from '../data/customOrder';
import { IconArrow } from './Icons';

/** "Made for Your Moment" — the considered close between Client Cam and
    the footer: one burgundy breath with a single invitation. No form,
    no promises — the CTA opens a prefilled WhatsApp chat. */
export function CustomOrderSection() {
  return (
    <section className="custom-order" aria-labelledby="custom-order-title">
      <div className="custom-order-inner">
        <p className="custom-order-eyebrow">{CUSTOM_ORDER.eyebrow}</p>
        <h2 className="section-title custom-order-title" id="custom-order-title">
          {CUSTOM_ORDER.title}
        </h2>
        <p className="custom-order-body">{CUSTOM_ORDER.body}</p>
        <a
          className="custom-order-cta"
          href={CUSTOM_ORDER.cta.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {CUSTOM_ORDER.cta.label}
          <IconArrow className="custom-order-cta-icon" />
        </a>
      </div>
    </section>
  );
}
