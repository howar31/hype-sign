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
- Drawer settings are tabbed: each tab is one component in `src/components/settings/sections/`.
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
- Icon design — three SVG sources:
  - `public/favicon.svg` — transparent crystal-glass tile (browser tab).
  - `public/icon-light.svg` — full-bleed sky-blue gradient + white bars (source for 192/512 PNGs).
  - `public/icon-maskable.svg` — same sky-blue background with bars inset to safe zone (source for maskable-512.png).
  PNGs are rasterized via `rsvg-convert`. Logo colors are fixed — no `prefers-color-scheme`. See SPEC.md for the exact regen commands.
