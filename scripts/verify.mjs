/* Headless layout verification for the FAFARI header/hero first pass.
   Run: node scripts/verify.mjs  (dev server must be running on :5173) */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});

const consoleErrors = [];
const track = (page) =>
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

/* ---------------- Desktop 1440x900 ---------------- */
const desktop = await browser.newPage();
track(desktop);
await desktop.setViewport({ width: 1440, height: 900 });
await desktop.goto(BASE, { waitUntil: 'networkidle0' });
await desktop.evaluate(() => document.fonts.ready);
await sleep(600);
await desktop.screenshot({ path: `${OUT}/01-desktop-initial.png` });
const solidAtTop = await desktop.$eval('.header-wrap', (el) => el.dataset.solid);

// Hover "Flowers" -> header solid + mega panel open
await desktop.hover('#nav-trigger-flowers');
await sleep(500);
await desktop.screenshot({ path: `${OUT}/02-desktop-mega-flowers.png` });

// Pointer moves into the panel: must stay open
await desktop.hover('#mega-flowers .mega-link');
await sleep(400);
const stillOpen = await desktop.$eval('#mega-flowers', (el) => el.dataset.open);
await desktop.screenshot({ path: `${OUT}/03-desktop-mega-hover-inside.png` });

// Pointer leaves header: transparent again, menu closed
await desktop.mouse.move(720, 700);
await sleep(600);
const closedAfterLeave = await desktop.$eval('#mega-flowers', (el) => el.dataset.open);
await desktop.screenshot({ path: `${OUT}/04-desktop-closed-transparent.png` });

// Small scroll (hero still behind): header must already be solid
await desktop.evaluate(() => window.scrollTo({ top: 200, behavior: 'instant' }));
await sleep(500);
const solidAfterSmallScroll = await desktop.$eval('.header-wrap', (el) => el.dataset.solid);
await desktop.screenshot({ path: `${OUT}/15-desktop-partial-scroll.png` });

// Back to the very top: transparent again
await desktop.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await sleep(500);
const solidBackAtTop = await desktop.$eval('.header-wrap', (el) => el.dataset.solid);

// Switch menus by hovering another trigger
await desktop.hover('#nav-trigger-events');
await sleep(500);
await desktop.screenshot({ path: `${OUT}/05-desktop-mega-events.png` });
await desktop.mouse.move(720, 700);
await sleep(500);

// Scrolled past hero -> sticky near-black header
await desktop.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
await sleep(600);
await desktop.screenshot({ path: `${OUT}/06-desktop-scrolled.png` });
await desktop.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await sleep(600);

// Keyboard: focus trigger, Enter opens, Escape closes
await desktop.focus('#nav-trigger-gifts');
await sleep(300);
await desktop.screenshot({ path: `${OUT}/07-desktop-focus-state.png` });
await desktop.keyboard.press('Enter');
await sleep(400);
const openedByKeyboard = await desktop.$eval('#mega-gifts', (el) => el.dataset.open);
await desktop.screenshot({ path: `${OUT}/08-desktop-mega-gifts-kbd.png` });
await desktop.keyboard.press('Escape');
await sleep(400);
const closedByEscape = await desktop.$eval('#mega-gifts', (el) => el.dataset.open);
const focusReturned = await desktop.evaluate(() => document.activeElement?.id);

/* Search: open, focus, solid header, scroll lock, compact panel */
await desktop.click('.header-search');
await sleep(500);
const searchOpenState = await desktop.$eval('#search-panel', (el) => el.dataset.open);
const searchFocus = await desktop.evaluate(() => document.activeElement?.id);
const searchSolid = await desktop.$eval('.header-wrap', (el) => el.dataset.solid);
const bodyLocked = await desktop.evaluate(() => document.body.style.overflow);
const searchPlaceholder = await desktop.$eval('#fafari-search', (el) => el.placeholder);
const panelBox = await desktop.$eval('#search-panel', (el) => {
  const r = el.getBoundingClientRect();
  return { bottom: Math.round(r.bottom), viewport: window.innerHeight };
});
const popularChips = await desktop.$$eval(
  '.search-suggestions .search-group:first-child .search-chip',
  (els) => els.map((el) => el.textContent.trim()),
);
const exploreHrefs = await desktop.$$eval(
  '.search-suggestions .search-group:nth-child(2) .search-chip',
  (els) => els.map((el) => el.getAttribute('href')),
);
await desktop.screenshot({ path: `${OUT}/16-desktop-search-open.png` });

