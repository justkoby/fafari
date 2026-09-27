/* Headless check of the full-bleed "Shop by Category" band.
   Run: node scripts/verify-categories.mjs  (dev server on :5173) */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = 'scripts/shots';
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});

const consoleErrors = [];

async function openPage(width, height) {
  const page = await browser.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  await page.setViewport({ width, height });
  return page;
}

/** Measures the category band: geometry, gaps, caption placement, hrefs. */
async function measure(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('.categories-grid');
    const head = document.querySelector('.categories-head');
    const links = [...document.querySelectorAll('.categories-link')];
    const gridBox = grid.getBoundingClientRect();
    const headBox = head.querySelector('.categories-title').getBoundingClientRect();
    const cards = links.map((link) => {
      const box = link.getBoundingClientRect();
      const img = link.querySelector('img.categories-media');
      const caption = link.querySelector('.categories-caption');
      const label = link.querySelector('.categories-label');
      const explore = link.querySelector('.categories-explore');
      const capBox = caption.getBoundingClientRect();
      const exploreBox = explore.getBoundingClientRect();
      const imgStyle = getComputedStyle(img);
      const labelStyle = getComputedStyle(label);
      return {
        href: link.getAttribute('href'),
        x: box.x,
        y: box.y,
        w: box.width,
        h: box.height,
        right: box.right,
        imgComplete: img.complete && img.naturalWidth > 0,
        imgFit: imgStyle.objectFit,
        captionGapToCardBottom: box.bottom - capBox.bottom,
        exploreGapToCardBottom: box.bottom - exploreBox.bottom,
        labelFamily: labelStyle.fontFamily,
        labelSize: labelStyle.fontSize,
        exploreText: explore.textContent.trim().replace(/\s+/g, ' '),
        alt: img.getAttribute('alt'),
      };
    });
    return {
      viewport: { w: innerWidth, h: innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      grid: { x: gridBox.x, w: gridBox.width },
      head: { x: headBox.x, right: headBox.right },
      sectionTopPad: getComputedStyle(document.querySelector('.categories')).paddingTop,
      cards,
    };
  });
}

async function revealBand(page) {
  await page.evaluate(() => document.querySelector('.categories').scrollIntoView({ block: 'center' }));
  await page.waitForFunction(() =>
    [...document.querySelectorAll('img.categories-media')].every((img) => img.complete && img.naturalWidth > 0),
  );
  await new Promise((r) => setTimeout(r, 250));
}

