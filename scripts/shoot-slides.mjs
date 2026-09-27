/* Crop review helper: pins each slideshow frame via inline opacity and
   screenshots the frame so every per-photo object-position can be
   checked without waiting out the 4s cycle. */
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelector('.founder').scrollIntoView({ block: 'center' }));
await page.waitForFunction(() =>
  [...document.querySelectorAll('.founder-slide')].every((i) => i.complete && i.naturalWidth > 0),
);
for (let i = 1; i <= 5; i++) {
  await page.evaluate(
    (n) => {
      document.querySelectorAll('.founder-slide').forEach((s, idx) => {
        s.style.opacity = idx === n - 1 ? '1' : '0';
      });
    },
    i,
  );
  await new Promise((r) => setTimeout(r, 1100));
  const frame = await page.$('.founder-frame');
  await frame.screenshot({ path: `scripts/shots/slide-${i}.png` });
}
await browser.close();
console.log('done');
