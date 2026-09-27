/* Client Cam verification: layout geometry, crops, hover swell, swipe
   row, Instagram link, reduced-motion behaviour and section order. */
import puppeteer from 'puppeteer-core';

const results = [];
const check = (name, ok, detail = '') =>
  results.push({ name, ok, detail });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();

const reveal = () =>
  page.evaluate(async () => {
    document.querySelector('.client-cam').scrollIntoView({ block: 'center' });
    await Promise.all(
      [...document.querySelectorAll('.client-media')].map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise((r) => {
              img.onload = r;
              img.onerror = r;
            }),
      ),
    );
  });

/* ---------------- desktop ---------------- */
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await reveal();

const desktop = await page.evaluate(() => {
  const section = document.querySelector('.client-cam');
  const founder = document.querySelector('.founder');
  const eyebrow = section.querySelector('.client-eyebrow');
  const title = section.querySelector('.client-title');
  const intro = section.querySelector('.client-intro');
  const tiles = [...section.querySelectorAll('.client-tile')];
  const rects = tiles.map((t) => t.getBoundingClientRect());
  const grid = section.querySelector('.client-grid').getBoundingClientRect();
  const insta = section.querySelector('.client-instagram');
  const inner = section.querySelector('.client-inner').getBoundingClientRect();
  return {
    orderOk: founder.nextElementSibling === section,
    eyebrowText: eyebrow.textContent.trim(),
    eyebrowTransform: getComputedStyle(eyebrow).textTransform,
    titleText: title.textContent.trim(),
    titleFont: getComputedStyle(title).fontFamily,
    introText: intro.textContent.trim(),
    imgs: tiles.map((t) => {
      const img = t.querySelector('img');
      return { src: img.getAttribute('src'), alt: img.getAttribute('alt') };
    }),
    rects: rects.map((r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) })),
    grid: { x: Math.round(grid.x), right: Math.round(grid.right) },
    innerPad: { left: Math.round(inner.x), right: Math.round(inner.right) },
    tileChildCounts: tiles.map((t) => t.childElementCount),
    quotes: section.querySelectorAll('blockquote, q, figure figcaption, .client-caption').length,
    instaHref: insta.getAttribute('href'),
    instaTarget: insta.getAttribute('target'),
    instaRel: insta.getAttribute('rel'),
    instaText: insta.textContent.trim(),
    instaBelowGrid: insta.getBoundingClientRect().top >= grid.bottom,
    founderSlides: document.querySelectorAll('.founder-slide').length,
    pageOverflow: document.scrollingElement.scrollWidth > window.innerWidth,
    display: getComputedStyle(section.querySelector('.client-grid')).display,
  };
});

check('section sits directly after the founder note', desktop.orderOk);
check('eyebrow reads CLIENT CAM (uppercased)', desktop.eyebrowText === 'Client Cam' && desktop.eyebrowTransform === 'uppercase', `${desktop.eyebrowText} / ${desktop.eyebrowTransform}`);
check('heading is "Flowers, out in the world"', desktop.titleText === 'Flowers, out in the world', desktop.titleText);
check('heading uses Bricolage Grotesque', desktop.titleFont.includes('Bricolage Grotesque'), desktop.titleFont);
check('intro line present', desktop.introText === 'A few of the moments you have shared with us.', desktop.introText);
check('four client images in order', desktop.imgs.map((i) => i.src).join() === '/assets/client-1.jpg,/assets/client-4.jpg,/assets/client-2.jpg,/assets/client-3.jpg', desktop.imgs.map((i) => i.src).join());
check('every image has descriptive alt', desktop.imgs.every((i) => (i.alt || '').length > 50), desktop.imgs.map((i) => (i.alt || '').length).join('/'));

const [feat, wide, halfA, halfB] = desktop.rects;
check('featured frame is the largest', feat.w * feat.h > wide.w * wide.h && feat.w * feat.h > halfA.w * halfA.h * 2, JSON.stringify(feat));
check('featured spans both rows beside the trio', feat.h > wide.h + halfA.h && Math.abs(feat.y - wide.y) < 4 && Math.abs(halfA.y - halfB.y) < 4, JSON.stringify(desktop.rects));
check('wide slot spans the two half slots', Math.abs(wide.w - (halfA.w + halfB.w + 20)) < 6 && Math.abs(wide.x - halfA.x) < 4, `${wide.w} vs ${halfA.w}+${halfB.w}`);
check('halves are balanced', Math.abs(halfA.w - halfB.w) < 4 && Math.abs(halfA.h - halfB.h) < 4, `${halfA.w}x${halfA.h} / ${halfB.w}x${halfB.h}`);
check('crop proportions stay editorial', feat.w / feat.h > 0.8 && feat.w / feat.h < 1 && wide.w / wide.h > 1.2 && wide.w / wide.h < 1.5 && halfA.w / halfA.h > 0.85 && halfA.w / halfA.h < 1.05, [feat, wide, halfA].map((r) => (r.w / r.h).toFixed(2)).join(' / '));
check('grid respects content width', desktop.grid.x >= desktop.innerPad.left - 1 && desktop.grid.right <= desktop.innerPad.right + 1, JSON.stringify(desktop.grid));
check('tiles hold a single image (no overlays/captions)', desktop.tileChildCounts.every((c) => c === 1), desktop.tileChildCounts.join());
check('no testimonial quotes or captions', desktop.quotes === 0, String(desktop.quotes));
check('instagram link points at the feed', desktop.instaHref === 'https://www.instagram.com/fafari_gh/' && desktop.instaTarget === '_blank' && (desktop.instaRel || '').includes('noopener'), desktop.instaHref);
check('instagram link label + placement below gallery', desktop.instaText.includes('See more on Instagram') && desktop.instaBelowGrid, desktop.instaText);
check('founder section untouched (5 slides)', desktop.founderSlides === 5, String(desktop.founderSlides));
check('no horizontal page overflow', !desktop.pageOverflow);
check('desktop gallery is a grid', desktop.display === 'grid', desktop.display);

