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
const STORE_VERSION = 2;

// Tab indices in .drawer-tabs (0-based, in render order).
const TAB = { text: 0, tint: 1, backdrop: 2, settings: 3 };

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice('--only='.length).split(',') : null;
const want = (id) => !ONLY || ONLY.includes(id);

const HERO_STATE = {
  text: 'ENCORE!! 再來一首',
  mode: 'marquee',
  marqueeSpeed: 380,
  rotation: 0,
  lang: 'zh-TW',
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
  presets: [],
  textPresets: [],
};

const PRESETS_DEMO = [
  { id: 'p1', name: 'Sunset',     color: { type: 'radial', cx: 50, cy: 50, stops: [
    { id: 's1', color: '#fb923c', position: 0 },
    { id: 's2', color: '#ec4899', position: 60 },
    { id: 's3', color: '#7c3aed', position: 100 },
  ]}},
  { id: 'p2', name: 'Ocean',      color: { type: 'linear', angle: 200, stops: [
    { id: 's1', color: '#22d3ee', position: 0 },
    { id: 's2', color: '#1d4ed8', position: 100 },
  ]}},
  { id: 'p3', name: 'Neon Pink',  color: { type: 'solid', color: '#ff2bd6' }},
  { id: 'p4', name: 'Vaporwave',  color: { type: 'linear', angle: 135, stops: [
    { id: 's1', color: '#ff79c6', position: 0 },
    { id: 's2', color: '#8be9fd', position: 100 },
  ]}},
  { id: 'p5', name: 'Ember',      color: { type: 'radial', cx: 50, cy: 60, stops: [
    { id: 's1', color: '#fde047', position: 0 },
    { id: 's2', color: '#dc2626', position: 50 },
    { id: 's3', color: '#0a0a0a', position: 100 },
  ]}},
  { id: 'p6', name: 'Lime',       color: { type: 'solid', color: '#84cc16' }},
];

