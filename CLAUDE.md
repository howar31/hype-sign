# Hype Sign — AI Index

Offline cheering board / LED display PWA. Vite 6 + React 18 + TypeScript.

## Run
- `npm run dev` — dev server (Node 20+)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve `dist/` locally
- `npm run typecheck` — tsc --noEmit

## Architecture
See [SPEC.md](SPEC.md).

## Conventions
- All UI strings go through `useT()` (`src/lib/i18n.ts`). Add new keys to both `ZH` and `EN` dicts.
- All persisted state goes through `useSettings` (zustand + persist, key `hype-sign:v1`). Don't read/write localStorage directly.
- Colors follow the `ColorValue` discriminated union — solid / linear / radial. CSS rendering via `colorToCss`; SVG fill via `<GradientDef>` + `fillFor`.
- Text rendering in `StaticDisplay` uses SVG `getBBox()` to derive the viewBox; never use `dominant-baseline="hanging"` (Safari clips it in landscape).
- Drawer settings are tabbed (4 tabs: Text / Tint / Backdrop / Settings); each tab is one component in `src/components/settings/sections/`. All tab sections render unconditionally — visibility toggles via the `hidden` attribute so per-section local state (ColorEditor snapshots, preset name inputs, ConfirmButton armed state) survives tab switches.
- `Preset` is a single-color snapshot `{ name, color }`; the same preset can be applied to either text or background via `applyPresetToText` / `applyPresetToBg`. Persist version is 2 — old `{textColor, bgColor}` pairs are migrated by splitting into two single-color presets.
- Resetting tint and backdrop are independent: each color section owns a `resetCounter` whose React `key` bumps the local ColorEditor so the per-type snapshots (solid/linear/radial) re-derive from the reset value. Don't add a global "reset both" action.
- Linear gradient angle in `colorToSvg.tsx` uses `dx=sin(θ), dy=-cos(θ)` so SVG-rendered tint and CSS-rendered backdrop match at the same angle — see SPEC.md for the math.
- Edge margin between text and screen is one setting (`margin`, 0–25 vmin). It's applied as `padding` on each display's outer wrapper so the bg color still fills the full canvas. MarqueeDisplay needs a two-div split (outer = bg + padding, inner = positioned container) because `position: absolute` is measured from the padding edge.
- Font weight is a user setting (`fontWeight`, 100–900 step 100). Both displays read it from store and pass to SVG `<text fontWeight>`. `measureLineWidth` takes weight as its third argument so canvas measurement matches what's rendered.
- `FONT_FAMILY` lives in `src/lib/measureText.ts` and is injected into a CSS variable `--font-family` from `main.tsx`; `global.css` reads `var(--font-family)`. Edit the chain only in `measureText.ts`.
- Floating settings button visibility is local state in `App.tsx`; tapping the canvas (`.display-root` onClick) toggles it. Hidden state uses CSS class `.hidden` (opacity 0 + `pointer-events: none`) so taps fall through to the canvas.
- Destructive UI actions (reset, delete, clear) use `ConfirmButton variant="danger"` — red armed state. Non-destructive but irreversible-feeling actions (apply preset) use `variant="neutral"` — blue armed state. Never use `alert()` / `confirm()` / native dialogs.
- Chinese terminology: user-saved snapshots are 「樣板」 (templates), not 「預設」 (which means "default" in zh-TW and is ambiguous). English stays "preset".

## Deploy
GitHub Actions on push to `main` → GitHub Pages. Live at `http://lab.howar31.com/hype-sign/`. Vite `base` is `/hype-sign/`; manifest `scope` and `start_url` match.

## Files where decisions live
- Build / PWA / base path — `vite.config.ts`
- TypeScript strictness — `tsconfig.app.json`
- Settings model + persistence — `src/store/settingsStore.ts`
- Color model — `src/types.ts`
- i18n strings — `src/lib/i18n.ts`
- Icon design — vintage CRT look (black tile, scan lines, warm vignette, LED bloom on G/R/Y bars). Three SVG sources:
  - `public/favicon.svg` — rounded-square with a 2px transparent margin (browser tab).
  - `public/icon-pwa.svg` — full-bleed (192/512 PWA PNG source, lets iOS/Android add their own corners).
  - `public/icon-maskable.svg` — full-bleed with bars inset to maskable safe zone (maskable-512.png source).
  PNGs are rasterized via `rsvg-convert`; no `-b` flag needed since SVGs are opaque. Logo colors are fixed — no `prefers-color-scheme`. See SPEC.md for exact regen commands.
