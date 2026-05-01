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
- Edge margin between text and screen is one setting (`margin`, 0–25 vmin), layered **on top of** the safe-area-aware `.display-root`. The display has two layers: `.bg-layer` (position: fixed, full-bleed, holds the bg color so it reaches under iPhone notch and every physical edge) and `.display-root` (position: fixed, `top: var(--sai-top)`, `bottom: 0`, `left/right: 0` — top avoids the notch, bottom reaches the physical edge so iOS auto-hides the home indicator over the canvas). `StaticDisplay` / `MarqueeDisplay` render transparent content; `.bg-layer` shows through.
- Safe-area insets are resolved once at `:root` into `--sai-{top,right,bottom,left}` and then read via `var()` everywhere else. This works around an iOS PWA standalone quirk where `env(safe-area-inset-*)` returns 0 when read on a `position: fixed` element. **Never re-introduce `env(safe-area-inset-*)` on a fixed-positioned element — always go through the `--sai-*` vars.**
- Font weight is a user setting (`fontWeight`, 100–900 step 100). Both displays read it from store and pass to SVG `<text fontWeight>`. `measureLineWidth` takes weight as its third argument so canvas measurement matches what's rendered.
- `FONT_FAMILY` lives in `src/lib/measureText.ts` and is injected into a CSS variable `--font-family` from `main.tsx`; `global.css` reads `var(--font-family)`. Edit the chain only in `measureText.ts`.
- Floating settings button visibility is local state in `App.tsx`; tapping the canvas (`.display-root` onClick) toggles it. Hidden state uses CSS class `.hidden` (opacity 0 + `pointer-events: none`) so taps fall through to the canvas.
- Rotation wrapper in `App.tsx` sizes itself to `.display-root` (the safe-area-aware canvas), not the raw viewport. When rotated 90°/270°, pre-rotation `width = calc(100dvh - var(--sai-top))` and `height = 100vw`; centered via `translate(-50%, -50%) rotate()`. **Do not** use `height: 100%` here — that resolves to *parent height* (= `100dvh - sai-top`), making the wrapper a square that overflows display-root horizontally. Spell out `100vw` for "parent width". Also avoid raw `100dvh`/`100dvw` — that overflows the notch boundary.
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
