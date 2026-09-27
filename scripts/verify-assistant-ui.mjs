/* Fafari Assistant — UI tests.

   Drives the real drawer/sheet in headless Chrome with request
   interception standing in for /api/assistant, so every required case is
   verified deterministically: specific occasion + budget, a vague request
   needing one follow-up, no match, a Groq/API failure, and the mobile
   sheet — plus focus, Escape, Start over, loading state, real product
   cards and search-context carry-over. */
import puppeteer from 'puppeteer-core';

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

const RESPONSES = {
  recommend: {
    status: 200,
    body: {
      reply: 'For your mum’s birthday under GH₵500, the Crimson Wine Gift is an elegant ready-to-give choice.',
      productIds: ['crimson-wine-gift', 'blush-and-bloom-bouquet'],
      needsFollowUp: false,
      customOrder: false,
    },
  },
  followup: {
    status: 200,
    body: { reply: 'I’d love to help — what is the occasion, and do you have a budget in mind?', productIds: [], needsFollowUp: true, customOrder: false },
  },
  nomatch: {
    status: 200,
    body: { reply: 'We don’t have anything like that in the studio, but we would love to create it for you.', productIds: [], needsFollowUp: false, customOrder: true },
  },
  degraded: {
    status: 200,
    body: { reply: 'I’m having trouble reaching the studio assistant right now. Please message us on WhatsApp.', productIds: [], needsFollowUp: false, customOrder: true, degraded: true },
  },
};
const DELAY = { recommend: 650 };

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();

let scenario = 'recommend';
let lastPost = null;

await page.setRequestInterception(true);
page.on('request', (req) => {
  const url = req.url();
  if (url.includes('/api/assistant') && req.method() === 'POST') {
    lastPost = req.postData();
    const respond = () => {
      if (scenario === 'error') {
        req.respond({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) });
        return;
      }
      const r = RESPONSES[scenario] ?? RESPONSES.recommend;
      req.respond({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body) });
    };
    const d = DELAY[scenario] || 0;
    if (d) setTimeout(respond, d);
    else respond();
    return;
  }
  req.continue();
});

const goto = async (url) => {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.assistant-fab', { timeout: 5000 });
};
const openWait = async () => {
  await page.waitForSelector('.assistant-drawer[data-open="true"]', { timeout: 2000 });
  await new Promise((r) => setTimeout(r, 430));
};
const send = async (text) => {
  await page.type('.assistant-input', text);
  await page.click('.assistant-send');
};
/* Count real assistant replies (`.assistant-text`), ignoring the typing
   indicator — which also wears `.assistant-msg--assistant` — and wait for
   loading to settle so we never read the transient bubble. */
const waitAssistantCount = async (n) => {
  await page.waitForFunction(
    (count) =>
      document.querySelectorAll('.assistant-msg--assistant .assistant-text').length >= count &&
      !document.querySelector('.assistant-typing'),
    { timeout: 6000 },
    n,
  );
  await new Promise((r) => setTimeout(r, 60));
};
const lastAssistant = () =>
  page.evaluate(() => {
    const msgs = [...document.querySelectorAll('.assistant-msg--assistant')];
    const last = msgs[msgs.length - 1];
    if (!last) return null;
    const cards = [...last.querySelectorAll('.assistant-products .product-card')].map((li) => {
      const link = li.querySelector('.product-card-link');
      const img = li.querySelector('.product-card-media img');
      return {
        href: link?.getAttribute('href') ?? null,
        src: img?.getAttribute('src') ?? null,
        name: li.querySelector('.product-card-name')?.textContent?.trim() ?? '',
        price: li.querySelector('.product-card-price')?.textContent?.trim() ?? '',
        width: Math.round(li.getBoundingClientRect().width),
      };
    });
    const cta = last.querySelector('.assistant-cta');
    return {
      text: last.querySelector('.assistant-text')?.textContent?.trim() ?? '',
      cards,
      ctaHref: cta?.getAttribute('href') ?? null,
      ctaTarget: cta?.getAttribute('target') ?? null,
    };
  });

