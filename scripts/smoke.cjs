/* eslint-disable */
// Headless smoke test suite for hype-sign.
//
// Covers: layout integrity, display centering across rotation/mode,
// settings panel modes (split / floating / mobile bottom sheet), drag
// clamps (panel reposition + both resize handles), state actions,
// color stop bar axis, persistence + version migrations, i18n key
// completeness, and console-error detection. Each test has a clear
// pass / fail with a measured-vs-expected value.
//
// Caveat: headless puppeteer reproduces layout but NOT iOS-specific
// GPU compositor / safe-area / sub-pixel quirks. Real-device validation
// remains required for iOS PWA changes — see CLAUDE.md.
//
// Usage:
//   nvm use 18
//   NODE_PATH=$(npm root -g) node scripts/smoke.cjs
// or:
//   npm run smoke
//
// Filter:
//   npm run smoke -- --only=panel        # run only matching test names

const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}/hype-sign/`;
const SCREENSHOT_DIR = '/tmp/hype-sign-smoke';

const IPHONE = { width: 428, height: 926, deviceScaleFactor: 3 }; // iPhone 12 Pro Max
const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1 };

const ARGS = process.argv.slice(2);
const ONLY = (ARGS.find((a) => a.startsWith('--only=')) || '').slice('--only='.length);

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// ---------------------------------------------------------------------------
// assertions
// ---------------------------------------------------------------------------
function near(actual, expected, eps, msg) {
  if (Math.abs(actual - expected) > eps) {
    throw new Error(`${msg}: expected ~${expected} (±${eps}), got ${actual}`);
  }
}
function eq(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function truthy(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ---------------------------------------------------------------------------
// page helpers
// ---------------------------------------------------------------------------
async function newPage(browser, viewport, opts = {}) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errs = [];
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });
  page._errs = errs;
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  // Test isolation: clear persisted state so leaks from prior tests in
  // the same browser context don't bleed in via localStorage.
  await page.evaluate(() => localStorage.removeItem('hype-sign:v1'));
  if (opts.simulateNotch) await setNotch(page);
  return page;
}

async function setState(page, partial) {
  await page.evaluate((p) => {
    const v = JSON.parse(localStorage.getItem('hype-sign:v1') || '{"state":{},"version":3}');
    v.state = Object.assign(v.state || {}, p);
    v.version = 3;
    localStorage.setItem('hype-sign:v1', JSON.stringify(v));
  }, partial);
}

async function setNotch(page) {
  await page.evaluate(() => document.documentElement.style.setProperty('--sai-top', '47px'));
}

async function reloadAndWait(page, opts = {}) {
  await page.reload({ waitUntil: 'networkidle0' });
  if (opts.simulateNotch) await setNotch(page);
  await page.waitForSelector('.display-root');
  await new Promise((r) => setTimeout(r, opts.settle ?? 600));
}

async function clickCanvas(page) {
  await page.evaluate(() => document.querySelector('.display-root').click());
  await new Promise((r) => setTimeout(r, 400));
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`) });
}

async function dragHandle(page, handleSelector, dy) {
  const box = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, handleSelector);
  if (!box) throw new Error(`handle not found: ${handleSelector}`);
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await page.mouse.move(box.x, box.y + dy, { steps: 10 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 200));
}

// ---------------------------------------------------------------------------
// A. layout integrity
// ---------------------------------------------------------------------------
test('layout: bg-layer is full-bleed (mobile, simulated notch)', async (browser) => {
  const page = await newPage(browser, IPHONE, { simulateNotch: true });
  await reloadAndWait(page, { simulateNotch: true });
  const r = await page.evaluate(() => {
    const bg = document.querySelector('.bg-layer');
    const cs = getComputedStyle(bg);
    return {
      rect: bg.getBoundingClientRect(),
      width: cs.width,
      height: cs.height,
      top: cs.top,
      left: cs.left,
    };
  });
  near(r.rect.top, 0, 0.5, 'bg-layer.top reaches physical top');
  near(r.rect.bottom, 926, 0.5, 'bg-layer.bottom reaches physical bottom (no home-indicator gap)');
  near(r.rect.left, 0, 0.5, 'bg-layer.left');
  near(r.rect.right, 428, 0.5, 'bg-layer.right');
  await page.close();
});