const SCENES = [
  {
    id: 'static-hero',
    viewport: { width: 1280, height: 800 },
    state: {
      text: 'HYPE\nSIGN',
      mode: 'static',
      marqueeSpeed: 400, rotation: 0, lang: 'zh-TW', margin: 8, fontWeight: 900,
      textColor: { type: 'linear', angle: 135, stops: [
        { id: 's1', color: '#fbbf24', position: 0 },
        { id: 's2', color: '#f43f5e', position: 50 },
        { id: 's3', color: '#8b5cf6', position: 100 },
      ]},
      bgColor: { type: 'solid', color: '#0f172a' },
      presets: [], textPresets: [],
    },
  },
  {
    id: 'cheer-board',
    viewport: { width: 1280, height: 800 },
    state: {
      text: '加油！',
      mode: 'static',
      marqueeSpeed: 400, rotation: 0, lang: 'zh-TW', margin: 6, fontWeight: 900,
      textColor: { type: 'solid', color: '#0a0a0a' },
      bgColor: { type: 'solid', color: '#fde047' },
      presets: [], textPresets: [],
    },
  },
  {
    id: 'drawer-gradient',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.tint,
    state: { ...HERO_STATE, mode: 'static', text: 'HYPE' },
  },
  {
    id: 'drawer-presets',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.tint,
    state: {
      text: 'HYPE',
      mode: 'static', marqueeSpeed: 400, rotation: 0, lang: 'zh-TW', margin: 6, fontWeight: 900,
      textColor: { type: 'linear', angle: 135, stops: [
        { id: 's1', color: '#fbbf24', position: 0 },
        { id: 's2', color: '#f43f5e', position: 100 },
      ]},
      bgColor: { type: 'solid', color: '#0f172a' },
      presets: PRESETS_DEMO, textPresets: [],
    },
  },
  {
    id: 'mobile-portrait',
    viewport: { width: 390, height: 844, deviceScaleFactor: 2 },
    state: {
      text: 'GO\nTEAM',
      mode: 'static', marqueeSpeed: 400, rotation: 0, lang: 'en', margin: 6, fontWeight: 800,
      textColor: { type: 'solid', color: '#ffffff' },
      bgColor: { type: 'linear', angle: 180, stops: [
        { id: 's1', color: '#dc2626', position: 0 },
        { id: 's2', color: '#7c2d12', position: 100 },
      ]},
      presets: [], textPresets: [],
    },
  },
  {
    id: 'drawer-zh',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.settings,
    state: {
      text: 'HYPE\nSIGN',
      mode: 'static', marqueeSpeed: 400, rotation: 0, lang: 'zh-TW', margin: 6, fontWeight: 900,
      textColor: { type: 'linear', angle: 135, stops: [
        { id: 's1', color: '#fbbf24', position: 0 },
        { id: 's2', color: '#f43f5e', position: 50 },
        { id: 's3', color: '#8b5cf6', position: 100 },
      ]},
      bgColor: { type: 'solid', color: '#0f172a' },
      presets: [], textPresets: [],
    },
  },
  {
    id: 'drawer-en',
    viewport: { width: 1280, height: 800 },
    drawer: true, tab: TAB.settings,
    state: {
      text: 'HYPE\nSIGN',
      mode: 'static', marqueeSpeed: 400, rotation: 0, lang: 'en', margin: 6, fontWeight: 900,
      textColor: { type: 'linear', angle: 135, stops: [
        { id: 's1', color: '#fbbf24', position: 0 },
        { id: 's2', color: '#f43f5e', position: 50 },
        { id: 's3', color: '#8b5cf6', position: 100 },
      ]},
      bgColor: { type: 'solid', color: '#0f172a' },
      presets: [], textPresets: [],
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
  // Vite logs "Local:" then is ready, but the SW + assets need a moment.
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
      // Open drawer by triggering the settings toggle programmatically (the
      // button itself isn't hidden yet at this point). Then hide it.
      await page.evaluate(() => {
        const btn = document.querySelector('button.settings-toggle');
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 450));
      if (typeof scene.tab === 'number') {
        await page.evaluate((idx) => {
          const tabs = document.querySelectorAll('.drawer-tabs button[role="tab"]');
          if (tabs[idx]) tabs[idx].click();
        }, scene.tab);
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    await page.addStyleTag({
      content: scene.drawer
        ? '.settings-toggle { display: none !important; }'
        : '.settings-toggle, .drawer, .drawer-backdrop { display: none !important; }',
    });
    await new Promise((r) => setTimeout(r, 200));
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
      content:
        '.settings-toggle, .drawer, .drawer-backdrop { display: none !important; }',
    });
    await new Promise((r) => setTimeout(r, 600));

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

    const DURATION_MS = 3000;
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 2 });
    await new Promise((r) => setTimeout(r, DURATION_MS));
    await cdp.send('Page.stopScreencast');
    await new Promise((r) => setTimeout(r, 300));

    const captured = frameIdx;
    if (captured === 0) throw new Error('no screencast frames captured');
    const captureFps = Math.max(1, Math.round((captured * 1000) / DURATION_MS));
    // Encode-time downsampling to keep GIF size sane: 60fps native screencast
    // → 20fps GIF, 1024w → 800w. README needs smooth-enough motion, not
    // pixel-perfect playback; under 2 MB is the goal.
    const outFps = 15;
    const outWidth = 720;
    console.log(
      `  captured ${captured} frames in ${DURATION_MS}ms (${captureFps}fps) → encoding at ${outFps}fps, ${outWidth}w`,
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

    const out = path.join(OUT_DIR, 'hero.gif');
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-framerate', String(captureFps),
        '-i', path.join(FRAMES_DIR, 'frame_%04d.png'),
        '-i', palette,
        '-lavfi', `${vf} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5`,
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
    // Give vite a moment to release the port before exiting.
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