await desktop.type('#fafari-search', 'ros');
await sleep(500);
const liveMatches = await desktop.$$eval('.search-match', (els) => els.length);
const matchThumbs = await desktop.$$eval('.search-match-thumb', (els) =>
  els.every((img) => img.complete && img.naturalWidth > 0),
);
const matchPrice = await desktop.$eval('.search-match-price', (el) => el.textContent.trim());
await desktop.screenshot({ path: `${OUT}/17-desktop-search-typing.png` });

// View all results -> same results view as a submitted search
await desktop.click('.search-view-all');
await sleep(700);
const viewAllUrl = await desktop.evaluate(() => window.location.search);
const resultsVisible = await desktop.$$eval('.search-results-view', (els) => els.length);
await desktop.screenshot({ path: `${OUT}/18-desktop-search-results.png` });

// Explore chip opens the shop with that category selected
await desktop.click('.header-search');
await sleep(500);
await desktop.click('.search-suggestions .search-group:nth-child(2) .search-chip:nth-child(3)');
await sleep(700);
const explorePath = await desktop.evaluate(() => window.location.pathname);
const exploreSearch = await desktop.evaluate(() => window.location.search);
const explorePanelClosed = await desktop.$eval('#search-panel', (el) => el.dataset.open);
const exploreCards = await desktop.$$eval('.shop .product-card', (els) => els.length);

// Escape closes and returns focus to the search icon
await desktop.click('.header-search');
await sleep(500);
await desktop.keyboard.press('Escape');
await sleep(500);
const searchClosedByEscape = await desktop.$eval('#search-panel', (el) => el.dataset.open);
const focusAfterSearchClose = await desktop.evaluate(() => document.activeElement?.className);

// Backdrop click closes (the compact panel ends well above 800px)
await desktop.click('.header-search');
await sleep(500);
await desktop.mouse.click(720, 800);
await sleep(500);
const searchClosedByBackdrop = await desktop.$eval('#search-panel', (el) => el.dataset.open);

// Submit -> results view on /?q=
await desktop.click('.header-search');
await sleep(500);
await desktop.type('#fafari-search', 'sympathy');
await sleep(400);
await desktop.keyboard.press('Enter');
await sleep(700);
const searchUrl = await desktop.evaluate(() => window.location.search);

// Popular chip submits its own term
await desktop.click('.header-search');
await sleep(500);
await desktop.click('.search-suggestions .search-group:first-child .search-chip');
await sleep(700);
const popularUrl = await desktop.evaluate(() => window.location.search);

// No-match empty state
await desktop.click('.header-search');
await sleep(500);
await desktop.type('#fafari-search', 'zzzqqq');
await sleep(500);
const noMatchText = await desktop.$eval('.search-empty-title', (el) => el.textContent.trim());
await desktop.screenshot({ path: `${OUT}/19-desktop-search-nomatch.png` });
await desktop.keyboard.press('Escape');
await sleep(400);

/* ---------------- Discovery section (desktop) ---------------- */
await desktop.goto(BASE, { waitUntil: 'networkidle0' });
await desktop.evaluate(() => document.fonts.ready);
await sleep(500);

// Cross-link: search panel suggestion -> guided discovery section
await desktop.click('.header-search');
await sleep(500);
await desktop.click('.search-discovery-link');
await sleep(1500);
const linkClosedSearch = await desktop.$eval('#search-panel', (el) => el.dataset.open);
const discoveryTopAfterLink = await desktop.evaluate(() =>
  Math.round(document.getElementById('find-a-gift').getBoundingClientRect().top),
);
await desktop.screenshot({ path: `${OUT}/27-desktop-search-to-discovery.png` });