/* ---------------- Desktop 1440 ---------------- */
{
  const page = await openPage(1440, 900);
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await revealBand(page);
  const m = await measure(page);

  check('desktop: grid spans full viewport', m.grid.x === 0 && m.grid.w === 1440, `x=${m.grid.x} w=${m.grid.w}`);
  check('desktop: heading keeps content width (not edge-to-edge)', m.head.x > 0 && m.head.right < 1440, `x=${Math.round(m.head.x)} right=${Math.round(m.head.right)}`);
  check('desktop: four cards in one row', new Set(m.cards.map((c) => Math.round(c.y))).size === 1, `ys=${[...new Set(m.cards.map((c) => Math.round(c.y)))].join(',')}`);
  const gapless = m.cards.every((c, i) => i === 0 || Math.abs(c.x - m.cards[i - 1].right) < 1);
  check('desktop: no gaps between cards', gapless, m.cards.map((c) => Math.round(c.x)).join(' / '));
  const equal = m.cards.every((c) => Math.abs(c.w - m.cards[0].w) < 1 && Math.abs(c.h - m.cards[0].h) < 1);
  check('desktop: all four cards equal size', equal, `${Math.round(m.cards[0].w)}x${Math.round(m.cards[0].h)}`);
  check('desktop: captions pinned near bottom consistently', m.cards.every((c) => c.exploreGapToCardBottom >= 14 && c.exploreGapToCardBottom <= 40), m.cards.map((c) => Math.round(c.exploreGapToCardBottom)).join(','));
  check('desktop: all images loaded', m.cards.every((c) => c.imgComplete));
  check('desktop: no horizontal overflow', m.scrollWidth <= 1440, `scrollWidth=${m.scrollWidth}`);
  check(
    'desktop: hrefs filter the shop',
    JSON.stringify(m.cards.map((c) => c.href)) === JSON.stringify(['/shop?cat=flowers', '/shop?cat=gift-hampers,gift-sets', '/shop?cat=plants', '/shop?cat=wine-gifts']),
    m.cards.map((c) => c.href).join(' | '),
  );
  check('desktop: Explore treatment on every card', m.cards.every((c) => c.exploreText.startsWith('Explore')), m.cards[0].exploreText);
  check('desktop: labels use the sans face', m.cards.every((c) => /Jost/i.test(c.labelFamily)), m.cards[0].labelFamily);

  // Hover motion: image scale + arrow slide
  await page.hover('.categories-link');
  await new Promise((r) => setTimeout(r, 700));
  const hover = await page.evaluate(() => {
    const img = document.querySelector('.categories-link:hover img.categories-media') ?? document.querySelector('.categories-link img.categories-media');
    return getComputedStyle(img).transform;
  });
  check('desktop: hover scales imagery', hover !== 'none' && hover !== 'matrix(1, 0, 0, 1, 0, 0)', hover);

  const band = await page.$('.categories');
  await band.screenshot({ path: `${OUT}/desktop-categories.png` });
  await page.screenshot({ path: `${OUT}/desktop-full.png`, fullPage: false });

  // Link navigation
  await page.click('.categories-grid li:first-child .categories-link');
  await page.waitForFunction(() => location.pathname === '/shop');
  const nav = await page.evaluate(() => ({ path: location.pathname, search: location.search, cards: document.querySelectorAll('.product-card').length }));
  check('desktop: Flowers tile lands on filtered shop', nav.path === '/shop' && nav.search === '?cat=flowers' && nav.cards === 2, `${nav.path}${nav.search} cards=${nav.cards}`);
  await page.close();
}

/* ---------------- Tablet 820 ---------------- */
{
  const page = await openPage(820, 1180);
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await revealBand(page);
  const m = await measure(page);
  const rows = new Set(m.cards.map((c) => Math.round(c.y))).size;
  check('tablet: two cards per row', rows === 2, `rows=${rows}`);
  check('tablet: grid full width', m.grid.x === 0 && m.grid.w === 820, `w=${m.grid.w}`);
  check('tablet: no horizontal overflow', m.scrollWidth <= 820, `scrollWidth=${m.scrollWidth}`);
  const band = await page.$('.categories');
  await band.screenshot({ path: `${OUT}/tablet-categories.png` });
  await page.close();
}

/* ---------------- Mobile 390 / 430 / 375 ---------------- */
for (const width of [390, 430, 375]) {
  const page = await openPage(width, 844);
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await revealBand(page);
  const m = await measure(page);
  const rows = new Set(m.cards.map((c) => Math.round(c.y))).size;
  check(`mobile ${width}: two columns`, rows === 2, `rows=${rows}`);
  check(`mobile ${width}: grid full width`, m.grid.x === 0 && m.grid.w === width, `w=${m.grid.w}`);
  check(`mobile ${width}: no horizontal overflow`, m.scrollWidth <= width, `scrollWidth=${m.scrollWidth}`);
  check(`mobile ${width}: captions inside cards`, m.cards.every((c) => c.exploreGapToCardBottom >= 12), m.cards.map((c) => Math.round(c.exploreGapToCardBottom)).join(','));
  if (width === 390) {
    const band = await page.$('.categories');
    await band.screenshot({ path: `${OUT}/mobile-categories.png` });
  }
  await page.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (consoleErrors.length) console.log('Console errors:', consoleErrors);
else console.log('No console errors.');
process.exit(failed.length ? 1 : 0);
