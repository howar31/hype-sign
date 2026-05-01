# Hype Sign

電子應援手板 / LED 顯示板 PWA — fully offline, multi-color gradients, marquee mode, Liquid-Glass UI.

> 在演唱會、體育場、戶外活動等任何訊號不穩的場合，把手機 / iPad / PC 變成一塊高亮顯示板。

## Features

- **Static mode** — multi-line text auto-fits to fill the entire screen, gradients span the full block
- **Marquee mode** — joins all lines into one and scrolls horizontally at a constant 100–2000 px/s
- **Color** — solid, linear gradient, or radial gradient for both text and background, with unlimited dynamic color stops
- **Color presets** — save and recall favorite color combos
- **Text presets** — save text-only snippets independently of styling
- **Rotate 90°** in-app, no need to rotate your device
- **Fullscreen** + **Wake Lock** — screen stays on while you cheer
- **Bilingual** — 繁體中文 / English
- **Touch + mouse + pen** via Pointer Events
- **Fully offline** — installs as a PWA, works without network after first load
- **Liquid-Glass UI** — translucent backdrop-blurred settings panel

## Quick start

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run typecheck  # tsc --noEmit
```

Requires Node 20 or newer.

## Settings panel

The drawer is split into three tabs to keep things scannable:

| Tab | Contents |
|---|---|
| Text | text input · static/marquee mode · marquee speed · text presets |
| Style | text color · background color · color presets · reset colors |
| Other | rotate 90° · fullscreen · language |

Reset only resets colors — it never touches your text, mode, speed, or rotation. Destructive actions (reset, preset delete, text clear) confirm by tapping twice — no popup dialog.

## Deploy

The repo auto-deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

After forking to a new GitHub repo:

1. Settings → Pages → **Source: GitHub Actions**
2. Push to `main` — the workflow runs typecheck, build, and publish
3. Open `https://<username>.github.io/<repo-name>/`

The Vite `base` is `/hype-sign/`. If you fork under a different repo name, update `base` in `vite.config.ts` and `start_url` / `scope` in the manifest there.

## Architecture

See [SPEC.md](SPEC.md) for the full architecture spec — modules, data model, render pipeline, store actions, PWA setup, and gotchas.

## Tech stack

- Vite 6 + React 18 + TypeScript
- zustand 5 (with `persist` middleware → localStorage)
- vite-plugin-pwa (Workbox precache, auto-update SW)
- No UI library — every component is hand-rolled for full touch/styling control

## Why a service worker if there's no network feature?

Even without API calls, the app's own files (HTML / JS / CSS / icons) need a server to deliver them on every visit. The service worker pre-caches the app shell so the page loads instantly with **zero network**, which is the whole point in venues with bad reception. See `vite.config.ts` for the workbox config.

## License

MIT