await desktop.evaluate(() =>
  document.getElementById('find-a-gift').scrollIntoView({ behavior: 'instant', block: 'start' }),
);
await sleep(400);
await desktop.screenshot({ path: `${OUT}/21-desktop-discovery.png` });

await desktop.click('[data-group="occasion"] .choice[data-value="birthday"]');
await desktop.click('[data-group="gesture"] .choice[data-value="flowers"]');
await sleep(200);
await desktop.click('.discovery-submit');
await sleep(500);
const singleProductCards = await desktop.$$eval('.discovery-card', (els) => els.length);
const firstCardChip = await desktop.$eval('.discovery-card-chip', (el) => el.textContent.trim());

// A richer gesture shows up to three real products from the catalogue
await desktop.click('[data-group="gesture"] .choice[data-value="flowers-gifts"]');
await sleep(200);
await desktop.click('.discovery-submit');
await sleep(500);
const pickedCards = await desktop.$$eval('.discovery-card', (els) => els.length);
await desktop.screenshot({ path: `${OUT}/22-desktop-discovery-result.png` });

await desktop.type('#discovery-note', 'she loves roses and something elegant');
await sleep(200);
await desktop.click('.discovery-submit');
await sleep(500);
const pickedText = await desktop.$eval('.discovery-picked-text', (el) => el.textContent);
await desktop.screenshot({ path: `${OUT}/23-desktop-discovery-refined.png` });

// "Change my choices" returns focus to the filters and restores the image
await desktop.click('.discovery-change');
await sleep(400);
const pickedHidden = await desktop.$$eval('.discovery-picked', (els) => els.length);
const focusAfterChange = await desktop.evaluate(() => document.activeElement?.getAttribute('data-value'));
const imageBack = await desktop.$$eval('.discovery-media', (els) => els.length);

await desktop.click('.discovery-enquire');
await sleep(400);
const enquiryVisible = await desktop.$$eval('.discovery-enquiry', (els) => els.length);
await desktop.screenshot({ path: `${OUT}/24-desktop-discovery-enquiry.png` });

/* ---------------- Products: weekly edit, shop, filters, detail ---------------- */
await desktop.evaluate(() =>
  document.querySelector('.weekly').scrollIntoView({ behavior: 'instant', block: 'start' }),
);
await sleep(400);
const homeCards = await desktop.$$eval('.weekly .product-card', (els) => els.length);
const homePrice = await desktop.$eval('.weekly .product-card-price', (el) => el.textContent.trim());
const weeklyOrder = await desktop.$$eval('.weekly .product-card-name', (els) =>
  els.map((el) => el.textContent.trim()),
);
await desktop.screenshot({ path: `${OUT}/29-desktop-weekly-edit.png` });

// Explore All Gifts -> shop listing: nine products, every image resolved
await desktop.click('.weekly-link');
await sleep(700);
const shopPath = await desktop.evaluate(() => window.location.pathname);
const shopCards = await desktop.$$eval('.shop .product-card', (els) => els.length);
const imagesResolved = await desktop.$$eval('.shop .product-card-media img', (els) =>
  els.every((img) => img.complete && img.naturalWidth > 0),
);
await desktop.screenshot({ path: `${OUT}/30-desktop-shop.png` });

// Category filter: Plants -> three pieces on a deep-linkable URL
await desktop.click('.shop-filters .choice:nth-child(4)');
await sleep(500);
const shopCatSearch = await desktop.evaluate(() => window.location.search);
const plantsCards = await desktop.$$eval('.shop .product-card', (els) => els.length);
await desktop.screenshot({ path: `${OUT}/31-desktop-shop-plants.png` });

