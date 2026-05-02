#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const puppeteer = require('puppeteer');

const REPO = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO, 'docs/screenshots');
const FRAMES_DIR = '/tmp/hype-frames';
const URL = 'http://localhost:5173/hype-sign/';
const STORE_KEY = 'hype-sign:v1';
const STORE_VERSION = 4;

// Tab indices in .drawer-tabs (0-based, in render order from SettingsPanel TABS).
const TAB = { text: 0, font: 1, tint: 2, backdrop: 3, settings: 4 };

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice('--only='.length).split(',') : null;
const want = (id) => !ONLY || ONLY.includes(id);

// Default fields seeded into every scene's state. Individual scenes spread
// over this and override what they care about.
const DEFAULTS = {
  text: 'HYPE',
  mode: 'static',
  marqueeSpeed: 380,
  rotation: 0,
  lang: 'zh-TW',
  margin: 6,
  fontWeight: 800,
  font: 'noto-tc',
  textColor: { type: 'solid', color: '#ffffff' },
  bgColor: { type: 'solid', color: '#0f172a' },
  presets: [],
  textPresets: [],
  panelMode: 'split',
  floatingPos: { x: 720, y: 100 },
  mobilePanelHeight: 500,
  floatingHeight: 540,
};

const HERO_STATE = {
  ...DEFAULTS,
  text: 'ENCORE!! 再來一首',
  mode: 'marquee',
  // 600 px/s is a comfortable read-along speed for the gif (1000 felt
  // rushed). The marquee scaledWidth at viewport=1024×512 is ~5000 px,
  // so loop time = (1024 + 5000) / 600 ≈ 10 s; DURATION_MS covers it
  // with ~1 s of tail buffer.
  marqueeSpeed: 600,
  margin: 4,
  fontWeight: 900,
  textColor: {
    type: 'linear', angle: 90,
    stops: [
      { id: 'a', color: '#ff3ea5', position: 0 },
      { id: 'b', color: '#a855f7', position: 50 },
      { id: 'c', color: '#22d3ee', position: 100 },
    ],
  },
  bgColor: { type: 'solid', color: '#000000' },
};

const PRESETS_DEMO = [
  { id: 'p1', name: 'Sunset', color: { type: 'radial', cx: 50, cy: 50, stops: [
    { id: 's1', color: '#fb923c', position: 0 },
    { id: 's2', color: '#ec4899', position: 60 },
    { id: 's3', color: '#7c3aed', position: 100 },
  ]}},
  { id: 'p2', name: 'Ocean', color: { type: 'linear', angle: 200, stops: [
    { id: 's1', color: '#22d3ee', position: 0 },
    { id: 's2', color: '#1d4ed8', position: 100 },
  ]}},
  { id: 'p3', name: 'Neon Pink', color: { type: 'solid', color: '#ff2bd6' }},
  { id: 'p4', name: 'Vaporwave', color: { type: 'linear', angle: 135, stops: [
    { id: 's1', color: '#ff79c6', position: 0 },
    { id: 's2', color: '#8be9fd', position: 100 },
  ]}},
  { id: 'p5', name: 'Ember', color: { type: 'radial', cx: 50, cy: 60, stops: [
    { id: 's1', color: '#fde047', position: 0 },
    { id: 's2', color: '#dc2626', position: 50 },
    { id: 's3', color: '#0a0a0a', position: 100 },
  ]}},
  { id: 'p6', name: 'Lime', color: { type: 'solid', color: '#84cc16' }},
];

// Each scene uses a unique text + background colour combination, and
// most non-`panel-text` scenes pick a non-default font so the README
// gallery shows off the curated typeface variety.

