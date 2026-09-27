/* Headless check: founder crossfade slideshow behaviour + layout.
   Run: node scripts/verify-founder.mjs  (dev server on :5173) */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = 'scripts/shots';
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});

const consoleErrors = [];

async function openPage(width, height, reduced = false) {
  const page = await browser.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  await page.setViewport({ width, height });
  if (reduced) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  }
  return page;
}

async function revealFounder(page) {
  await page.evaluate(() => document.querySelector('.founder').scrollIntoView({ block: 'center' }));
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.founder-slide')].every((img) => img.complete && img.naturalWidth > 0),
  );
}

/** Poll slide state every 200ms for `duration` ms inside the page. */
const poll = (page, duration) =>
  page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        const out = [];
        const started = performance.now();
        const tick = () => {
          const slides = [...document.querySelectorAll('.founder-slide')];
          out.push({
            active: slides.findIndex((s) => s.dataset.active === 'true'),
            op: slides.map((s) => Number(getComputedStyle(s).opacity)),
            frameH: Math.round(document.querySelector('.founder-frame').getBoundingClientRect().height),
            text: document.querySelector('.founder-note').textContent.replace(/\s+/g, ' '),
          });
          if (performance.now() - started < ms) setTimeout(tick, 200);
          else resolve(out);
        };
        tick();
      }),
    duration,
  );

/* ---------------- Desktop: cycle, crossfade, stability ---------------- */
{
  const page = await openPage(1440, 900);
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await revealFounder(page);

  const meta = await page.evaluate(() => {
    const frame = document.querySelector('.founder-frame');
    const box = frame.getBoundingClientRect();
    return {
      slides: document.querySelectorAll('.founder-slide').length,
      aspect: +(box.width / box.height).toFixed(3),
      controls: document.querySelectorAll('.founder button, .founder a, .founder svg, .founder [class*="dot"], .founder [class*="arrow"], .founder figcaption').length,
      frameChildren: [...frame.children].every((el) => el.tagName === 'IMG'),
      alts: [...document.querySelectorAll('.founder-slide')].every((img) => (img.getAttribute('alt') ?? '').length > 20),
    };
  });
  check('desktop: five slides in the frame', meta.slides === 5, `count=${meta.slides}`);
  check('desktop: fixed 4:5 frame', Math.abs(meta.aspect - 0.8) < 0.01, `aspect=${meta.aspect}`);
  check('desktop: no thumbnails, arrows, dots or captions', meta.controls === 0, `count=${meta.controls}`);
  check('desktop: frame holds images only', meta.frameChildren);
  check('desktop: every slide has descriptive alt text', meta.alts);

  const samples = await poll(page, 21500);
  const sequence = samples.map((s) => s.active).filter((v, i, all) => i === 0 || v !== all[i - 1]);
  check('desktop: cycles 0→1→2→3→4→0', sequence.join(',') === '0,1,2,3,4,0', sequence.join(','));
  const overlap = samples.some((s) => s.op.filter((o) => o > 0.05 && o < 0.95).length >= 2);
  check('desktop: true crossfade (both images overlap mid-fade)', overlap);
  check('desktop: frame height never shifts', new Set(samples.map((s) => s.frameH)).size === 1, `heights=${[...new Set(samples.map((s) => s.frameH))].join(',')}`);
  check('desktop: note text stays static', new Set(samples.map((s) => s.text)).size === 1);

  /* Tab-hidden pause: fake visibilitychange, expect the cycle to freeze. */
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hiddenBefore = await page.evaluate(() => [...document.querySelectorAll('.founder-slide')].findIndex((s) => s.dataset.active === 'true'));
  await new Promise((r) => setTimeout(r, 5200));
  const hiddenAfter = await page.evaluate(() => [...document.querySelectorAll('.founder-slide')].findIndex((s) => s.dataset.active === 'true'));
  check('desktop: slideshow pauses while tab hidden', hiddenBefore === hiddenAfter, `${hiddenBefore} → ${hiddenAfter}`);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await new Promise((r) => setTimeout(r, 5200));
  const resumed = await page.evaluate(() => [...document.querySelectorAll('.founder-slide')].findIndex((s) => s.dataset.active === 'true'));
  check('desktop: slideshow resumes when tab visible', resumed !== hiddenAfter, `${hiddenAfter} → ${resumed}`);

  check('desktop: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth) <= 1440);
  const band = await page.$('.founder');
  await band.screenshot({ path: `${OUT}/desktop-founder.png` });
  await page.close();
}

/* ---------------- Reduced motion: static first frame ---------------- */
{
  const page = await openPage(1440, 900, true);
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await revealFounder(page);
  await new Promise((r) => setTimeout(r, 6000));
  const state = await page.evaluate(() => {
    const slides = [...document.querySelectorAll('.founder-slide')];
    return {
      active: slides.findIndex((s) => s.dataset.active === 'true'),
      visible: slides.filter((s) => Number(getComputedStyle(s).opacity) > 0.5).length,
    };
  });
  check('reduced motion: stays on the first frame', state.active === 0, `active=${state.active}`);
  check('reduced motion: exactly one static image', state.visible === 1, `visible=${state.visible}`);
  await page.close();
}

/* ---------------- Mobile: frame above text, no overflow ---------------- */
for (const width of [390, 375]) {
  const page = await openPage(width, 844);
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await revealFounder(page);
  const geo = await page.evaluate(() => {
    const frame = document.querySelector('.founder-frame').getBoundingClientRect();
    const note = document.querySelector('.founder-note').getBoundingClientRect();
    return { frameTop: frame.top, frameBottom: frame.bottom, noteTop: note.top, aspect: +(frame.width / frame.height).toFixed(3), scrollWidth: document.documentElement.scrollWidth };
  });
  check(`${width}: frame sits above the text`, geo.frameTop < geo.noteTop && geo.frameBottom <= geo.noteTop + 1, `frame.bottom=${Math.round(geo.frameBottom)} note.top=${Math.round(geo.noteTop)}`);
  check(`${width}: fixed 4:5 frame`, Math.abs(geo.aspect - 0.8) < 0.01, `aspect=${geo.aspect}`);
  check(`${width}: no horizontal overflow`, geo.scrollWidth <= width, `scrollWidth=${geo.scrollWidth}`);
  if (width === 390) {
    const band = await page.$('.founder');
    await band.screenshot({ path: `${OUT}/mobile-founder.png` });
  }
  await page.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (consoleErrors.length) console.log('Console errors:', consoleErrors);
else console.log('No console errors.');
process.exit(failed.length ? 1 : 0);
