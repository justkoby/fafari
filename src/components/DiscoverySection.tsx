import { useRef, useState } from 'react';
import {
  GESTURES,
  OCCASIONS,
  recommend,
  type GestureId,
  type OccasionId,
  type Recommendation,
  type ResultCard,
} from '../data/discovery';
import { IconArrow } from './Icons';
import { Link } from './Link';

/* Wedding/event enquiries go straight to the studio WhatsApp line with the
   visitor's details prefilled — there is no server inbox behind this form. */
const ENQUIRY_WHATSAPP = 'https://wa.me/233506580545';

function PickedCard({ card }: { card: ResultCard }) {
  const body = (
    <>
      <span className="discovery-card-media">
        <img src={card.image.src} alt={card.image.alt} style={{ objectPosition: card.image.position }} />
      </span>
      <span className="discovery-card-body">
        <span className="discovery-card-chip">
          {card.kind === 'collection' ? 'Collection' : (card.price ?? 'Product')}
        </span>
        <span className="discovery-card-name">{card.name}</span>
        <span className="discovery-card-why">{card.why}</span>
      </span>
    </>
  );

  return (
    <li className="discovery-card">
      {card.href ? (
        <Link className="discovery-card-link" href={card.href}>
          {body}
        </Link>
      ) : (
        <div className="discovery-card-link">{body}</div>
      )}
    </li>
  );
}

export function DiscoverySection() {
  const [occasion, setOccasion] = useState<OccasionId | null>(null);
  const [gesture, setGesture] = useState<GestureId | null>(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<Recommendation | null>(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryHref, setEnquiryHref] = useState<string | null>(null);
  const occasionGroupRef = useRef<HTMLDivElement | null>(null);

  const ready = occasion !== null && gesture !== null;

  const pickOccasion = (value: OccasionId) => {
    setOccasion(value);
    setResult(null);
  };
  const pickGesture = (value: GestureId) => {
    setGesture(value);
    setResult(null);
  };

  const findGift = () => {
    if (!ready) return;
    setResult(recommend({ occasion: occasion as OccasionId, gesture: gesture as GestureId, note }));
  };

  /* Return the visitor to the filters, with focus, to refine their choices. */
  const changeChoices = () => {
    setResult(null);
    const first = occasionGroupRef.current?.querySelector<HTMLButtonElement>('.choice');
    first?.focus();
    first?.scrollIntoView({ block: 'nearest' });
  };

  const occasionLabel = OCCASIONS.find((o) => o.id === occasion)?.label ?? '';
  const gestureLabel = GESTURES.find((g) => g.id === gesture)?.label ?? '';

  return (
    <section className="discovery" id="find-a-gift" aria-labelledby="discovery-title">
      <div className="discovery-inner">
        <div className="discovery-copy">
          <p className="discovery-eyebrow">A gesture for every moment</p>
          <h2 className="section-title discovery-title" id="discovery-title">
            What are we celebrating?
          </h2>
          <p className="discovery-lede">
            Tell us about the occasion, and discover a thoughtful way to make it memorable.
          </p>

          <div
            className="discovery-group"
            role="group"
            aria-labelledby="discovery-label-occasion"
            data-group="occasion"
            ref={occasionGroupRef}
          >
            <p className="discovery-label" id="discovery-label-occasion">
              Choose an occasion
            </p>
            <div className="discovery-choices">
              {OCCASIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="choice"
                  data-value={option.id}
                  aria-pressed={occasion === option.id}
                  onClick={() => pickOccasion(option.id as OccasionId)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="discovery-group" role="group" aria-labelledby="discovery-label-gesture" data-group="gesture">
            <p className="discovery-label" id="discovery-label-gesture">
              Choose your gesture
            </p>
            <div className="discovery-choices">
              {GESTURES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="choice"
                  data-value={option.id}
                  aria-pressed={gesture === option.id}
                  onClick={() => pickGesture(option.id as GestureId)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="discovery-note">
            <label className="discovery-label" htmlFor="discovery-note">
              Tell us a little more <span className="discovery-optional">optional</span>
            </label>
            <input
              id="discovery-note"
              className="discovery-note-input"
              type="text"
              placeholder="She loves pink flowers and I want something elegant…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="discovery-actions">
            <button type="button" className="btn btn--ink discovery-submit" disabled={!ready} onClick={findGift}>
              Find My Gift
            </button>
          </div>
          {!ready && <p className="discovery-hint">Choose an occasion and a gesture to continue.</p>}
        </div>

        {result && (
          <div className="discovery-picked discovery-swap" role="status" aria-labelledby="discovery-picked-title">
            <p className="discovery-picked-eyebrow">Picked for you</p>
            <h3 className="discovery-picked-title" id="discovery-picked-title">
              {occasionLabel} · {gestureLabel}
            </h3>
            <p className="discovery-picked-text">{result.explanation}</p>
            <ul className="discovery-cards">
              {result.cards.map((card) => (
                <PickedCard key={`${card.kind}-${card.name}`} card={card} />
              ))}
            </ul>
            <button type="button" className="discovery-change" onClick={changeChoices}>
              Change my choices
            </button>
          </div>
        )}

        <div className="discovery-tail">
          <button
            type="button"
            className="discovery-enquire"
            aria-expanded={enquiryOpen}
            aria-controls="discovery-enquiry"
            onClick={() => setEnquiryOpen((open) => !open)}
          >
            Planning a wedding or event? Enquire with us
            <IconArrow className="discovery-enquire-icon" />
          </button>

          {enquiryOpen && (
            <div className="discovery-enquiry" id="discovery-enquiry">
              {enquirySent ? (
                <div className="discovery-enquiry-sent">
                  <p>
                    Medaase — we've opened WhatsApp with your enquiry prefilled. Press send there and our
                    events desk will reply personally.
                  </p>
                  {enquiryHref && (
                    <a
                      className="discovery-enquiry-reopen"
                      href={enquiryHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Reopen WhatsApp
                      <IconArrow className="discovery-enquire-icon" />
                    </a>
                  )}
                </div>
              ) : (
                <form
                  className="discovery-enquiry-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const email = String(data.get('email') ?? '').trim();
                    const about = String(data.get('message') ?? '').trim();
                    const lines = ['Wedding / event enquiry from the Fafari website.', `Email: ${email}`];
                    if (about) lines.push(`About the day: ${about}`);
                    const href = `${ENQUIRY_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
                    setEnquiryHref(href);
                    setEnquirySent(true);
                    window.open(href, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <p className="discovery-enquiry-copy">
                    Weddings and events are styled bespoke, from first sketch to final stem. Leave a way to
                    reach you and a few details about the day.
                  </p>
                  <label className="visually-hidden" htmlFor="enquiry-email">
                    Your email
                  </label>
                  <input
                    id="enquiry-email"
                    name="email"
                    type="email"
                    required
                    placeholder="Your email"
                    autoComplete="email"
                  />
                  <label className="visually-hidden" htmlFor="enquiry-message">
                    About your day
                  </label>
                  <textarea
                    id="enquiry-message"
                    name="message"
                    rows={3}
                    placeholder="The date, the room, the feeling…"
                  />
                  <button type="submit" className="btn btn--ink">
                    Send Enquiry
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {!result && (
          <div className="discovery-media discovery-swap" aria-hidden="true">
            <img className="discovery-img" src="/assets/store-square.jpg" alt="" />
          </div>
        )}
      </div>
    </section>
  );
}