/* ---------- Desktop ---------- */
await page.setViewport({ width: 1440, height: 900 });
await goto('http://localhost:5173');

const fab = await page.evaluate(() => {
  const el = document.querySelector('.assistant-fab');
  const r = el.getBoundingClientRect();
  return { right: Math.round(innerWidth - r.right), bottom: Math.round(innerHeight - r.bottom), visible: r.width > 0 };
});
check('desktop: discreet fab bottom-right', fab.visible && fab.right <= 40 && fab.bottom <= 40, JSON.stringify(fab));

await page.click('.assistant-fab');
await openWait();

const dlg = await page.evaluate(() => {
  const el = document.querySelector('.assistant-drawer');
  const r = el.getBoundingClientRect();
  return {
    role: el.getAttribute('role'),
    modal: el.getAttribute('aria-modal'),
    x: Math.round(r.x),
    top: Math.round(r.top),
    w: Math.round(r.width),
    h: Math.round(r.height),
    right: Math.round(r.right),
    active: document.activeElement?.className || document.activeElement?.tagName,
    greeting: document.querySelectorAll('.assistant-msg--assistant').length,
  };
});
check('desktop: dialog semantics', dlg.role === 'dialog' && dlg.modal === 'true', JSON.stringify({ role: dlg.role, modal: dlg.modal }));
check('desktop: right-side drawer, full height', dlg.right >= 1438 && dlg.w <= 420 && dlg.top === 0 && dlg.h >= 898, JSON.stringify(dlg));
check('desktop: focus moved into the input', String(dlg.active).includes('assistant-input'), String(dlg.active));
check('desktop: opens with a greeting', dlg.greeting === 1);

/* Case 1 — specific occasion + budget -> up to 3 real product cards. */
scenario = 'recommend';
await send('a birthday gift for my mum under GH₵500');
await page.waitForSelector('.assistant-typing', { timeout: 1500 });
check('loading state shows while awaiting Groq', true);
await waitAssistantCount(2);
let a = await lastAssistant();
check('case1: user message recorded', (await page.$$eval('.assistant-msg--user', (e) => e.length)) >= 1);
check('case1: <=3 product cards', a.cards.length > 0 && a.cards.length <= 3, String(a.cards.length));
check(
  'case1: cards use real image/name/GH₵ price/product link',
  a.cards.every((c) => c.href?.startsWith('/product/') && c.src?.startsWith('/products/') && c.price?.startsWith('GH₵') && c.name.length > 0),
  JSON.stringify(a.cards),
);
check(
  'case1: recommended the matched products',
  a.cards.some((c) => c.href === '/product/crimson-wine-gift') && a.cards.some((c) => c.href === '/product/blush-and-bloom-bouquet'),
);
check('case1: no custom-order CTA when products found', a.ctaHref === null);

await page.screenshot({ path: 'scripts/shots/assistant-desktop.png', clip: { x: 1020, y: 0, width: 420, height: 900 } });

/* Escape closes + focus returns. */
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 420));
const closed = await page.evaluate(() => ({
  open: document.querySelector('.assistant-drawer')?.getAttribute('data-open'),
  active: document.activeElement?.className || document.activeElement?.tagName,
}));
check('escape closes the drawer', closed.open === 'false', String(closed.open));
check('focus returns to the trigger', String(closed.active).includes('assistant-fab'), String(closed.active));

/* Case 2 — vague request -> one follow-up, no products. */
await page.click('.assistant-fab');
await openWait();
scenario = 'followup';
await send('something nice');
await waitAssistantCount(2);
a = await lastAssistant();
check('case2: asks a follow-up question', /\?$/.test(a.text) || a.text.includes('?'), a.text);
check('case2: no products while following up', a.cards.length === 0);
check('case2: no custom-order CTA on a follow-up', a.ctaHref === null);

