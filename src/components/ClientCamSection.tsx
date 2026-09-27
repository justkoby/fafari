import { CLIENT_CAM, CLIENT_CAM_IMAGES } from '../data/clientCam';
import { IconArrow } from './Icons';

/** "Client Cam" — a dark editorial band after the founder note: one
    featured frame with three balanced companions, a quiet hover swell on
    each photo, and a single link out to the Instagram feed. No overlays,
    no captions, no invented quotes — the photographs carry the section. */
export function ClientCamSection() {
  return (
    <section className="client-cam" id="client-cam" aria-labelledby="client-cam-title">
      <div className="client-inner">
        <header className="client-head">
          <p className="client-eyebrow">{CLIENT_CAM.eyebrow}</p>
          <h2 className="section-title client-title" id="client-cam-title">
            {CLIENT_CAM.title}
          </h2>
          <p className="client-intro">{CLIENT_CAM.intro}</p>
        </header>
        <ul className="client-grid">
          {CLIENT_CAM_IMAGES.map((image, index) => (
            <li key={image.src} className={`client-tile client-tile--${image.slot} client-tile--${index + 1}`}>
              <img className="client-media" src={image.src} alt={image.alt} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
        <a
          className="client-instagram"
          href={CLIENT_CAM.instagram.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {CLIENT_CAM.instagram.label}
          <IconArrow className="client-instagram-icon" />
        </a>
      </div>
    </section>
  );
}