// Keyword search matches the catalogue and links into the detail view
await desktop.click('.header-search');
await sleep(400);
await desktop.type('#fafari-search', 'vlisco');
await sleep(500);
await desktop.keyboard.press('Enter');
await sleep(700);
const productSearchUrl = await desktop.evaluate(() => window.location.search);
const resultsHasProduct = await desktop.$$eval('.results-grid .product-card-link', (els) =>
  els.some((a) => a.getAttribute('href') === '/product/vlisco-celebration-hamper'),
);
await desktop.click('.results-grid .product-card-link[href="/product/vlisco-celebration-hamper"]');
await sleep(700);
const detailPath = await desktop.evaluate(() => window.location.pathname);
const detailName = await desktop.$eval('.product-detail-name', (el) => el.textContent.trim());
const detailPrice = await desktop.$eval('.product-detail-price', (el) => el.textContent.trim());
await desktop.screenshot({ path: `${OUT}/32-desktop-product-detail.png` });

/* ---------------- Results page: luxury gifts, filters, sample terms ---------------- */
await desktop.goto(`${BASE}/?q=${encodeURIComponent('Luxury Gifts')}`, { waitUntil: 'networkidle0' });
await desktop.evaluate(() => document.fonts.ready);
await sleep(600);
const luxuryNames = await desktop.$$eval('.results-grid .product-card-name', (els) =>
  els.map((el) => el.textContent.trim()),
);
const luxuryCount = await desktop.$eval('.results-count', (el) => el.textContent.trim());
const resultsFieldValue = await desktop.$eval('#results-search', (el) => el.value);
const titleFont = await desktop.$eval('.search-results-title', (el) => getComputedStyle(el).fontFamily);
const nameFont = await desktop.$eval('.results-grid .product-card-name', (el) =>
  getComputedStyle(el).fontFamily,
);
await desktop.screenshot({ path: `${OUT}/37-desktop-results-luxury.png` });

// Category control narrows to Gift Sets; price band narrows the full match set
await desktop.click('.results-cats .results-choice:nth-child(6)');
await sleep(500);
const catFilterUrl = await desktop.evaluate(() => window.location.search);
const catFilterCards = await desktop.$$eval('.results-grid .product-card', (els) => els.length);
await desktop.click('.results-cats .results-choice:nth-child(1)');
await sleep(500);
await desktop.select('.results-select', 'over-1000');
await sleep(500);
const priceFilterCards = await desktop.$$eval('.results-grid .product-card', (els) => els.length);
await desktop.screenshot({ path: `${OUT}/38-desktop-results-price.png` });

// Sample terms return sensible product counts
const termCounts = {};
for (const sample of ['roses', 'birthday', 'plant', 'wine', 'hamper']) {
  await desktop.goto(`${BASE}/?q=${sample}`, { waitUntil: 'networkidle0' });
  await sleep(400);
  termCounts[sample] = await desktop.$$eval('.results-grid .product-card', (els) => els.length);
}

// Service-style term: empty state + related categories, no product cards
await desktop.goto(`${BASE}/?q=${encodeURIComponent('gift wrapping')}`, { waitUntil: 'networkidle0' });
await sleep(400);
const wrapProducts = await desktop.$$eval('.results-grid .product-card', (els) => els.length);
const wrapExplore = await desktop.$$eval('.results-explore .search-chip', (els) => els.length);
const emptyBrowse = await desktop.$$eval('.results-browse', (els) => els.length);
await desktop.screenshot({ path: `${OUT}/39-desktop-results-empty.png` });

/* ---------------- Homepage category tiles ---------------- */
await desktop.goto(BASE, { waitUntil: 'networkidle0' });
await desktop.evaluate(() => document.fonts.ready);
await sleep(500);
const categoryLabels = await desktop.$$eval('.categories-label', (els) =>
  els.map((el) => el.textContent.trim()),
);
const categoryHrefs = await desktop.$$eval('.categories-link', (els) =>
  els.map((el) => el.getAttribute('href')),
);
const catsAfterWeekly = await desktop.evaluate(() => {
  const weekly = document.querySelector('.weekly').getBoundingClientRect();
  const cats = document.querySelector('.categories').getBoundingClientRect();
  return cats.top >= weekly.bottom - 4;
});
await desktop.evaluate(() =>
  document.querySelector('.categories').scrollIntoView({ behavior: 'instant', block: 'start' }),
);
await sleep(400);
await desktop.screenshot({ path: `${OUT}/40-desktop-categories.png` });