test('layout: display-root respects sai-top inset', async (browser) => {
  const page = await newPage(browser, IPHONE, { simulateNotch: true });
  await reloadAndWait(page, { simulateNotch: true });
  const r = await page.evaluate(() => document.querySelector('.display-root').getBoundingClientRect());
  near(r.top, 47, 0.5, 'display-root.top equals sai-top');
  near(r.bottom, 926, 0.5, 'display-root reaches physical bottom');
  await page.close();
});

test('layout: --display-w / -h / -min are integer values', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await reloadAndWait(page);
  const v = await page.evaluate(() => {
    const dr = document.querySelector('.display-root');
    return ['--display-w', '--display-h', '--display-min'].map((k) => dr.style.getPropertyValue(k).trim());
  });
  for (const s of v) {
    const n = parseFloat(s);
    truthy(Number.isInteger(n), `${s} should be integer (was "${s}")`);
  }
  await page.close();
});

test('layout: panel never shrinks display-root', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await reloadAndWait(page);
  const before = await page.evaluate(() => document.querySelector('.display-root').getBoundingClientRect().width);
  await clickCanvas(page);
  const after = await page.evaluate(() => document.querySelector('.display-root').getBoundingClientRect().width);
  near(before, after, 0.5, 'display-root width unchanged when panel opens (no-shrink invariant)');
  await page.close();
});

// ---------------------------------------------------------------------------
// B. display centering — measure SVG <text> ink, NOT the SVG container
// ---------------------------------------------------------------------------
async function measureInk(page) {
  return page.evaluate(() => {
    const t = document.querySelector('svg text');
    if (!t) return null;
    const r = t.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  });
}

for (const rot of [0, 90, 180, 270]) {
  test(`static centering: ink horizontally symmetric @rot=${rot}`, async (browser) => {
    const page = await newPage(browser, IPHONE, { simulateNotch: true });
    await setState(page, { mode: 'static', rotation: rot, text: '歡迎\n光臨', margin: 0 });
    await reloadAndWait(page, { simulateNotch: true, settle: 800 });
    const ink = await measureInk(page);
    truthy(ink, 'svg text exists');
    const lm = ink.left;
    const rm = 428 - ink.right;
    near(lm - rm, 0, 2, `H-asymmetry (L=${lm.toFixed(2)} R=${rm.toFixed(2)})`);
    await shot(page, `static-rot-${rot}`);
    await page.close();
  });
}

for (const rot of [90, 270]) {
  test(`marquee centering: ink horizontally symmetric @rot=${rot} (snapped)`, async (browser) => {
    const page = await newPage(browser, IPHONE, { simulateNotch: true });
    await setState(page, { mode: 'marquee', rotation: rot, text: '歡迎光臨', margin: 0 });
    await reloadAndWait(page, { simulateNotch: true, settle: 1200 });
    // Snap the marquee animation translate to 0 so we have a deterministic moment.
    await page.evaluate(() => {
      const inner = document.querySelector('.display-root > div > div > div > div');
      if (inner) inner.style.transform = 'translate3d(0px, 0px, 0px)';
    });
    const ink = await measureInk(page);
    truthy(ink, 'svg text exists');
    const lm = ink.left;
    const rm = 428 - ink.right;
    near(lm - rm, 0, 2, `H-asymmetry (L=${lm.toFixed(2)} R=${rm.toFixed(2)})`);
    await shot(page, `marquee-rot-${rot}`);
    await page.close();
  });
}

// ---------------------------------------------------------------------------
// C. settings panel modes
// ---------------------------------------------------------------------------
test('panel: initial state hidden (no .open class)', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await reloadAndWait(page);
  const cls = await page.evaluate(() => document.querySelector('.drawer').className);
  truthy(!cls.includes('open'), `drawer should not be .open initially (was "${cls}")`);
  await page.close();
});

test('panel: click canvas opens / closes (desktop split)', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await reloadAndWait(page);
  await clickCanvas(page);
  let cls = await page.evaluate(() => document.querySelector('.drawer').className);
  truthy(cls.includes('drawer--split') && cls.includes('open'), `expected split.open, got "${cls}"`);
  await clickCanvas(page);
  cls = await page.evaluate(() => document.querySelector('.drawer').className);
  truthy(!cls.includes('open'), `expected closed, got "${cls}"`);
  await page.close();
});

