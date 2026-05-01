# Hype Sign

電子應援手板 / LED 顯示板 PWA — fully offline, multi-color gradients, marquee mode.

> 在演唱會、體育場、戶外活動等任何訊號不穩的場合，把手機 / iPad / PC 變成一塊高亮顯示板。

## Features

- **Static mode** — multi-line text auto-fits to fill the entire screen
- **Marquee mode** — joins all lines into one and scrolls horizontally at 100–2000 px/s
- **Color** — solid, linear gradient, or radial gradient for both text and background, with dynamic color stops
- **Presets** — save and recall favorite color combos
- **Rotate 90°** in-app, no need to rotate your device
- **Fullscreen** + **Wake Lock** — screen stays on while you cheer
- **Bilingual** — 繁體中文 / English
- **Touch + mouse + pen** via Pointer Events
- **Fully offline** — installs as a PWA, works without network after first load

## Quick start

```bash
npm install
npm run dev       # dev server on http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

Requires Node 20 or newer.

## Deploy

This repository auto-deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

After cloning to a fresh GitHub repo:

1. Settings → Pages → **Source: GitHub Actions**
2. Push to `main` — the workflow builds and publishes
3. Open `https://<username>.github.io/hype-sign/`

The Vite `base` is set to `/hype-sign/`. If you fork under a different repo name, update `base` in `vite.config.ts` and `start_url` / `scope` in the manifest.

## Tech stack

- Vite 6 + React 18 + TypeScript
- zustand (with `persist` → localStorage)
- vite-plugin-pwa (Workbox precache, auto-update SW)
- No UI library — every component is hand-rolled for full touch/styling control

## Project layout

```
src/
  components/
    display/      StaticDisplay (SVG auto-fit) · MarqueeDisplay (rAF scroll)
    settings/     SettingsPanel + sub-controls + color/ + presets/
    ui/           ConfirmButton (double-tap confirm)
  hooks/          useElementSize · useFullscreen · useWakeLock
  lib/            colorToCss · colorToSvg · measureText · i18n
  store/          settingsStore (zustand + persist)
  types.ts
  styles/global.css
```

## Why a service worker if there's no network feature?

Even without API calls, the app's own files (HTML / JS / CSS / icons) need a server to deliver them on every visit. The service worker pre-caches the app shell so the page loads instantly with **zero network**, which is the entire point in venues with bad reception. See `vite.config.ts` for the workbox config.

## License

MIT