const SCENES = [
  // 1. Split + Text tab — text input, mode toggle, text-preset list.
  //    Default Noto Sans TC.
  //    text: linear warm gold→rose→violet  |  bg: radial dark navy→black
  {
    id: 'panel-text',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.text,
    state: {
      ...DEFAULTS,
      text: 'HYPE\nSIGN',
      fontWeight: 900,
      font: 'noto-tc',
      margin: 6,
      textColor: {
        type: 'linear', angle: 135,
        stops: [
          { id: 's1', color: '#fbbf24', position: 0 },
          { id: 's2', color: '#f43f5e', position: 50 },
          { id: 's3', color: '#8b5cf6', position: 100 },
        ],
      },
      bgColor: {
        type: 'radial', cx: 50, cy: 45,
        stops: [
          { id: 's1', color: '#1e293b', position: 0 },
          { id: 's2', color: '#020617', position: 100 },
        ],
      },
      panelMode: 'split',
    },
  },
  // 2. Split + Font tab — picker rows showing each typeface's character.
  //    Selected: LXGW WenKai TC so the canvas reflects the calligraphic
  //    pick. Bundled-vs-system divider visible mid-list.
  //    text: solid white  |  bg: linear deep-teal→indigo
  {
    id: 'panel-font',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.font,
    state: {
      ...DEFAULTS,
      text: '應援 加油',
      font: 'lxgw-wenkai-tc',
      fontWeight: 500,
      margin: 8,
      textColor: { type: 'solid', color: '#fef3c7' },
      bgColor: {
        type: 'linear', angle: 160,
        stops: [
          { id: 's1', color: '#134e4a', position: 0 },
          { id: 's2', color: '#1e1b4b', position: 100 },
        ],
      },
      panelMode: 'split',
    },
  },
  // 3. Split + Tint tab — gradient editor (stops bar + sliders).
  //    Noto Serif TC for typographic contrast against panel-text's sans.
  //    text: radial neon pink→magenta→deep-purple  |  bg: solid dark emerald
  {
    id: 'panel-tint',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.tint,
    state: {
      ...DEFAULTS,
      text: '慶生',
      font: 'noto-serif-tc',
      fontWeight: 900,
      textColor: {
        type: 'radial', cx: 50, cy: 50,
        stops: [
          { id: 's1', color: '#ff3ea5', position: 0 },
          { id: 's2', color: '#d946ef', position: 50 },
          { id: 's3', color: '#6d28d9', position: 100 },
        ],
      },
      bgColor: { type: 'solid', color: '#0d1f17' },
      panelMode: 'split',
    },
  },
  // 4. Floating + Backdrop tab — draggable window with shadow.
  //    Atkinson Hyperlegible for a Latin slogan (showcases the
  //    unambiguous-character font).
  //    text: solid white  |  bg: linear sky→navy
  {
    id: 'panel-floating',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.backdrop,
    state: {
      ...DEFAULTS,
      text: 'GO!',
      font: 'atkinson',
      fontWeight: 800,
      margin: 8,
      textColor: { type: 'solid', color: '#ffffff' },
      bgColor: {
        type: 'linear', angle: 200,
        stops: [
          { id: 's1', color: '#0ea5e9', position: 0 },
          { id: 's2', color: '#1e3a8a', position: 100 },
        ],
      },
      panelMode: 'floating',
      floatingPos: { x: 720, y: 110 },
      floatingHeight: 540,
    },
  },
  // 5. Split + Tint tab + 6 saved presets — preset library.
  //    text: solid orange  |  bg: linear dark-plum→dark-navy
  {
    id: 'panel-presets',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.tint, scrollPanel: 'bottom',
    state: {
      ...DEFAULTS,
      text: 'HYPE',
      font: 'noto-tc',
      fontWeight: 900,
      textColor: { type: 'solid', color: '#fb923c' },
      bgColor: {
        type: 'linear', angle: 160,
        stops: [
          { id: 's1', color: '#2e1065', position: 0 },
          { id: 's2', color: '#0c1631', position: 100 },
        ],
      },
      presets: PRESETS_DEMO,
      panelMode: 'split',
    },
  },
  // 6. Split + Settings tab + rotated 90°.
  //    Noto Serif TC; the stacked Chinese title showcases the serif
  //    detail at the rotation.
  //    text: linear cyan→electric-blue  |  bg: solid dark charcoal
  {
    id: 'panel-rotated',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.settings,
    state: {
      ...DEFAULTS,
      text: '加油\n衝啊',
      mode: 'static',
      rotation: 90,
      font: 'noto-serif-tc',
      fontWeight: 700,
      margin: 6,
      textColor: {
        type: 'linear', angle: 90,
        stops: [
          { id: 's1', color: '#22d3ee', position: 0 },
          { id: 's2', color: '#3b82f6', position: 100 },
        ],
      },
      bgColor: { type: 'solid', color: '#12121a' },
      panelMode: 'split',
    },
  },
  // 7. Mobile bottom sheet (tall) — Text tab, resize handle visible.
  //    text: solid white  |  bg: radial red→dark-crimson
  {
    id: 'mobile-text',
    viewport: { width: 390, height: 844, deviceScaleFactor: 2 },
    drawer: true, tab: TAB.text,
    state: {
      ...DEFAULTS,
      text: 'GO\nTEAM',
      mode: 'static',
      lang: 'en',
      font: 'noto-tc',
      fontWeight: 800,
      margin: 6,
      textColor: { type: 'solid', color: '#ffffff' },
      bgColor: {
        type: 'radial', cx: 50, cy: 40,
        stops: [
          { id: 's1', color: '#dc2626', position: 0 },
          { id: 's2', color: '#450a0a', position: 100 },
        ],
      },
      panelMode: 'split',
      mobilePanelHeight: 340,
    },
  },
  // 8. Mobile bottom sheet (tall) — Font tab, picker rows visible.
  //    text: solid amber  |  bg: linear dark-teal→deep-purple
  {
    id: 'mobile-font',
    viewport: { width: 390, height: 844, deviceScaleFactor: 2 },
    drawer: true, tab: TAB.font,
    state: {
      ...DEFAULTS,
      text: '霞鶩文楷',
      font: 'lxgw-wenkai-tc',
      fontWeight: 500,
      margin: 6,
      textColor: { type: 'solid', color: '#fde68a' },
      bgColor: {
        type: 'linear', angle: 135,
        stops: [
          { id: 's1', color: '#0f3d3e', position: 0 },
          { id: 's2', color: '#3b0764', position: 100 },
        ],
      },
      panelMode: 'split',
      mobilePanelHeight: 560,
    },
  },
  // 9a. Settings tab in zh-TW. LXGW WenKai TC for a calligraphic
  //     Chinese-language demo.
  //    text: radial rose→coral  |  bg: solid midnight
  {
    id: 'drawer-zh',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.settings,
    state: {
      ...DEFAULTS,
      text: '加油\n衝啊',
      lang: 'zh-TW',
      font: 'lxgw-wenkai-tc',
      fontWeight: 500,
      margin: 6,
      textColor: {
        type: 'radial', cx: 50, cy: 50,
        stops: [
          { id: 's1', color: '#fda4af', position: 0 },
          { id: 's2', color: '#e11d48', position: 100 },
        ],
      },
      bgColor: { type: 'solid', color: '#0c0a14' },
      panelMode: 'split',
    },
  },
  // 9b. Settings tab in English.
  //    text: solid amber  |  bg: radial dark-indigo→near-black
  {
    id: 'drawer-en',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.settings,
    state: {
      ...DEFAULTS,
      text: 'HYPE\nSIGN',
      lang: 'en',
      font: 'atkinson',
      fontWeight: 800,
      margin: 6,
      textColor: { type: 'solid', color: '#fbbf24' },
      bgColor: {
        type: 'radial', cx: 50, cy: 45,
        stops: [
          { id: 's1', color: '#312e81', position: 0 },
          { id: 's2', color: '#070712', position: 100 },
        ],
      },
      panelMode: 'split',
    },
  },
];