test('panel: ESC closes', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await reloadAndWait(page);
  await clickCanvas(page);
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 300));
  const cls = await page.evaluate(() => document.querySelector('.drawer').className);
  truthy(!cls.includes('open'), `expected closed after ESC, got "${cls}"`);
  await page.close();
});

test('panel: mode toggle button switches split ↔ floating (desktop)', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await reloadAndWait(page);
  await clickCanvas(page);
  await page.click('.drawer-mode-toggle');
  await new Promise((r) => setTimeout(r, 300));
  let cls = await page.evaluate(() => document.querySelector('.drawer').className);
  truthy(cls.includes('drawer--floating'), `expected floating, got "${cls}"`);
  await page.click('.drawer-mode-toggle');
  await new Promise((r) => setTimeout(r, 300));
  cls = await page.evaluate(() => document.querySelector('.drawer').className);
  truthy(cls.includes('drawer--split'), `expected split, got "${cls}"`);
  await page.close();
});

test('panel: mode toggle button NOT rendered on mobile', async (browser) => {
  const page = await newPage(browser, IPHONE);
  await reloadAndWait(page);
  await clickCanvas(page);
  const exists = await page.evaluate(() => !!document.querySelector('.drawer-mode-toggle'));
  truthy(!exists, 'drawer-mode-toggle should not exist on mobile (< 768px)');
  await page.close();
});

test('panel: floating mode persists position via floatingPos', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, { panelMode: 'floating', floatingPos: { x: 200, y: 100 } });
  await reloadAndWait(page);
  await clickCanvas(page);
  const r = await page.evaluate(() => {
    const d = document.querySelector('.drawer');
    return { left: d.style.left, top: d.style.top };
  });
  eq(r.left, '200px', 'drawer.style.left from floatingPos');
  eq(r.top, '100px', 'drawer.style.top from floatingPos');
  await page.close();
});

test('panel: mobile bottom sheet height respects mobilePanelHeight', async (browser) => {
  const page = await newPage(browser, IPHONE);
  await setState(page, { mobilePanelHeight: 420 });
  await reloadAndWait(page);
  await clickCanvas(page);
  const h = await page.evaluate(() => document.querySelector('.drawer').offsetHeight);
  near(h, 420, 1, 'drawer height = mobilePanelHeight');
  await page.close();
});

// ---------------------------------------------------------------------------
// D. drag clamps
// ---------------------------------------------------------------------------
test('drag: floating bottom handle resizes floatingHeight (clamped)', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, { panelMode: 'floating', floatingHeight: 600 });
  await reloadAndWait(page);
  await clickCanvas(page);
  // Drag the bottom resize handle down by 100px
  await dragHandle(page, '.drawer-resize-handle', 100);
  const h = await page.evaluate(() => document.querySelector('.drawer').offsetHeight);
  near(h, 700, 2, 'floatingHeight grew by ~100px');
  // Drag down a huge amount — should clamp at 100lvh - 40 = 760
  await dragHandle(page, '.drawer-resize-handle', 9999);
  const h2 = await page.evaluate(() => document.querySelector('.drawer').offsetHeight);
  near(h2, 760, 2, 'floatingHeight clamped to lvh - 40');
  await page.close();
});

test('drag: mobile top handle resizes mobilePanelHeight (clamped to 90vh)', async (browser) => {
  const page = await newPage(browser, IPHONE);
  await setState(page, { mobilePanelHeight: 360 });
  await reloadAndWait(page);
  await clickCanvas(page);
  // Drag UP a lot — pulls bottom-sheet taller
  await dragHandle(page, '.drawer-resize-handle', -9999);
  const h = await page.evaluate(() => document.querySelector('.drawer').offsetHeight);
  near(h, 0.9 * 926, 2, 'mobilePanelHeight clamped to 0.9 * lvh');
  await page.close();
});

test('drag: floating panel header repositions, clamped (header reachable)', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, { panelMode: 'floating', floatingPos: { x: 200, y: 100 } });
  await reloadAndWait(page);
  await clickCanvas(page);
  // Drag header far off-screen left — clamp keeps at least 80px visible
  const headerBox = await page.evaluate(() => {
    const r = document.querySelector('.drawer-header').getBoundingClientRect();
    return { x: r.x + 100, y: r.y + r.height / 2 };
  });
  await page.mouse.move(headerBox.x, headerBox.y);
  await page.mouse.down();
  await page.mouse.move(-9999, headerBox.y, { steps: 5 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 200));
  const left = await page.evaluate(() => parseFloat(document.querySelector('.drawer').style.left));
  // Panel width 380, min visible 80 → left can go as far as -(380-80) = -300
  truthy(left >= -300 - 1, `floatingPos.x clamped >= -300 (was ${left})`);
  await page.close();
});

