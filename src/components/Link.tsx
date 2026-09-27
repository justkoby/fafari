import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { navigate } from '../router';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

/* Internal links swap routes client-side; modifier clicks and middle-click
   fall through to the browser so real hrefs keep working. */
export function Link({ href, onClick, ...rest }: LinkProps) {
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(href);
  };

  return <a href={href} onClick={handle} {...rest} />;
}