async function spawnDevServer() {
  const child = spawn('npx', ['vite', '--port', '5173', '--strictPort'], {
    cwd: REPO,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error('vite did not become ready in 30s')), 30000);
    const onData = (d) => {
      buf += d.toString();
      if (buf.includes('Local:') || buf.includes('localhost:5173')) {
        clearTimeout(t);
        child.stdout.off('data', onData);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', (d) => process.stderr.write('[vite] ' + d));
    child.on('exit', (code) => {
      clearTimeout(t);
      reject(new Error(`vite exited early with code ${code}`));
    });
  });
  await new Promise((r) => setTimeout(r, 800));
  return child;
}

async function seedAndGoto(page, state) {
  await page.evaluateOnNewDocument(
    ({ key, version, state }) => {
      localStorage.setItem(key, JSON.stringify({ state, version }));
    },
    { key: STORE_KEY, version: STORE_VERSION, state },
  );
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.display-root', { timeout: 10000 });
  // Allow zustand rehydrate + StaticDisplay's useLayoutEffect getBBox pass to settle.
  await new Promise((r) => setTimeout(r, 600));
}

async function captureScene(browser, scene) {
  const page = await browser.newPage();
  try {
    await page.setViewport(scene.viewport);
    await seedAndGoto(page, scene.state);
    if (scene.drawer) {
      // The new UX: clicking anywhere on .display-root toggles the panel.
      // No more gear button. The click bubbles up to the React onClick
      // handler that calls togglePanel().
      await page.click('.display-root');
      // Wait for slide-in transition (280ms) plus a small buffer.
      await new Promise((r) => setTimeout(r, 450));
      if (typeof scene.tab === 'number') {
        await page.evaluate((idx) => {
          const tabs = document.querySelectorAll('.drawer-tabs button[role="tab"]');
          if (tabs[idx]) tabs[idx].click();
        }, scene.tab);
        await new Promise((r) => setTimeout(r, 250));
      }
      if (scene.scrollPanel) {
        await page.evaluate((target) => {
          const body = document.querySelector('.drawer-body');
          if (!body) return;
          body.scrollTop = target === 'bottom' ? body.scrollHeight : target;
        }, scene.scrollPanel);
        await new Promise((r) => setTimeout(r, 200));
      }
      if (scene.editMode) {
        await page.evaluate(() => {
          const btn = document.querySelector('.preset-section-header button');
          if (btn) btn.click();
        });
        await new Promise((r) => setTimeout(r, 250));
      }
    } else {
      // Non-drawer scenes: hide the drawer entirely so its closed-state
      // shadow / border doesn't bleed into the canvas.
      await page.addStyleTag({
        content: '.drawer { display: none !important; }',
      });
      await new Promise((r) => setTimeout(r, 100));
    }
    const out = path.join(OUT_DIR, scene.id + '.png');
    await page.screenshot({ path: out, type: 'png' });
    const sz = fs.statSync(out).size;
    console.log(`  ✓ ${scene.id}.png  (${(sz / 1024).toFixed(0)} KB)`);
  } finally {
    await page.close();
  }
}