// ---------------------------------------------------------------------------
// E. settings actions
// ---------------------------------------------------------------------------
test('actions: rotate cycles 0 → 90 → 180 → 270 → 0', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, { rotation: 0 });
  await reloadAndWait(page);
  await clickCanvas(page);
  await page.evaluate(() => document.querySelectorAll('.drawer-tabs button')[3].click());
  await new Promise((r) => setTimeout(r, 100));
  const seq = [0, 90, 180, 270, 0];
  for (let i = 1; i < seq.length; i++) {
    // RotateButton uses aria-label = t('rotate.button') = "旋轉 90°" / "Rotate 90°"
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="旋轉"], button[aria-label*="Rotate"]');
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 150));
    const r = await page.evaluate(() => JSON.parse(localStorage.getItem('hype-sign:v1')).state.rotation);
    eq(r, seq[i], `rotation step ${i}`);
  }
  await page.close();
});

test('actions: language toggle switches dictionary', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, { lang: 'zh-TW' });
  await reloadAndWait(page);
  await clickCanvas(page);
  const titleZh = await page.evaluate(() => document.querySelector('.drawer-title').textContent);
  await setState(page, { lang: 'en' });
  await reloadAndWait(page);
  await clickCanvas(page);
  const titleEn = await page.evaluate(() => document.querySelector('.drawer-title').textContent);
  truthy(titleZh !== titleEn, `lang toggle should change title (zh="${titleZh}" en="${titleEn}")`);
  await page.close();
});

test('actions: text input updates store.text', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await reloadAndWait(page);
  await clickCanvas(page);
  // React controlled inputs ignore programmatic .value + dispatchEvent
  // because their internal value tracker stays out of sync. Use the
  // native setter to bypass it (matches what React Testing Library does).
  await page.evaluate(() => {
    const ta = document.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'NEW');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 200));
  const t = await page.evaluate(() => JSON.parse(localStorage.getItem('hype-sign:v1')).state.text);
  eq(t, 'NEW', 'text persisted to store');
  await page.close();
});

// ---------------------------------------------------------------------------
// F. color stop bar — preview must be horizontal regardless of parent gradient
// ---------------------------------------------------------------------------
test('color: stop bar is linear-gradient(to right) for radial parent', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, {
    bgColor: {
      type: 'radial', cx: 90, cy: 50,
      stops: [
        { id: 'a', color: '#ff0000', position: 0 },
        { id: 'b', color: '#00ff00', position: 100 },
      ],
    },
  });
  await reloadAndWait(page);
  await clickCanvas(page);
  // Switch to backdrop tab (index 2)
  await page.evaluate(() => document.querySelectorAll('.drawer-tabs button')[2].click());
  await new Promise((r) => setTimeout(r, 200));
  const bg = await page.evaluate(() => {
    const bar = document.querySelector('.stop-bar');
    return bar ? getComputedStyle(bar).backgroundImage : null;
  });
  truthy(bg && bg.includes('linear-gradient') && /to\s+right|to right|, ?(255,? ?0,? ?0)/i.test(bg) && !bg.includes('radial-gradient'),
    `stop-bar bg should be linear horizontal, got: ${bg}`);
  await page.close();
});

