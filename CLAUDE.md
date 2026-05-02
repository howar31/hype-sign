# Hype Sign — AI Index

Offline cheering board / LED display PWA. Vite 6 + React 18 + TypeScript.

## Run
- `npm run dev` — dev server (Node 20+)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve `dist/` locally
- `npm run typecheck` — tsc --noEmit
- `npm run smoke` — headless puppeteer smoke suite (Node 18, auto-spawns dev server). Add `-- --only=<filter>` to run a subset. Screenshots dropped at `/tmp/hype-sign-smoke/`. Headless does NOT reproduce iOS-specific quirks — real device still required for iOS PWA changes.

## Architecture
See [SPEC.md](SPEC.md).

## Conventions
- All UI strings go through `useT()` (`src/lib/i18n.ts`). Add new keys to both `ZH` and `EN` dicts.
- All persisted state goes through `useSettings` (zustand + persist, key `hype-sign:v1`). Don't read/write localStorage directly.
- Colors follow the `ColorValue` discriminated union — solid / linear / radial. CSS rendering via `colorToCss`; SVG fill via `<GradientDef>` + `fillFor`.
- Text rendering in `StaticDisplay` uses SVG `getBBox()` to derive the viewBox; never use `dominant-baseline="hanging"` (Safari clips it in landscape).
- Drawer settings are tabbed (4 tabs: Text / Tint / Backdrop / Settings); each tab is one component in `src/components/settings/sections/`. All tab sections render unconditionally — visibility toggles via the `hidden` attribute so per-section local state (ColorEditor snapshots, preset name inputs, ConfirmButton armed state) survives tab switches.
- `Preset` is a single-color snapshot `{ name, color }`; the same preset can be applied to either text or background via `applyPresetToText` / `applyPresetToBg`. `TextPreset` stores `{ name, text }`. Both lists support Edit mode (local `useState`, not persisted) that swaps Apply for ▲/▼ reorder + Delete controls; reorder mutates the array position in the store (no separate `order` field). Persist version is 3 — v1→v2 migration splits old `{textColor, bgColor}` preset pairs into two single-color presets; v2→v3 is additive (seeds `panelMode` / `floatingPos` / `mobilePanelHeight` / `floatingHeight` defaults).
- Resetting tint and backdrop are independent: each color section owns a `resetCounter` whose React `key` bumps the local ColorEditor so the per-type snapshots (solid/linear/radial) re-derive from the reset value. Don't add a global "reset both" action.
- Linear gradient angle in `colorToSvg.tsx` uses `dx=sin(θ), dy=-cos(θ)` so SVG-rendered tint and CSS-rendered backdrop match at the same angle — see SPEC.md for the math.
- Edge margin between text and screen is one setting (`margin`, 0–25 % of `--display-min`), layered **on top of** the safe-area-aware `.display-root`. The display has two full-bleed layers: `.bg-layer` (`position: fixed; inset: 0`, holds the bg color so it reaches under the iPhone notch and every physical edge) and `.display-root` (`position: fixed; top: var(--sai-top); right/bottom/left: 0` — top avoids the notch, bottom reaches the physical edge so iOS auto-hides the home indicator over the canvas). The settings panel is layered ON TOP of these (no canvas shrinking) — clicking the canvas toggles the panel away to reveal the unobstructed full design. `StaticDisplay` / `MarqueeDisplay` render transparent content; `.bg-layer` shows through.
- Safe-area insets are resolved once at `:root` into `--sai-{top,right,bottom,left}` and then read via `var()` everywhere else. This works around an iOS PWA standalone quirk where `env(safe-area-inset-*)` returns 0 when read on a `position: fixed` element. **Never re-introduce `env(safe-area-inset-*)` on a fixed-positioned element — always go through the `--sai-*` vars.**
- Font weight is a user setting (`fontWeight`, 100–900 step 100). Both displays read it from store and pass to SVG `<text fontWeight>`. `measureLineWidth` takes weight as its third argument so canvas measurement matches what's rendered.
- `FONT_FAMILY` lives in `src/lib/measureText.ts` and is injected into a CSS variable `--font-family` from `main.tsx`; `global.css` reads `var(--font-family)`. Edit the chain only in `measureText.ts`.
- Settings panel has two modes (`panelMode`: `'split'` | `'floating'`, persisted) and one visibility flag (`panelVisible`, session-only). There is **no gear button** — clicking anywhere on `.display-root` toggles `panelVisible` regardless of mode/device. Split = panel docked (right on desktop at `var(--panel-width)`, bottom on mobile at `var(--mobile-panel-height)`); the panel sits ON TOP of the full-bleed canvas (no shrinking). Floating (desktop only, ≥ 768px) = panel positioned via inline `left/top` from `floatingPos`, draggable from the header, with rounded corners and a bottom resize handle that drags `floatingHeight` (clamped 200px ↔ `100dvh - 40px`, persisted). All modes carry a directional drop shadow that fades out together with the panel — shadow is only set on `.drawer.drawer--*.open` and lives on the `box-shadow` transition, so when the panel slides offscreen the shadow doesn't leak back into the visible canvas. The mobile bottom-sheet has a top resize handle that drags `mobilePanelHeight` (clamped 200px ↔ 90% viewport, leaving ~10vh tappable canvas above, persisted). The mode-toggle icon button only renders on desktop.
- Rotation wrapper in `App.tsx` reads `.display-root`'s actual size via inline CSS vars `--display-w` / `--display-h` / `--display-min`, published by a single `ResizeObserver` on the display ref. When rotated 90°/270°, pre-rotation `width = var(--display-h)` and `height = var(--display-w)`; centered via `translate(-50%, -50%) rotate()`. The same `--display-min` is consumed by `StaticDisplay` / `MarqueeDisplay` for their edge-margin padding (`calc(var(--display-min) * margin/100)`), keeping the rotation/margin code robust to any future container size changes. The display itself doesn't shrink today, but the indirection avoids the historic `100dvh`/`100vw` pitfalls — don't re-introduce viewport units here.
- Destructive UI actions (reset, delete, clear) use `ConfirmButton variant="danger"` — red armed state. Non-destructive but irreversible-feeling actions (apply preset) use `variant="neutral"` — blue armed state. Never use `alert()` / `confirm()` / native dialogs.
- Chinese terminology: user-saved snapshots are 「樣板」 (templates), not 「預設」 (which means "default" in zh-TW and is ambiguous). English stays "preset".
- Build-time `__COMMIT__` (resolved in `vite.config.ts` → `git rev-parse --short HEAD`, CI prefers `GITHUB_SHA`, dirty tree → `<sha>-dirty`, no-git → `'dev'`) is shown as a small footer in the Settings tab, followed by GitHub repo + sponsor links (zh label 「贊助」 not 「捐款」 — see `~/.claude/skills/accept-donations`). SW update detection is **passive only**: `src/lib/swUpdate.ts` adds a `controllerchange` listener (skipped when `controller === null` to avoid first-install false positives) and exposes `useUpdateReady()`. `registerType: 'autoUpdate'` and the auto-injected `registerSW.js` are unchanged — never call `register()` / `skipWaiting()` / `update()` manually here.