// Tile deep-links into the filtered shop (Gift Sets & Hampers spans two)
await desktop.click('.categories-grid li:nth-child(2) .categories-link');
await sleep(700);
const tileUrl = await desktop.evaluate(() => window.location.search);
const tileCards = await desktop.$$eval('.shop .product-card', (els) => els.length);
const tilePressed = await desktop.$$eval('.shop-choice[aria-pressed="true"]', (els) =>
  els.map((el) => el.textContent.trim()),
);

/* ---------------- Mobile 375x667 (touch) ---------------- */
const mobile = await browser.newPage();
track(mobile);
await mobile.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
await mobile.goto(BASE, { waitUntil: 'networkidle0' });
await mobile.evaluate(() => document.fonts.ready);
await sleep(600);
await mobile.screenshot({ path: `${OUT}/09-mobile-hero.png` });

await mobile.tap('.header-menu-toggle');
await sleep(600);
const solidWithDrawer = await mobile.$eval('.header-wrap', (el) => el.dataset.solid);
await mobile.screenshot({ path: `${OUT}/10-mobile-drawer.png` });

await mobile.tap('.drawer-group-toggle');
await sleep(500);
await mobile.screenshot({ path: `${OUT}/11-mobile-group-open.png` });

// Escape closes the drawer
await mobile.keyboard.press('Escape');
await sleep(600);
const drawerClosed = await mobile.$eval('#mobile-drawer', (el) => el.dataset.open);

// Search from the drawer: drawer closes, panel opens, input focused
await mobile.tap('.header-menu-toggle');
await sleep(600);
await mobile.tap('.drawer-search');
await sleep(700);
const mobileSearchOpen = await mobile.$eval('#search-panel', (el) => el.dataset.open);
const mobileDrawerClosedBySearch = await mobile.$eval('#mobile-drawer', (el) => el.dataset.open);
const mobileSearchFocus = await mobile.evaluate(() => document.activeElement?.id);
const inputBox = await mobile.$eval('#fafari-search', (el) => {
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
});
const closeBox = await mobile.$eval('.search-close', (el) => {
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) };
});
const mobilePanelBox = await mobile.$eval('#search-panel', (el) => {
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), bottom: Math.round(r.bottom), viewport: window.innerHeight };
});
const mobileChipHeight = await mobile.$eval('.search-chip', (el) =>
  Math.round(el.getBoundingClientRect().height),
);
await mobile.type('#fafari-search', 'ros');
await sleep(500);
const mobileMatches = await mobile.$$eval('.search-match', (els) => els.length);
await mobile.screenshot({ path: `${OUT}/20-mobile-search.png` });
await mobile.keyboard.press('Escape');
await sleep(600);
const mobileSearchClosed = await mobile.$eval('#search-panel', (el) => el.dataset.open);
const mobileFocusAfterClose = await mobile.evaluate(() => document.activeElement?.className);

await mobile.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
await sleep(600);
await mobile.screenshot({ path: `${OUT}/12-mobile-scrolled.png` });

// Discovery on mobile: stacked layout, tappable choices
await mobile.evaluate(() =>
  document.getElementById('find-a-gift').scrollIntoView({ behavior: 'instant', block: 'start' }),
);
await sleep(400);
const choiceHeight = await mobile.$eval('.choice', (el) => Math.round(el.getBoundingClientRect().height));
await mobile.screenshot({ path: `${OUT}/25-mobile-discovery.png` });