// ---------------------------------------------------------------------------
// G. preset edit mode
// ---------------------------------------------------------------------------
test('preset: edit toggle shows reorder + delete, hides apply', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, {
    presets: [
      { id: 'a', name: 'Alpha', color: { type: 'solid', color: '#ff0000' } },
      { id: 'b', name: 'Beta', color: { type: 'solid', color: '#00ff00' } },
    ],
  });
  await reloadAndWait(page);
  await clickCanvas(page);
  await page.evaluate(() => document.querySelectorAll('.drawer-tabs button[role="tab"]')[1].click());
  await new Promise((r) => setTimeout(r, 250));
  await page.evaluate(() => {
    const body = document.querySelector('.drawer-body');
    if (body) body.scrollTop = body.scrollHeight;
  });
  await new Promise((r) => setTimeout(r, 200));

  // Normal mode: apply buttons visible, no editing class
  const normalApply = await page.evaluate(() =>
    document.querySelectorAll('.preset-row .btn:not(.danger):not(.icon)').length);
  truthy(normalApply >= 2, 'normal mode has apply buttons');
  eq(await page.evaluate(() => document.querySelectorAll('.preset-row--editing').length), 0,
    'no editing rows before toggle');

  // Click Edit
  await page.evaluate(() => document.querySelector('.preset-section-header button').click());
  await new Promise((r) => setTimeout(r, 200));

  // Edit mode: editing class, move buttons, no apply
  const editRows = await page.evaluate(() => document.querySelectorAll('.preset-row--editing').length);
  truthy(editRows >= 2, 'edit rows present');
  const moveButtons = await page.evaluate(() =>
    document.querySelectorAll('.preset-row--editing .btn.icon:not(.danger)').length);
  truthy(moveButtons >= 4, 'move buttons present (2 rows × 2)');
  const editApply = await page.evaluate(() =>
    document.querySelectorAll('.preset-row--editing .btn:not(.danger):not(.icon)').length);
  eq(editApply, 0, 'no apply buttons in edit mode');

  // Click Done — returns to normal
  await page.evaluate(() => document.querySelector('.preset-section-header button').click());
  await new Promise((r) => setTimeout(r, 200));
  eq(await page.evaluate(() => document.querySelectorAll('.preset-row--editing').length), 0,
    'editing rows gone after Done');
  truthy(await page.evaluate(() =>
    document.querySelectorAll('.preset-row .btn:not(.danger):not(.icon)').length) >= 2,
    'apply buttons restored');
  await page.close();
});

test('preset: reorder moves item and persists', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, {
    presets: [
      { id: 'a', name: 'Alpha', color: { type: 'solid', color: '#ff0000' } },
      { id: 'b', name: 'Beta', color: { type: 'solid', color: '#00ff00' } },
    ],
  });
  await reloadAndWait(page);
  await clickCanvas(page);
  await page.evaluate(() => document.querySelectorAll('.drawer-tabs button[role="tab"]')[1].click());
  await new Promise((r) => setTimeout(r, 250));
  await page.evaluate(() => {
    const body = document.querySelector('.drawer-body');
    if (body) body.scrollTop = body.scrollHeight;
  });
  await new Promise((r) => setTimeout(r, 200));

  // Enter edit mode
  await page.evaluate(() => document.querySelector('.preset-section-header button').click());
  await new Promise((r) => setTimeout(r, 200));

  // Click ▼ on first row (second .btn.icon:not(.danger) in first editing row)
  await page.evaluate(() => {
    const row = document.querySelector('.preset-row--editing');
    const down = row.querySelectorAll('.btn.icon:not(.danger)')[1];
    if (down) down.click();
  });
  await new Promise((r) => setTimeout(r, 200));

  // Verify DOM order
  const names = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.preset-name-text')).map((el) => el.textContent));
  eq(names[0], 'Beta', 'Beta moved to first after reorder');
  eq(names[1], 'Alpha', 'Alpha moved to second');

  // Verify persisted
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('hype-sign:v1')).state.presets);
  eq(stored[0].name, 'Beta', 'reorder persisted');
  await page.close();
});