/* Start over resets the transcript. */
await page.click('.assistant-startover');
await new Promise((r) => setTimeout(r, 150));
const afterReset = await page.evaluate(() => ({
  assistant: document.querySelectorAll('.assistant-msg--assistant').length,
  user: document.querySelectorAll('.assistant-msg--user').length,
}));
check('start over resets to a single greeting', afterReset.assistant === 1 && afterReset.user === 0, JSON.stringify(afterReset));

/* Case 3 — no match -> custom order on WhatsApp. */
scenario = 'nomatch';
await send('a live penguin, please');
await waitAssistantCount(2);
a = await lastAssistant();
check('case3: no products', a.cards.length === 0);
check('case3: offers Discuss a custom order', a.ctaHref === 'https://wa.me/233506580545', String(a.ctaHref));
check('case3: WhatsApp opens in a new tab', (await page.$eval('.assistant-cta', (e) => e.getAttribute('target'))) === '_blank');

/* Case 4a — Groq failure surfaced as a degraded 200. */
scenario = 'degraded';
await send('roses for a wedding');
await waitAssistantCount(3);
a = await lastAssistant();
check('case4a: degraded reply shown', a.text.length > 0);
check('case4a: WhatsApp fallback offered', a.ctaHref === 'https://wa.me/233506580545');

/* Case 4b — transport/HTTP failure handled client-side. */
scenario = 'error';
await send('are you there?');
await waitAssistantCount(4);
a = await lastAssistant();
check('case4b: resilient fallback message on HTTP 500', /trouble reaching|WhatsApp/i.test(a.text), a.text);
check('case4b: WhatsApp fallback offered on error', a.ctaHref === 'https://wa.me/233506580545');

/* Context carry-over from the search results view. */
await goto('http://localhost:5173/?q=roses&price=under-500');
await page.waitForSelector('.results-assistant', { timeout: 4000 });
await page.click('.results-assistant');
await openWait();
const greet = await page.$eval('.assistant-msg--assistant .assistant-text', (e) => e.textContent);
check('search trigger: greeting carries the search context', greet.includes('roses'), greet);
scenario = 'recommend';
await send('what do you suggest');
await waitAssistantCount(2);
const ctx = lastPost ? JSON.parse(lastPost).context : '';
check('search trigger: query + filters sent to the endpoint', ctx.includes('roses') && ctx.includes('Under GH₵500'), ctx);

/* Search panel trigger opens the same assistant. */
await goto('http://localhost:5173');
await page.click('.header-search');
await page.waitForSelector('.search-assistant', { timeout: 3000 });
await page.click('.search-assistant');
await openWait();
const panelState = await page.evaluate(() => ({
  drawer: document.querySelector('.assistant-drawer')?.getAttribute('data-open'),
  search: document.querySelector('.search-panel')?.getAttribute('data-open'),
}));
check('search panel trigger: assistant opens, panel closes', panelState.drawer === 'true' && panelState.search === 'false', JSON.stringify(panelState));

/* ---------- Mobile sheet ---------- */
await page.setViewport({ width: 390, height: 844 });
await goto('http://localhost:5173');
await page.click('.assistant-fab');
await openWait();
const sheet = await page.evaluate(() => {
  const r = document.querySelector('.assistant-drawer').getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
});
check('mobile: full-width, full-height sheet', sheet.x === 0 && sheet.w >= 388 && sheet.y === 0 && sheet.h >= 842, JSON.stringify(sheet));

scenario = 'recommend';
await send('a birthday gift under GH₵500');
await waitAssistantCount(2);
a = await lastAssistant();
check('mobile: product cards are large, not tiny', a.cards.length > 0 && a.cards.every((c) => c.width > 200), JSON.stringify(a.cards.map((c) => c.width)));
const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
check('mobile: no horizontal overflow', overflow);
await page.screenshot({ path: 'scripts/shots/assistant-mobile.png' });

await browser.close();

const passed = results.filter((r) => r.ok).length;
for (const r of results) if (!r.ok) console.log(`  FAIL  ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
console.log(`\n${passed}/${results.length} UI checks passed`);
process.exit(passed === results.length ? 0 : 1);
