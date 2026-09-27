/* Audit: computed font of every heading vs the established type system.
   Run: node scripts/verify-heading-fonts.mjs  (dev server on :5173) */
import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:5173';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const audit = async (url, selectors) => {
  await page.goto(BASE + url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate((selectors) => {
    const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`);
    const rows = selectors
      .map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, missing: true };
        const cs = getComputedStyle(el);
        return {
          sel,
          text: el.textContent.trim().slice(0, 34),
          family: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
          size: cs.fontSize,
          rendered: document.fonts.check(`${cs.fontWeight} ${cs.fontSize} "${cs.fontFamily.split(',')[0].replace(/["']/g, '')}"`),
        };
      })
      .filter((r) => !r.missing);
    return { loaded, rows };
  }, selectors);
};

const home = await audit('/', [
  '.hero-title',
  '.hero-title-script',
  '.discovery-title',
  '.weekly-title',
  '.categories-title',
  '.categories-label',
  '.product-card-name',
]);
const search = await audit('/?q=Luxury%20Gifts', ['.search-results-title', '.product-card-name', '.results-count']);
const shop = await audit('/shop', ['.shop-title', '.product-card-name']);

for (const [name, result] of [['HOME', home], ['SEARCH', search], ['SHOP', shop]]) {
  console.log(`\n== ${name} ==`);
  for (const r of result.rows) {
    console.log(`${r.sel.padEnd(24)} ${r.family.padEnd(20)} ${r.size.padStart(8)}  loaded=${r.rendered}  "${r.text}"`);
  }
}
console.log('\nLoaded webfonts:', [...new Set(home.loaded)].join(' | '));

await browser.close();