test('preset: delete in edit mode removes item', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, {
    presets: [
      { id: 'a', name: 'Alpha', color: { type: 'solid', color: '#ff0000' } },
      { id: 'b', name: 'Beta', color: { type: 'solid', color: '#00ff00' } },
    ],
  });
  await reloadAndWait(page);
  await clickCanvas(page);
  await page.evaluate(() => document.querySelectorAll('.drawer-tabs button[role="tab"]')[1].click());
  await new Promise((r) => setTimeout(r, 250));
  await page.evaluate(() => {
    const body = document.querySelector('.drawer-body');
    if (body) body.scrollTop = body.scrollHeight;
  });
  await new Promise((r) => setTimeout(r, 200));

  // Enter edit mode
  await page.evaluate(() => document.querySelector('.preset-section-header button').click());
  await new Promise((r) => setTimeout(r, 200));

  // Double-click delete on first row (ConfirmButton: arm then confirm)
  await page.evaluate(() => {
    const rows = document.querySelectorAll('.preset-row--editing');
    rows[0].querySelector('.btn.danger').click();
  });
  await new Promise((r) => setTimeout(r, 200));
  await page.evaluate(() => {
    const rows = document.querySelectorAll('.preset-row--editing');
    rows[0].querySelector('.btn.danger.armed').click();
  });
  await new Promise((r) => setTimeout(r, 300));

  // Only count rows in edit mode (both Tint and Backdrop tabs render
  // ColorPresetList — the hidden backdrop tab's rows are not --editing).
  eq(await page.evaluate(() => document.querySelectorAll('.preset-row--editing').length), 1,
    'one editing row remaining');
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('hype-sign:v1')).state.presets);
  eq(stored.length, 1, 'delete persisted');
  eq(stored[0].name, 'Beta', 'remaining preset is Beta');
  await page.close();
});

test('preset: edit mode auto-exits when last preset deleted', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, {
    presets: [
      { id: 'a', name: 'Only', color: { type: 'solid', color: '#ff0000' } },
    ],
  });
  await reloadAndWait(page);
  await clickCanvas(page);
  await page.evaluate(() => document.querySelectorAll('.drawer-tabs button[role="tab"]')[1].click());
  await new Promise((r) => setTimeout(r, 250));
  await page.evaluate(() => {
    const body = document.querySelector('.drawer-body');
    if (body) body.scrollTop = body.scrollHeight;
  });
  await new Promise((r) => setTimeout(r, 200));

  // Enter edit mode
  await page.evaluate(() => document.querySelector('.preset-section-header button').click());
  await new Promise((r) => setTimeout(r, 200));

  // Delete the only preset
  const del = '.preset-row--editing .btn.danger.icon';
  await page.evaluate((s) => document.querySelector(s).click(), del);
  await new Promise((r) => setTimeout(r, 100));
  await page.evaluate((s) => document.querySelector(s).click(), del);
  await new Promise((r) => setTimeout(r, 200));

  // Edit button should be gone, empty message shown
  const editBtn = await page.evaluate(() => document.querySelector('.preset-section-header button'));
  eq(editBtn, null, 'edit button hidden when no presets');
  await page.close();
});

// ---------------------------------------------------------------------------
// H. persistence + migrations
// ---------------------------------------------------------------------------
test('persist: settings survive reload', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, { text: 'PERSIST', margin: 12, fontWeight: 700 });
  await reloadAndWait(page);
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('hype-sign:v1')).state);
  eq(s.text, 'PERSIST', 'text persisted');
  eq(s.margin, 12, 'margin persisted');
  eq(s.fontWeight, 700, 'fontWeight persisted');
  await page.close();
});

test('persist: panelVisible does NOT persist (session-only)', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await reloadAndWait(page);
  await clickCanvas(page); // opens panel
  await reloadAndWait(page);
  const cls = await page.evaluate(() => document.querySelector('.drawer').className);
  truthy(!cls.includes('open'), 'panel should be closed after reload (panelVisible session-only)');
  await page.close();
});

test('persist: v2 storage migrates with panel-state defaults', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await page.evaluate(() => {
    localStorage.setItem('hype-sign:v1', JSON.stringify({
      state: { text: 'V2', presets: [], textPresets: [] },
      version: 2,
    }));
  });
  await reloadAndWait(page);
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('hype-sign:v1')));
  eq(s.version, 3, 'persist version bumped to 3');
  eq(s.state.text, 'V2', 'text preserved');
  eq(s.state.panelMode, 'split', 'panelMode default seeded');
  truthy(s.state.floatingPos && typeof s.state.floatingPos.x === 'number', 'floatingPos default seeded');
  truthy(typeof s.state.mobilePanelHeight === 'number', 'mobilePanelHeight default seeded');
  truthy(typeof s.state.floatingHeight === 'number', 'floatingHeight default seeded');
  await page.close();
});

