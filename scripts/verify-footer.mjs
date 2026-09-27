/* Footer verification: near-black palette, ivory logo/headings, grey
   supporting text, contact column links, contrast (desktop + mobile),
   hover/focus states, anchor scroll, mobile stacking. */
import puppeteer from 'puppeteer-core';

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();

/* WCAG contrast: blend any rgba text colour over the footer background. */
const CONTRAST_FN = `
  const lum = ([r, g, b]) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => s.match(/[\\d.]+/g).map(Number);
  const ratio = (fg, bg) => {
    const a = fg[3] === undefined ? 1 : fg[3];
    const blended = [0, 1, 2].map((i) => a * fg[i] + (1 - a) * bg[i]);
    const l1 = lum(blended);
    const l2 = lum(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const sample = (sel) => {
    const footer = document.querySelector('.footer');
    return ratio(parse(getComputedStyle(footer.querySelector(sel)).color), parse(getComputedStyle(footer).backgroundColor).slice(0, 3));
  };
`;

const contrastReport = () =>
  page.evaluate(`(() => {
    ${CONTRAST_FN}
    return {
      link: sample('.footer-link'),
      prefix: sample('.footer-contact-prefix'),
      tagline: sample('.footer-tagline'),
      description: sample('.footer-description'),
      copyright: sample('.footer-copyright'),
      title: sample('.footer-col-title'),
    };
  })()`);

await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelector('.footer').scrollIntoView({ block: 'end' }));
await new Promise((r) => setTimeout(r, 400));

const desktop = await page.evaluate(() => {
  const footer = document.querySelector('.footer');
  const main = document.querySelector('main');
  const logo = footer.querySelector('.footer-logo');
  const logoCs = getComputedStyle(logo);
  const cols = [...footer.querySelectorAll('.footer-col')].map((col) => ({
    title: col.querySelector('.footer-col-title').textContent.trim(),
    titleFont: getComputedStyle(col.querySelector('.footer-col-title')).fontFamily,
    titleColor: getComputedStyle(col.querySelector('.footer-col-title')).color,
    items: [...col.querySelectorAll('li')].map((li) => {
      const a = li.querySelector('a');
      return {
        text: li.textContent.trim(),
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        rel: a.getAttribute('rel'),
      };
    }),
  }));
  return {
    afterMain: main.nextElementSibling === footer,
    bg: getComputedStyle(footer).backgroundColor,
    logo: {
      role: logo.getAttribute('role'),
      label: logo.getAttribute('aria-label'),
      mask: logoCs.maskImage || logoCs.webkitMaskImage,
      color: logoCs.backgroundColor,
    },
    tagline: footer.querySelector('.footer-tagline').textContent.trim(),
    description: footer.querySelector('.footer-description').textContent.trim(),
    brandInstagram: !!footer.querySelector('.footer-brand .footer-instagram'),
    cols,
    copyright: footer.querySelector('.footer-copyright').textContent.trim(),
    bottomHairline: getComputedStyle(footer.querySelector('.footer-bottom')).borderTopColor,
    founderSlides: document.querySelectorAll('.founder-slide').length,
    clientTiles: document.querySelectorAll('.client-tile').length,
    pageOverflow: document.scrollingElement.scrollWidth > window.innerWidth,
  };
});

check('footer closes the page after Client Cam', desktop.afterMain);
check('near-black background', desktop.bg === 'rgb(16, 16, 16)', desktop.bg);
check('logo is the ivory-masked wordmark', desktop.logo.role === 'img' && desktop.logo.label === 'FAFARI' && desktop.logo.mask.includes('fafari-logo.svg') && desktop.logo.color === 'rgb(244, 237, 225)', JSON.stringify(desktop.logo));
check('tagline kept', desktop.tagline === 'Thoughtful flowers and gifts for the moments that matter.', desktop.tagline);
check('Accra florist description present', desktop.description === 'Fafari is a florist in Accra offering bespoke floral arrangements, gifts, interior styling, and event services.', desktop.description);
check('brand column no longer duplicates Instagram', !desktop.brandInstagram);
check('three columns: Shop, Explore, Contact Us', desktop.cols.map((c) => c.title).join('|') === 'Shop|Explore|Contact Us', desktop.cols.map((c) => c.title).join('|'));
check('headings ivory + Bricolage', desktop.cols.every((c) => c.titleColor === 'rgb(244, 237, 225)' && c.titleFont.includes('Bricolage Grotesque')), desktop.cols[0].titleColor);

const contact = desktop.cols[2]?.items ?? [];
check('Call row links to tel:', contact[0]?.text === 'Call: +233 24 420 3010' && contact[0]?.href === 'tel:+233244203010' && !contact[0]?.target, JSON.stringify(contact[0]));
check('WhatsApp row links to wa.me in a new tab', contact[1]?.text === 'WhatsApp: +233 50 658 0545' && contact[1]?.href === 'https://wa.me/233506580545' && contact[1]?.target === '_blank' && (contact[1]?.rel || '').includes('noopener'), JSON.stringify(contact[1]));
check('Instagram row links to the feed in a new tab', contact[2]?.text === 'Instagram: @fafari_gh' && contact[2]?.href === 'https://www.instagram.com/fafari_gh/' && contact[2]?.target === '_blank' && (contact[2]?.rel || '').includes('noopener'), JSON.stringify(contact[2]));
check('shop + explore columns unchanged', desktop.cols[0].items.length === 4 && desktop.cols[1].items[0].href === '/#client-cam', `${desktop.cols[0].items.length}/${desktop.cols[1].items[0].href}`);
check('copyright row with current year', desktop.copyright === `© ${new Date().getFullYear()} Fafari. All rights reserved.`, desktop.copyright);
check('burgundy reserved for the hairline accent', desktop.bottomHairline === 'rgba(124, 50, 44, 0.55)', desktop.bottomHairline);
check('founder + client cam untouched', desktop.founderSlides === 5 && desktop.clientTiles === 4, `${desktop.founderSlides}/${desktop.clientTiles}`);
check('no horizontal overflow', !desktop.pageOverflow);