## Deploy
GitHub Actions on push to `main` → GitHub Pages (skips docs-only pushes via `paths-ignore`). Live at `https://lab.howar31.com/hype-sign/`. Vite `base` is `/hype-sign/`; manifest `scope` and `start_url` match. Repo is MIT-licensed (root `LICENSE`).

## Tooling
- README screenshots + hero gif live in `docs/screenshots/`. Regenerate with `nvm use 18 && NODE_PATH=$(npm root -g) node scripts/capture-screenshots.cjs` (Puppeteer headless + ffmpeg palette encode). Add `--only=<id>` to recapture a single scene. Scenes (state seeded via `localStorage hype-sign:v1` at version 3) are defined inline in the script. Current set: 1 hero gif + 10 PNGs (`panel-text`, `panel-tint`, `panel-floating`, `panel-presets`, `panel-rotated`, `panel-edit-mode`, `mobile-text`, `mobile-tint`, `drawer-zh`, `drawer-en`). Drawer-open scenes use `page.click('.display-root')` to trigger the canvas-toggle UX (no gear button); `editMode: true` scenes click the Edit button after tab switch + scroll. No canvas-only scenes remain.
- Smoke suite at `scripts/smoke.cjs` (run via `npm run smoke`). Covers: layout integrity, static + marquee rotation centering (measures `<svg text>` ink rect, NOT the SVG container — see `reference_ios_pwa_layout.md` for why), panel modes, drag clamps, settings actions, color stop-bar axis, preset edit mode (toggle, reorder, delete, auto-exit), persistence + v2→v3 migration, i18n key parity, console-error detection, plus visual snapshots. Each test isolates state by clearing `localStorage` in the page setup.

## Files where decisions live
- Build / PWA / base path — `vite.config.ts`
- TypeScript strictness — `tsconfig.app.json`
- Settings model + persistence — `src/store/settingsStore.ts`
- Color model — `src/types.ts`
- i18n strings — `src/lib/i18n.ts`
- Version footer + SW update hint — `src/lib/swUpdate.ts` (passive listener + hook), rendered in `src/components/settings/sections/OtherSection.tsx`
- Icon design — vintage CRT look (black tile, scan lines, warm vignette, LED bloom on G/R/Y bars). Three SVG sources:
  - `public/favicon.svg` — rounded-square with a 2px transparent margin (browser tab).
  - `public/icon-pwa.svg` — full-bleed (192/512 PWA PNG source, lets iOS/Android add their own corners).
  - `public/icon-maskable.svg` — full-bleed with bars inset to maskable safe zone (maskable-512.png source).
  PNGs are rasterized via `rsvg-convert`; no `-b` flag needed since SVGs are opaque. Logo colors are fixed — no `prefers-color-scheme`. See SPEC.md for exact regen commands.