/* hover swell */
const tileSel = '.client-tile--1';
const before = await page.$eval(`${tileSel} .client-media`, (el) => getComputedStyle(el).transform);
await page.hover(tileSel);
await new Promise((r) => setTimeout(r, 900));
const after = await page.$eval(`${tileSel} .client-media`, (el) => getComputedStyle(el).transform);
check('subtle hover movement on photos', before === 'none' && after.startsWith('matrix(1.04'), `${before} -> ${after}`);
await page.mouse.move(10, 10);
await new Promise((r) => setTimeout(r, 900));

/* ---------------- mobile ---------------- */
await page.setViewport({ width: 390, height: 844 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await reveal();

const mobile = await page.evaluate(() => {
  const grid = document.querySelector('.client-grid');
  const cs = getComputedStyle(grid);
  const tiles = [...grid.querySelectorAll('.client-tile')].map((t) => t.getBoundingClientRect());
  return {
    display: cs.display,
    overflowX: cs.overflowX,
    snap: cs.scrollSnapType,
    scrollable: grid.scrollWidth > grid.clientWidth,
    clientWidth: grid.clientWidth,
    scrollWidth: grid.scrollWidth,
    tiles: tiles.map((r) => ({ w: Math.round(r.width), h: Math.round(r.height) })),
    snapAlign: getComputedStyle(grid.querySelector('.client-tile')).scrollSnapAlign,
    pageOverflow: document.scrollingElement.scrollWidth > window.innerWidth,
  };
});

check('mobile gallery is a swipeable row', mobile.display === 'flex' && mobile.overflowX === 'auto' && mobile.snap.includes('x'), `${mobile.display}/${mobile.overflowX}/${mobile.snap}`);
check('mobile row actually scrolls', mobile.scrollable, `${mobile.scrollWidth} > ${mobile.clientWidth}`);
check('mobile frames stay large', mobile.tiles.every((t) => t.w >= 390 * 0.7 && t.h >= 300), JSON.stringify(mobile.tiles));
check('mobile tiles snap centred', mobile.snapAlign.includes('center'), mobile.snapAlign);
check('no horizontal page overflow on mobile', !mobile.pageOverflow);

const scrolled = await page.evaluate(() => {
  const grid = document.querySelector('.client-grid');
  grid.scrollBy({ left: 320 });
  return new Promise((r) => setTimeout(r, 700)).then(() => grid.scrollLeft);
});
check('swipe moves the row', scrolled > 100, String(scrolled));

/* ---------------- reduced motion ---------------- */
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await reveal();
const rmBefore = await page.$eval('.client-tile--1 .client-media', (el) => getComputedStyle(el).transform);
await page.hover('.client-tile--1');
await new Promise((r) => setTimeout(r, 500));
const rmAfter = await page.$eval('.client-tile--1 .client-media', (el) => getComputedStyle(el).transform);
check('reduced motion: no hover swell', rmBefore === 'none' && rmAfter === 'none', `${rmBefore} -> ${rmAfter}`);

/* ---------------- screenshots ---------------- */
await page.emulateMediaFeatures([]);
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await reveal();
await new Promise((r) => setTimeout(r, 400));
const section = await page.$('.client-cam');
await section.screenshot({ path: 'scripts/shots/client-cam-desktop.png' });
for (let i = 1; i <= 4; i++) {
  const tile = await page.$(`.client-tile--${i}`);
  await tile.screenshot({ path: `scripts/shots/client-tile-${i}.png` });
}
await page.setViewport({ width: 390, height: 844 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await reveal();
await new Promise((r) => setTimeout(r, 400));
const mobileSection = await page.$('.client-cam');
await mobileSection.screenshot({ path: 'scripts/shots/client-cam-mobile.png' });

await browser.close();

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
