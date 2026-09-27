import type { NavMenu } from '../data/navigation';
import { IconArrow } from './Icons';

interface MegaPanelProps {
  menu: NavMenu;
  open: boolean;
  labelledBy: string;
}

export function MegaPanel({ menu, open, labelledBy }: MegaPanelProps) {
  return (
    <div className="mega-panel" id={`mega-${menu.id}`} data-open={open} aria-labelledby={labelledBy}>
      <div className="mega-grid">
        {menu.columns.map((column) => (
          <div className="mega-col" key={column.heading}>
            <p className="mega-heading">{column.heading}</p>
            <ul className="mega-links">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a className="mega-link" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mega-col mega-editorial">
          <p className="mega-script">{menu.editorial.script}</p>
          <p className="mega-line">{menu.editorial.line}</p>
          <a className="mega-cta" href={menu.editorial.cta.href}>
            {menu.editorial.cta.label}
            <IconArrow className="mega-cta-icon" />
          </a>
        </div>

        <a className="mega-tile" href={menu.editorial.cta.href} aria-label={menu.tile.caption}>
          <img
            className="mega-tile-img"
            src={menu.tile.src}
            alt={menu.tile.alt}
            style={{ objectPosition: menu.tile.position }}
            loading="lazy"
          />
          <span className="mega-tile-caption">{menu.tile.caption}</span>
        </a>
      </div>
    </div>
  );
}