// Mobile result area sits immediately below the filters + button
await mobile.tap('[data-group="occasion"] .choice[data-value="birthday"]');
await mobile.tap('[data-group="gesture"] .choice[data-value="flowers"]');
await mobile.tap('.discovery-submit');
await sleep(500);
const mobilePickedGap = await mobile.evaluate(() => {
  const actions = document.querySelector('.discovery-actions').getBoundingClientRect();
  const picked = document.querySelector('.discovery-picked').getBoundingClientRect();
  return Math.round(picked.top - actions.bottom);
});
await mobile.screenshot({ path: `${OUT}/28-mobile-discovery-result.png` });

// Weekly edit on mobile: two compact columns, images loaded
await mobile.evaluate(() =>
  document.querySelector('.weekly').scrollIntoView({ behavior: 'instant', block: 'start' }),
);
await sleep(500);
const weeklyMobileTwoUp = await mobile.evaluate(() => {
  const cards = document.querySelectorAll('.weekly .product-card');
  if (cards.length < 2) return false;
  const a = cards[0].getBoundingClientRect();
  const b = cards[1].getBoundingClientRect();
  return Math.abs(a.top - b.top) < 2 && b.left > a.right - 4;
});
const weeklyMobileImages = await mobile.$$eval('.weekly .product-card-media img', (els) =>
  els.every((img) => img.complete && img.naturalWidth > 0),
);
await mobile.screenshot({ path: `${OUT}/35-mobile-weekly.png` });

// Mobile shop: direct load, two-up grid, whole product visible at 5:6
await mobile.goto(`${BASE}/shop`, { waitUntil: 'networkidle0' });
await sleep(700);
const mobileShopCards = await mobile.$$eval('.shop .product-card', (els) => els.length);
const mobileCardBox = await mobile.$eval('.shop .product-card-media', (el) => {
  const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height) };
});
await mobile.screenshot({ path: `${OUT}/33-mobile-shop.png` });
await mobile.tap('.shop-filters .choice:nth-child(2)');
await sleep(500);
const mobileFlowersCards = await mobile.$$eval('.shop .product-card', (els) => els.length);
await mobile.screenshot({ path: `${OUT}/34-mobile-shop-flowers.png` });

// Search results on mobile: two-up cards, refine field reachable
await mobile.goto(`${BASE}/?q=${encodeURIComponent('Luxury Gifts')}`, { waitUntil: 'networkidle0' });
await sleep(700);
const mobileResultsTwoUp = await mobile.evaluate(() => {
  const cards = document.querySelectorAll('.results-grid .product-card');
  if (cards.length < 2) return false;
  const a = cards[0].getBoundingClientRect();
  const b = cards[1].getBoundingClientRect();
  return Math.abs(a.top - b.top) < 2 && b.left > a.right - 4;
});
const mobileResultsField = await mobile.$eval('#results-search', (el) => {
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), inView: r.top >= 0 && r.bottom <= window.innerHeight };
});
await mobile.screenshot({ path: `${OUT}/41-mobile-results-luxury.png` });

// Category tiles on mobile: compact two-up
await mobile.goto(BASE, { waitUntil: 'networkidle0' });
await sleep(600);
await mobile.evaluate(() =>
  document.querySelector('.categories').scrollIntoView({ behavior: 'instant', block: 'start' }),
);
await sleep(400);
const mobileCategoryTwoUp = await mobile.evaluate(() => {
  const tiles = document.querySelectorAll('.categories-link');
  if (tiles.length < 2) return false;
  const a = tiles[0].getBoundingClientRect();
  const b = tiles[1].getBoundingClientRect();
  return Math.abs(a.top - b.top) < 2 && b.left > a.right - 4;
});
await mobile.screenshot({ path: `${OUT}/42-mobile-categories.png` });

/* ---------------- Mobile wide 430x932 (touch) ---------------- */
const mobileWide = await browser.newPage();
track(mobileWide);
await mobileWide.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true });
await mobileWide.goto(BASE, { waitUntil: 'networkidle0' });
await mobileWide.evaluate(() => document.fonts.ready);
await sleep(600);
await mobileWide.screenshot({ path: `${OUT}/14-mobile-430-hero.png` });