const contrasts = await contrastReport();
for (const [key, value] of Object.entries(contrasts)) {
  check(`desktop contrast ${key} >= 4.5:1`, value >= 4.5, value.toFixed(2));
}

/* hover: ivory label with a burgundy underline accent */
await page.hover('.footer-link[href="https://wa.me/233506580545"]');
await new Promise((r) => setTimeout(r, 400));
const hover = await page.$eval('.footer-link[href="https://wa.me/233506580545"]', (el) => {
  const cs = getComputedStyle(el);
  return { color: cs.color, line: cs.textDecorationLine, deco: cs.textDecorationColor };
});
check('hover: ivory text + burgundy underline', hover.color === 'rgb(244, 237, 225)' && hover.line === 'underline' && hover.deco === 'rgb(124, 50, 44)', JSON.stringify(hover));
await page.mouse.move(10, 10);

/* keyboard focus ring */
await page.evaluate(() => document.querySelector('.client-instagram').focus());
await page.keyboard.press('Tab');
const focus = await page.evaluate(() => {
  const cs = getComputedStyle(document.activeElement);
  return { label: document.activeElement.textContent.trim(), width: cs.outlineWidth, style: cs.outlineStyle, color: cs.outlineColor };
});
check('keyboard focus ring on footer links', focus.label === 'Flowers' && focus.width === '2px' && focus.style === 'solid' && focus.color === 'rgb(244, 237, 225)', JSON.stringify(focus));

/* anchor link: home -> scrolls to Client Cam */
await page.evaluate(() => document.querySelector('.footer-link[href="/#client-cam"]').click());
await new Promise((r) => setTimeout(r, 1400));
const homeAnchor = await page.evaluate(() => ({
  path: location.pathname,
  offset: Math.round(document.getElementById('client-cam').getBoundingClientRect().top),
}));
check('Client Cam link scrolls to the section from home', homeAnchor.path === '/' && Math.abs(homeAnchor.offset - 84) < 24, JSON.stringify(homeAnchor));

/* shop links route client-side */
await page.evaluate(() => document.querySelector('.footer').scrollIntoView({ block: 'end' }));
await page.evaluate(() => [...document.querySelectorAll('.footer-link')].find((a) => a.textContent.trim() === 'Flowers').click());
await new Promise((r) => setTimeout(r, 600));
const shopRoute = await page.evaluate(() => ({ path: location.pathname + location.search, title: document.querySelector('.shop-title')?.textContent.trim() }));
check('Shop column links route to the filtered shop', shopRoute.path === '/shop?cat=flowers' && !!shopRoute.title, JSON.stringify(shopRoute));

/* anchor link from another route routes home first */
await page.evaluate(() => document.querySelector('.footer-link[href="/#client-cam"]').click());
await new Promise((r) => setTimeout(r, 1400));
const shopAnchor = await page.evaluate(() => ({
  path: location.pathname,
  offset: Math.round(document.getElementById('client-cam').getBoundingClientRect().top),
}));
check('Client Cam link routes home from /shop and scrolls', shopAnchor.path === '/' && Math.abs(shopAnchor.offset - 84) < 24, JSON.stringify(shopAnchor));

/* screenshots + mobile */
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelector('.footer').scrollIntoView({ block: 'end' }));
await new Promise((r) => setTimeout(r, 400));
const footerEl = await page.$('.footer');
await footerEl.screenshot({ path: 'scripts/shots/footer-desktop.png' });

await page.setViewport({ width: 390, height: 844 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelector('.footer').scrollIntoView({ block: 'end' }));
await new Promise((r) => setTimeout(r, 400));
const mobile = await page.evaluate(() => {
  const top = document.querySelector('.footer-top');
  const blocks = [...top.children].map((c) => Math.round(c.getBoundingClientRect().x));
  return {
    display: getComputedStyle(top).display,
    stacked: blocks.every((x) => x === blocks[0]),
    pageOverflow: document.scrollingElement.scrollWidth > window.innerWidth,
  };
});
check('mobile: columns stack in one column', mobile.display === 'grid' && mobile.stacked, JSON.stringify(mobile));
check('mobile: no horizontal overflow', !mobile.pageOverflow);

const mobileContrasts = await contrastReport();
for (const [key, value] of Object.entries(mobileContrasts)) {
  check(`mobile contrast ${key} >= 4.5:1`, value >= 4.5, value.toFixed(2));
}
/* Frame the shot below the sticky header so the capture is clean. */
await page.evaluate(() => {
  const top = document.querySelector('.footer').getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top - 84);
});
await new Promise((r) => setTimeout(r, 300));
const mobileFooter = await page.$('.footer');
await mobileFooter.screenshot({ path: 'scripts/shots/footer-mobile.png' });

await browser.close();

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
