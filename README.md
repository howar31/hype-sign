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
- **Tap to hide controls** — single tap on the canvas hides / reveals the floating settings button so the display can stay uncluttered

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

The drawer is split into four tabs to keep things scannable:

| Tab | Contents |
|---|---|
| Text | text input · static/marquee mode · marquee speed · text presets · clear text |
| Tint | text-color editor · save current color · shared color presets (apply to text) · reset tint |
| Backdrop | background-color editor · save current color · shared color presets (apply to bg) · reset backdrop |
| Settings | rotate 90° · fullscreen · language |

Color presets are single-color snapshots: a preset stores **one** ColorValue (solid / linear / radial) and you decide at apply-time whether it goes onto the text or the background. Both color tabs share the same preset list. Each preset row shows a tiny type icon next to the swatch (with hover/tap tooltip) so you can tell solid / linear / radial apart even when a multi-stop gradient renders too small.

Reset is per-color: resetting tint clears the text color across all three types (solid + linear + radial) but leaves backdrop alone, and vice versa. Destructive actions (reset, preset delete, text clear) confirm by tapping twice — no popup dialog. Applying a saved preset also asks for a second tap before overwriting your current color.

Saved snapshots are called 「樣板」 (templates) in the Chinese UI, not 「預設」, since the latter is the standard zh-TW word for "default" and would be confusing.

## Deploy

The repo auto-deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

After forking to a new GitHub repo:

1. Settings → Pages → **Source: GitHub Actions**
2. Push to `main` — the workflow runs typecheck, build, and publish
3. Open `https://<username>.github.io/<repo-name>/`

The Vite `base` is `/hype-sign/`. If you fork under a different repo name, update `base` in `vite.config.ts` and `start_url` / `scope` in the manifest there.

## Icons

Three SVG sources, each focused on a specific surface:

- `public/favicon.svg` — transparent crystal-glass tile + sky-cyan equalizer bars. Used as the browser-tab favicon; the canvas stays transparent so it sits on any tab background.
- `public/icon-light.svg` — full-bleed sky-blue gradient + white equalizer bars. Source of the home-screen PNGs (192 / 512). Bright, light-feel.
- `public/icon-maskable.svg` — same sky-blue background, but bars inset to fit the maskable safe zone.

All PNGs are rasterized with [librsvg](https://wiki.gnome.org/Projects/LibRsvg)'s `rsvg-convert`. To re-render after editing the SVGs:

```bash
brew install librsvg    # one-time, if not already installed
rsvg-convert -w 192 -h 192 public/icon-light.svg     -o public/icons/192.png
rsvg-convert -w 512 -h 512 public/icon-light.svg     -o public/icons/512.png
rsvg-convert -w 512 -h 512 public/icon-maskable.svg  -o public/icons/maskable-512.png
```

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