/* ---------------- Tablet 820x1180 sanity ---------------- */
const tablet = await browser.newPage();
track(tablet);
await tablet.setViewport({ width: 820, height: 1180, isMobile: true, hasTouch: true });
await tablet.goto(BASE, { waitUntil: 'networkidle0' });
await sleep(600);
await tablet.screenshot({ path: `${OUT}/13-tablet-hero.png` });
await tablet.evaluate(() =>
  document.getElementById('find-a-gift').scrollIntoView({ behavior: 'instant', block: 'start' }),
);
await sleep(400);
await tablet.screenshot({ path: `${OUT}/26-tablet-discovery.png` });

// Weekly edit on tablet: two columns
await tablet.evaluate(() =>
  document.querySelector('.weekly').scrollIntoView({ behavior: 'instant', block: 'start' }),
);
await sleep(400);
const weeklyTabletTwoUp = await tablet.evaluate(() => {
  const cards = document.querySelectorAll('.weekly .product-card');
  if (cards.length < 2) return false;
  const a = cards[0].getBoundingClientRect();
  const b = cards[1].getBoundingClientRect();
  return Math.abs(a.top - b.top) < 2 && b.left > a.right - 4;
});
await tablet.screenshot({ path: `${OUT}/36-tablet-weekly.png` });

await browser.close();

console.log(
  JSON.stringify(
    {
      solidAtTop,
      solidAfterSmallScroll,
      solidBackAtTop,
      solidWithDrawer,
      menuStayedOpenInsidePanel: stillOpen,
      menuClosedAfterPointerLeft: closedAfterLeave,
      openedByKeyboard,
      closedByEscape,
      focusReturnedTo: focusReturned,
      drawerClosedByEscape: drawerClosed,
      searchOpenState,
      searchFocus,
      searchSolid,
      bodyLocked,
      searchPlaceholder,
      panelBox,
      popularChips,
      exploreHrefs,
      liveMatches,
      matchThumbs,
      matchPrice,
      viewAllUrl,
      explorePath,
      exploreSearch,
      explorePanelClosed,
      exploreCards,
      popularUrl,
      searchClosedByEscape,
      focusAfterSearchClose,
      searchClosedByBackdrop,
      searchUrl,
      resultsVisible,
      noMatchText,
      mobileSearchOpen,
      mobileDrawerClosedBySearch,
      mobileSearchFocus,
      inputBox,
      closeBox,
      mobilePanelBox,
      mobileChipHeight,
      mobileMatches,
      mobileSearchClosed,
      mobileFocusAfterClose,
      firstCardChip,
      singleProductCards,
      pickedCards,
      pickedTextIncludesRoses: pickedText.includes('roses'),
      pickedHidden,
      focusAfterChange,
      imageBack,
      enquiryVisible,
      choiceHeight,
      mobilePickedGap,
      homeCards,
      homePrice,
      weeklyOrder,
      shopPath,
      shopCards,
      imagesResolved,
      shopCatSearch,
      plantsCards,
      productSearchUrl,
      resultsHasProduct,
      detailPath,
      detailName,
      detailPrice,
      luxuryNames,
      luxuryCount,
      resultsFieldValue,
      titleFont,
      nameFont,
      catFilterUrl,
      catFilterCards,
      priceFilterCards,
      termCounts,
      wrapProducts,
      wrapExplore,
      emptyBrowse,
      categoryLabels,
      categoryHrefs,
      catsAfterWeekly,
      tileUrl,
      tileCards,
      tilePressed,
      mobileShopCards,
      mobileCardBox,
      mobileFlowersCards,
      mobileResultsTwoUp,
      mobileResultsField,
      mobileCategoryTwoUp,
      weeklyMobileTwoUp,
      weeklyMobileImages,
      weeklyTabletTwoUp,
      linkClosedSearch,
      discoveryTopAfterLink,
      consoleErrors,
    },
    null,
    2,
  ),
);