// ---------------------------------------------------------------------------
// H. i18n key completeness — every ZH key must have an EN counterpart
// ---------------------------------------------------------------------------
test('i18n: ZH and EN dicts cover the same keys', async (browser) => {
  const i18nText = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'lib', 'i18n.ts'),
    'utf8',
  );
  const extract = (re) => {
    const m = i18nText.match(re);
    if (!m) return null;
    return new Set(Array.from(m[1].matchAll(/'([^']+)':/g)).map((x) => x[1]));
  };
  const zh = extract(/const ZH:[^=]*=\s*\{([\s\S]*?)\n\};/);
  const en = extract(/const EN:[^=]*=\s*\{([\s\S]*?)\n\};/);
  truthy(zh && en, 'both dicts found');
  for (const k of zh) truthy(en.has(k), `EN missing key: ${k}`);
  for (const k of en) truthy(zh.has(k), `ZH missing key: ${k}`);
});

// ---------------------------------------------------------------------------
// I. console / page errors during a typical interaction flow
// ---------------------------------------------------------------------------
test('errors: no console / page errors on full interaction loop', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await reloadAndWait(page);
  await clickCanvas(page);                                // open panel
  await page.evaluate(() => document.querySelectorAll('.drawer-tabs button')[1].click());  // tint
  await page.evaluate(() => document.querySelectorAll('.drawer-tabs button')[2].click());  // backdrop
  await page.evaluate(() => document.querySelectorAll('.drawer-tabs button')[3].click());  // settings
  await page.click('.drawer-mode-toggle');
  await new Promise((r) => setTimeout(r, 200));
  await clickCanvas(page);                                // hide floating
  await clickCanvas(page);                                // re-show
  await new Promise((r) => setTimeout(r, 300));
  truthy(page._errs.length === 0, `errors during flow: ${page._errs.join(' | ')}`);
  await page.close();
});

// ---------------------------------------------------------------------------
// J. visual screenshots — saved for human review (no assertions)
// ---------------------------------------------------------------------------
test('snap: desktop split open with linear bg', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, {
    bgColor: {
      type: 'linear', angle: 135,
      stops: [
        { id: 'a', color: '#4a90e2', position: 0 },
        { id: 'b', color: '#222266', position: 100 },
      ],
    },
  });
  await reloadAndWait(page);
  await clickCanvas(page);
  await shot(page, 'snap-desktop-split');
  await page.close();
});

test('snap: desktop floating', async (browser) => {
  const page = await newPage(browser, DESKTOP);
  await setState(page, { panelMode: 'floating' });
  await reloadAndWait(page);
  await clickCanvas(page);
  await shot(page, 'snap-desktop-floating');
  await page.close();
});

test('snap: mobile bottom sheet', async (browser) => {
  const page = await newPage(browser, IPHONE, { simulateNotch: true });
  await reloadAndWait(page, { simulateNotch: true });
  await clickCanvas(page);
  await shot(page, 'snap-mobile-bottom-sheet');
  await page.close();
});

// ---------------------------------------------------------------------------
// runner
// ---------------------------------------------------------------------------
async function ensureDevServer() {
  // probe
  try {
    await fetch(BASE_URL).then((r) => {
      if (r.status !== 200) throw new Error('not 200');
    });
    return null; // already running
  } catch {
    // spawn
    const proc = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('dev server timeout')), 15000);
      proc.stdout.on('data', (d) => {
        if (d.toString().includes('ready')) {
          clearTimeout(t);
          resolve();
        }
      });
    });
    // settle
    await new Promise((r) => setTimeout(r, 500));
    return proc;
  }
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const proc = await ensureDevServer();
  const filtered = ONLY ? tests.filter((t) => t.name.includes(ONLY)) : tests;
  console.log(`Running ${filtered.length} test${filtered.length === 1 ? '' : 's'}${ONLY ? ` (filter: "${ONLY}")` : ''}\n`);
  const browser = await puppeteer.launch({ headless: 'new' });
  let pass = 0;
  const fails = [];
  for (const t of filtered) {
    try {
      await t.fn(browser);
      console.log(`  ✓ ${t.name}`);
      pass++;
    } catch (e) {
      console.log(`  ✗ ${t.name}`);
      console.log(`      ${e.message}`);
      fails.push(t.name);
    }
  }
  await browser.close();
  if (proc) proc.kill();
  console.log(`\n${pass} passed, ${fails.length} failed${fails.length ? '\nfailed: ' + fails.join(', ') : ''}`);
  console.log(`screenshots: ${SCREENSHOT_DIR}`);
  process.exit(fails.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