async function captureHero(browser) {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1024, height: 512 });
    await seedAndGoto(page, HERO_STATE);
    await page.addStyleTag({
      content: '.drawer { display: none !important; }',
    });
    await new Promise((r) => setTimeout(r, 600));

    // Measure live marquee geometry so we can compute one full loop period
    // exactly. The animation resets x from -scaledWidth back to sizeW each
    // cycle, so loop = (sizeW + scaledWidth) / speed. Capturing for
    // EXACTLY this duration is what makes the gif's first and last frame
    // land on identical x positions — i.e. seamless loop with no visible
    // jump at the wrap-around point.
    const dims = await page.evaluate(() => {
      const root = document.querySelector('.display-root');
      const svg = document.querySelector('.display-root svg');
      return {
        sizeW: root ? Math.round(root.offsetWidth) : 0,
        scaledWidth: svg ? parseInt(svg.getAttribute('width') || '0', 10) : 0,
      };
    });
    if (!dims.sizeW || !dims.scaledWidth) {
      throw new Error(`could not measure marquee geometry: ${JSON.stringify(dims)}`);
    }
    const speed = HERO_STATE.marqueeSpeed;
    const loopMs = ((dims.sizeW + dims.scaledWidth) / speed) * 1000;

    const cdp = await page.target().createCDPSession();
    let frameIdx = 0;
    cdp.on('Page.screencastFrame', async (event) => {
      const fname = path.join(
        FRAMES_DIR,
        `frame_${String(frameIdx++).padStart(4, '0')}.png`,
      );
      fs.writeFileSync(fname, Buffer.from(event.data, 'base64'));
      try {
        await cdp.send('Page.screencastFrameAck', {
          sessionId: event.sessionId,
        });
      } catch {/* ignore — happens when stream is being torn down */}
    });

    // Capture noticeably longer than one loop so we have margin to land on
    // exactly loopMs of frames in ffmpeg via -t. setTimeout jitter is up
    // to ~50ms in practice; +500ms is plenty.
    const captureBufferMs = 500;
    const DURATION_MS = Math.ceil(loopMs) + captureBufferMs;
    // everyNthFrame: 1 captures every native rAF tick (~60 fps). Encoding
    // at 20 fps (an integer divisor of 60) lets ffmpeg pick frames at a
    // perfectly even stride.
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
    await new Promise((r) => setTimeout(r, DURATION_MS));
    await cdp.send('Page.stopScreencast');
    await new Promise((r) => setTimeout(r, 300));

    const captured = frameIdx;
    if (captured === 0) throw new Error('no screencast frames captured');
    const captureFps = Math.max(1, Math.round((captured * 1000) / DURATION_MS));
    const outFps = 20;
    const outWidth = 720;
    console.log(
      `  captured ${captured} frames over ${DURATION_MS}ms (~${captureFps}fps); marquee loop = ${loopMs.toFixed(0)}ms, encoding at ${outFps}fps, ${outWidth}w`,
    );

    const palette = path.join(FRAMES_DIR, 'palette.png');
    const vf = `fps=${outFps},scale=${outWidth}:-1:flags=lanczos`;
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-framerate', String(captureFps),
        '-i', path.join(FRAMES_DIR, 'frame_%04d.png'),
        '-vf', `${vf},palettegen=stats_mode=diff`,
        palette,
      ],
      { stdio: 'pipe' },
    );

    // Trim output to exactly one marquee loop with -t so the first and
    // last gif frames are at the same x position (seamless loop).
    const out = path.join(OUT_DIR, 'hero.gif');
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-framerate', String(captureFps),
        '-i', path.join(FRAMES_DIR, 'frame_%04d.png'),
        '-i', palette,
        '-lavfi', `${vf} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5`,
        '-t', (loopMs / 1000).toFixed(4),
        '-loop', '0',
        out,
      ],
      { stdio: 'pipe' },
    );

    const sz = fs.statSync(out).size;
    console.log(`  ✓ hero.gif  (${(sz / 1024).toFixed(0)} KB)`);
  } finally {
    await page.close();
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('▶ starting vite');
  const dev = await spawnDevServer();
  console.log('  vite ready');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  console.log('  browser ready');

  try {
    for (const scene of SCENES) {
      if (!want(scene.id)) continue;
      console.log(`▶ ${scene.id}`);
      await captureScene(browser, scene);
    }
    if (want('hero')) {
      console.log('▶ hero');
      await captureHero(browser);
    }
  } finally {
    await browser.close();
    dev.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
