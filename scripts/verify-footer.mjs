/* Footer verification: placement, palette, real routes only, anchor
   scroll, contrast ratios, keyboard focus, mobile stacking. */
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
`;

await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelector('.footer').scrollIntoView({ block: 'end' }));
await new Promise((r) => setTimeout(r, 400));

const desktop = await page.evaluate(() => {
  const footer = document.querySelector('.footer');
  const main = document.querySelector('main');
  const logo = footer.querySelector('.footer-logo');
  const titles = [...footer.querySelectorAll('.footer-col-title')];
  const cols = [...footer.querySelectorAll('.footer-col')].map((col) => ({
    title: col.querySelector('.footer-col-title').textContent.trim(),
    titleFont: getComputedStyle(col.querySelector('.footer-col-title')).fontFamily,
    items: [...col.querySelectorAll('.footer-link')].map((a) => ({
      label: a.textContent.trim(),
      href: a.getAttribute('href'),
    })),
  }));
  const allLinks = [...footer.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  const bg = getComputedStyle(footer).backgroundColor;
  const sample = (sel) => getComputedStyle(footer.querySelector(sel)).color;
  return {
    afterMain: main.nextElementSibling === footer,
    afterClientCam: document.querySelector('.client-cam') !== null,
    bg,
    logoSrc: logo.getAttribute('src'),
    logoAlt: logo.getAttribute('alt'),
    logoLoaded: logo.naturalWidth > 0,
    tagline: footer.querySelector('.footer-tagline').textContent.trim(),
    cols,
    allLinks,
    insta: (() => {
      const a = footer.querySelector('.footer-instagram');
      return { href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') };
    })(),
    copyright: footer.querySelector('.footer-copyright').textContent.trim(),
    colors: {
      link: sample('.footer-link'),
      tagline: sample('.footer-tagline'),
      copyright: sample('.footer-copyright'),
      title: sample('.footer-col-title'),
      insta: sample('.footer-instagram'),
    },
    bodyText: getComputedStyle(footer.querySelector('.footer-link')).fontSize,
    founderSlides: document.querySelectorAll('.founder-slide').length,
    clientTiles: document.querySelectorAll('.client-tile').length,
    pageOverflow: document.scrollingElement.scrollWidth > window.innerWidth,
  };
});

check('footer closes the page after Client Cam', desktop.afterMain && desktop.afterClientCam);
check('deep burgundy background', desktop.bg === 'rgb(107, 43, 37)', desktop.bg);
check('existing Fafari logo, loaded', desktop.logoSrc === '/assets/fafari-logo.svg' && desktop.logoLoaded && desktop.logoAlt === 'FAFARI', `${desktop.logoSrc} loaded=${desktop.logoLoaded}`);
check('tagline line present', desktop.tagline === 'Thoughtful flowers and gifts for the moments that matter.', desktop.tagline);
check('Shop column lists the four real shop routes', JSON.stringify(desktop.cols[0]?.items) === JSON.stringify([
  { label: 'Flowers', href: '/shop?cat=flowers' },
  { label: 'Gifts', href: '/shop?cat=gift-hampers,gift-sets' },
  { label: 'Plants', href: '/shop?cat=plants' },
  { label: 'All Products', href: '/shop' },
]), JSON.stringify(desktop.cols[0]?.items));
check('Explore column keeps only Client Cam', desktop.cols[1]?.title === 'Explore' && desktop.cols[1].items.length === 1 && desktop.cols[1].items[0].label === 'Client Cam', JSON.stringify(desktop.cols[1]));
check('unbuilt pages stay out (no Help column, no dead items)', desktop.cols.length === 2 && !desktop.allLinks.some((h) => h === '#' || h === '/#'), `cols=${desktop.cols.length}`);
check('no invented contact details', !/whatsapp|@fafari|tel:|mailto:|\+\d/i.test(desktop.allLinks.join(' ')), desktop.allLinks.join(' '));
check('column headings use Bricolage Grotesque', desktop.cols.every((c) => c.titleFont.includes('Bricolage Grotesque')), desktop.cols[0]?.titleFont);
check('body text stays readable', parseFloat(desktop.bodyText) >= 15, desktop.bodyText);
check('instagram link correct', desktop.insta.href === 'https://www.instagram.com/fafari_gh/' && desktop.insta.target === '_blank' && desktop.insta.rel.includes('noopener'), desktop.insta.href);
check('copyright row with current year', desktop.copyright === `© ${new Date().getFullYear()} Fafari. All rights reserved.`, desktop.copyright);
check('founder + client cam untouched', desktop.founderSlides === 5 && desktop.clientTiles === 4, `${desktop.founderSlides}/${desktop.clientTiles}`);
check('no horizontal overflow', !desktop.pageOverflow);

const contrasts = await page.evaluate(`(() => {
  ${CONTRAST_FN}
  const footer = document.querySelector('.footer');
  const bg = parse(getComputedStyle(footer).backgroundColor).slice(0, 3);
  const sample = (sel) => parse(getComputedStyle(footer.querySelector(sel)).color);
  return {
    link: ratio(sample('.footer-link'), bg),
    tagline: ratio(sample('.footer-tagline'), bg),
    copyright: ratio(sample('.footer-copyright'), bg),
    title: ratio(sample('.footer-col-title'), bg),
    insta: ratio(sample('.footer-instagram'), bg),
  };
})()`);
for (const [key, value] of Object.entries(contrasts)) {
  check(`contrast ${key} >= 4.5:1`, value >= 4.5, value.toFixed(2));
}

/* keyboard focus ring */
await page.evaluate(() => document.querySelector('.footer-instagram').focus());
await page.keyboard.press('Tab');
const focus = await page.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return { label: el.textContent.trim(), width: cs.outlineWidth, style: cs.outlineStyle, color: cs.outlineColor };
});
check('keyboard focus ring on footer links', focus.label === 'Flowers' && focus.width === '2px' && focus.style === 'solid', JSON.stringify(focus));

/* anchor link: home -> scrolls to Client Cam */
await page.evaluate(() => document.querySelector('.footer-link[href="/#client-cam"]').click());
await new Promise((r) => setTimeout(r, 1400));
const homeAnchor = await page.evaluate(() => {
  const target = document.getElementById('client-cam').getBoundingClientRect().top;
  return { path: location.pathname, offset: Math.round(target) };
});
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

/* screenshots + mobile stacking */
await page.evaluate(() => window.scrollTo(0, 0));
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
const mobileFooter = await page.$('.footer');
await mobileFooter.screenshot({ path: 'scripts/shots/footer-mobile.png' });

await browser.close();

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
