/* Custom order band verification: placement, palette, exact copy, CTA
   link/target/hover/tap size, contrast, mobile compactness, no form. */
import puppeteer from 'puppeteer-core';

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

const CTA_HREF =
  'https://wa.me/233506580545?text=Hello%20Fafari%2C%20I%27d%20like%20to%20discuss%20a%20custom%20order';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();

const lumFn = `
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
await page.evaluate(() => document.querySelector('.custom-order').scrollIntoView({ block: 'center', behavior: 'instant' }));
await new Promise((r) => setTimeout(r, 400));

const desktop = await page.evaluate(() => {
  const section = document.querySelector('.custom-order');
  const eyebrow = section.querySelector('.custom-order-eyebrow');
  const title = section.querySelector('.custom-order-title');
  const body = section.querySelector('.custom-order-body');
  const cta = section.querySelector('.custom-order-cta');
  const ctaCs = getComputedStyle(cta);
  const rect = section.getBoundingClientRect();
  return {
    afterClientCam: document.querySelector('.client-cam').nextElementSibling === section,
    beforeFooter: document.querySelector('main').nextElementSibling === document.querySelector('.footer'),
    fullWidth: Math.round(rect.width) === window.innerWidth,
    bg: getComputedStyle(section).backgroundColor,
    eyebrowText: eyebrow.textContent.trim(),
    eyebrowTransform: getComputedStyle(eyebrow).textTransform,
    titleText: title.textContent.trim(),
    titleFont: getComputedStyle(title).fontFamily,
    titleColor: getComputedStyle(title).fontFamily && getComputedStyle(title).color,
    bodyText: body.textContent.trim(),
    ctaText: cta.textContent.trim(),
    ctaHref: cta.getAttribute('href'),
    ctaTarget: cta.getAttribute('target'),
    ctaRel: cta.getAttribute('rel'),
    ctaBg: ctaCs.backgroundColor,
    ctaColor: ctaCs.color,
    ctaHeight: Math.round(cta.getBoundingClientRect().height),
    forms: section.querySelectorAll('form, input, textarea, select').length,
    centered: Math.abs(rect.width / 2 - (title.getBoundingClientRect().x + title.getBoundingClientRect().width / 2)) < 2,
    padding: getComputedStyle(section).paddingTop,
    pageOverflow: document.scrollingElement.scrollWidth > window.innerWidth,
  };
});

check('sits between Client Cam and the footer', desktop.afterClientCam && desktop.beforeFooter);
check('full-width band', desktop.fullWidth, String(desktop.fullWidth));
check('deep burgundy background', desktop.bg === 'rgb(107, 43, 37)', desktop.bg);
check('eyebrow reads MADE FOR YOUR MOMENT', desktop.eyebrowText === 'Made for Your Moment' && desktop.eyebrowTransform === 'uppercase', desktop.eyebrowText);
check('heading exact + site heading font', desktop.titleText === 'Need something made for you?' && desktop.titleFont.includes('Bricolage Grotesque'), desktop.titleText);
check('body copy exact', desktop.bodyText === 'From a personal bouquet to event flowers and corporate gifts, tell us what you have in mind. We’ll help bring it to life.', desktop.bodyText);
check('CTA label exact', desktop.ctaText === 'Discuss a custom order', desktop.ctaText);
check('CTA links to the prefilled WhatsApp chat', desktop.ctaHref === CTA_HREF, desktop.ctaHref);
check('CTA opens in a new tab', desktop.ctaTarget === '_blank' && (desktop.ctaRel || '').includes('noopener'), `${desktop.ctaTarget}/${desktop.ctaRel}`);
check('ivory button with dark text', desktop.ctaBg === 'rgb(244, 237, 225)' && desktop.ctaColor === 'rgb(17, 17, 17)', `${desktop.ctaBg}/${desktop.ctaColor}`);
check('generous spacing', parseFloat(desktop.padding) >= 100, desktop.padding);
check('centred closing composition', desktop.centered);
check('no form or invented promises', desktop.forms === 0 && !/deliver|shipping|promise|guarantee/i.test(desktop.bodyText), String(desktop.forms));
check('no horizontal overflow', !desktop.pageOverflow);

const contrasts = await page.evaluate(`(() => {
  ${lumFn}
  const section = document.querySelector('.custom-order');
  const bg = parse(getComputedStyle(section).backgroundColor).slice(0, 3);
  const sample = (sel) => parse(getComputedStyle(section.querySelector(sel)).color);
  const cta = section.querySelector('.custom-order-cta');
  return {
    eyebrow: ratio(sample('.custom-order-eyebrow'), bg),
    title: ratio(sample('.custom-order-title'), bg),
    body: ratio(sample('.custom-order-body'), bg),
    ctaTextOnButton: ratio(parse(getComputedStyle(cta).color), parse(getComputedStyle(cta).backgroundColor).slice(0, 3)),
  };
})()`);
for (const [key, value] of Object.entries(contrasts)) {
  check(`contrast ${key} >= 4.5:1`, value >= 4.5, value.toFixed(2));
}

/* hover state */
const ctaBefore = await page.$eval('.custom-order-cta', (el) => getComputedStyle(el).backgroundColor);
await page.hover('.custom-order-cta');
await new Promise((r) => setTimeout(r, 400));
const ctaAfter = await page.$eval('.custom-order-cta', (el) => getComputedStyle(el).backgroundColor);
check('clear hover state on the button', ctaBefore === 'rgb(244, 237, 225)' && ctaAfter === 'rgb(230, 196, 137)', `${ctaBefore} -> ${ctaAfter}`);
await page.mouse.move(10, 10);
await new Promise((r) => setTimeout(r, 400));

/* screenshots (resting state, before the focus check adds a ring) */
const sectionEl = await page.$('.custom-order');
await sectionEl.screenshot({ path: 'scripts/shots/custom-order-desktop.png' });

/* keyboard focus ring */
await page.evaluate(() => document.querySelector('.client-instagram')?.focus());
await page.evaluate(() => document.querySelector('.custom-order').previousElementSibling.querySelector('a:last-of-type')?.focus());
await page.keyboard.press('Tab');
const focus = await page.evaluate(() => {
  const cs = getComputedStyle(document.activeElement);
  return { cls: document.activeElement.className, width: cs.outlineWidth, style: cs.outlineStyle };
});
check('keyboard focus ring on the CTA', String(focus.cls).includes('custom-order-cta') && focus.width === '2px' && focus.style === 'solid', JSON.stringify(focus));

/* mobile */
await page.setViewport({ width: 390, height: 844 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelector('.custom-order').scrollIntoView({ block: 'center', behavior: 'instant' }));
await new Promise((r) => setTimeout(r, 400));
const mobile = await page.evaluate(() => {
  const section = document.querySelector('.custom-order');
  const cta = section.querySelector('.custom-order-cta');
  const body = section.querySelector('.custom-order-body');
  const r = cta.getBoundingClientRect();
  return {
    ctaSize: { w: Math.round(r.width), h: Math.round(r.height) },
    bodySize: getComputedStyle(body).fontSize,
    padding: getComputedStyle(section).paddingTop,
    pageOverflow: document.scrollingElement.scrollWidth > window.innerWidth,
  };
});
check('mobile: easy tap target (>=48px tall, full width)', mobile.ctaSize.h >= 48 && mobile.ctaSize.w >= 390 - 40, JSON.stringify(mobile.ctaSize));
check('mobile: compact copy block', parseFloat(mobile.bodySize) <= 16 && parseFloat(mobile.padding) <= 88, `${mobile.bodySize}/${mobile.padding}`);
check('mobile: no horizontal overflow', !mobile.pageOverflow);
const mobileSection = await page.$('.custom-order');
await mobileSection.screenshot({ path: 'scripts/shots/custom-order-mobile.png' });

await browser.close();

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
