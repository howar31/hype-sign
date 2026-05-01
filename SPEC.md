# Hype Sign — Architecture Spec

A fully-offline web app that turns any device into a cheering / LED display board. Two display modes (static auto-fit + horizontal marquee), custom gradient colors, color + text preset library, bilingual UI, PWA-installable.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Build | Vite 6 | Fast HMR, easy PWA integration, GitHub Pages friendly with `base` |
| UI | React 18 + TypeScript | Strict typing for the color discriminated union; reactive settings |
| State | zustand 5 + `persist` middleware | Tiny (~1KB), built-in localStorage persistence with selective `partialize` |
| PWA | `vite-plugin-pwa` 0.21 (Workbox) | `registerType: 'autoUpdate'`, precache full app shell |
| Styling | Hand-rolled CSS in `src/styles/global.css` | Full control over touch interactions and Liquid-Glass effects; no UI lib bundle |
| Drag / pointer | Native Pointer Events | One code path for mouse/touch/pen |

No router, no UI library, no CSS framework. Everything client-side; no API calls anywhere in app code.

## Module map

```
src/
├── main.tsx                              app bootstrap
├── App.tsx                               root: rotation transform + display + toggle button + drawer
├── types.ts                              ColorValue, Settings, Preset, TextPreset, DEFAULT_*
├── store/
│   └── settingsStore.ts                  single zustand store; persist key "hype-sign:v1"
├── lib/
│   ├── colorToCss.ts                     ColorValue → CSS background string
│   ├── colorToSvg.tsx                    ColorValue → <linearGradient>/<radialGradient> defs
│   ├── measureText.ts                    canvas-based text width measurement (ref font size)
│   └── i18n.ts                           ZH/EN dict + useT() hook
├── hooks/
│   ├── useElementSize.ts                 ResizeObserver wrapper
│   ├── useFullscreen.ts                  Fullscreen API wrapper
│   └── useWakeLock.ts                    Screen Wake Lock with visibility re-acquire
├── components/
│   ├── display/
│   │   ├── StaticDisplay.tsx             auto-fit multi-line via SVG + getBBox viewBox
│   │   └── MarqueeDisplay.tsx            single-line scroller via requestAnimationFrame
│   ├── settings/
│   │   ├── SettingsPanel.tsx             drawer + 3 tabs (Text / Style / Other)
│   │   ├── sections/
│   │   │   ├── TextSection.tsx           TextInput + ModeToggle + SpeedSlider + TextPresetManager
│   │   │   ├── StyleSection.tsx          two ColorEditor + PresetManager + ResetButton
│   │   │   └── OtherSection.tsx          RotateButton + FullscreenButton + LanguageToggle
│   │   ├── TextInput.tsx · ModeToggle.tsx · SpeedSlider.tsx · RotateButton.tsx
│   │   ├── FullscreenButton.tsx · LanguageToggle.tsx · ResetButton.tsx
│   │   ├── color/
│   │   │   ├── ColorEditor.tsx           tabs: solid / linear / radial
│   │   │   ├── SolidPicker.tsx
│   │   │   ├── LinearEditor.tsx          angle slider + StopList
│   │   │   ├── RadialEditor.tsx          cx/cy pad picker + StopList
│   │   │   └── StopList.tsx              dynamic add/remove/edit color stops
│   │   └── presets/
│   │       ├── PresetManager.tsx         color preset (textColor + bgColor)
│   │       ├── PresetItem.tsx
│   │       ├── TextPresetManager.tsx     text-content preset
│   │       └── TextPresetItem.tsx
│   └── ui/
│       └── ConfirmButton.tsx             double-click-to-confirm pattern (no alert dialog)
└── styles/global.css                     Liquid-Glass design tokens + all component CSS
```

## Data model (`src/types.ts`)

```ts
type SolidColor = { type: 'solid'; color: string };          // hex
type ColorStop  = { id: string; color: string; position: number }; // 0–100
type LinearGradient = { type: 'linear'; angle: number; stops: ColorStop[] };
type RadialGradient = { type: 'radial'; cx: number; cy: number; stops: ColorStop[] };
type ColorValue = SolidColor | LinearGradient | RadialGradient;

type Mode = 'static' | 'marquee';
type Lang = 'zh-TW' | 'en';
type Rotation = 0 | 90 | 180 | 270;

type Settings = {
  text: string;                // \n-separated lines
  textColor: ColorValue;
  bgColor: ColorValue;
  mode: Mode;
  marqueeSpeed: number;        // 100–2000 (px/s)
  rotation: Rotation;
  lang: Lang;
};

type Preset     = { id; name; textColor; bgColor };  // color preset
type TextPreset = { id; name; text };                // text-content preset
```

`DEFAULT_SETTINGS` ships text=`'HYPE\nSIGN'`, white-on-black, static mode, 400 px/s, no rotation, zh-TW.

## Store (`src/store/settingsStore.ts`)

Single zustand store, all actions live here; components only `useSettings(s => s.field)` (selector form for fine-grained subscription).

| Action | Effect |
|---|---|
| `setText`, `setTextColor`, `setBgColor`, `setMode`, `setMarqueeSpeed`, `setRotation`, `setLang` | Trivial setters |
| `setMarqueeSpeed` | Clamps to `[MIN_SPEED, MAX_SPEED]` and rounds |
| `cycleRotation` | 0 → 90 → 180 → 270 → 0 |
| `resetColors` | Sets `textColor`/`bgColor` back to defaults; everything else preserved |
| `savePreset(name)` | Snapshot current colors as a `Preset`, append |
| `applyPreset(id)` | Restore both `textColor` and `bgColor` from preset |
| `deletePreset(id)`, `renamePreset(id, name)` | Standard |
| `saveTextPreset(name)` | Snapshot current `text` as a `TextPreset` (no-op if text is blank) |
| `applyTextPreset(id)` | Restore `text` only |
| `deleteTextPreset(id)` | Standard |

`partialize` lists every persisted field explicitly — when you add a setting that should survive reload, add it there.

## Display rendering

### StaticDisplay (`src/components/display/StaticDisplay.tsx`)

Multi-line text auto-fits to fill the viewport, both axes, preserving aspect ratio.

1. Split `text` on `\n`, trim trailing empties (interior blanks kept as visible gaps).
2. Render once with a font-metric–estimated viewBox, then `useLayoutEffect → getBBox()` measures the actual text bounding box and updates state synchronously before paint. This eliminates font-metric guessing and gives pixel-perfect vertical centering when paired with `preserveAspectRatio="xMidYMid meet"`.
3. All lines are emitted as **a single `<text>` with one `<tspan>` per line**. This makes the gradient `objectBoundingBox` span the entire multi-line block — every line shares one continuous gradient, instead of each line getting its own gradient mapped to its own bbox.
4. First `<tspan>` uses `dy = fontSize * 0.85` (approximate cap-baseline offset). Subsequent `<tspan>` elements use `dy = lineHeight`. We do **not** set `dominant-baseline="hanging"` because Safari clips text above viewBox y=0 when the SVG is height-limited (e.g. iPhone landscape).
5. Background applied as CSS `background` on the wrapper div via `colorToCss`; text fill applied via `fillFor` (gradient → `url(#id)`, solid → hex).

### MarqueeDisplay (`src/components/display/MarqueeDisplay.tsx`)

Single-line continuous scroller at constant pixels-per-second.

1. Lines joined into one string with single-space separators (empty lines dropped).
2. Container measured via `useElementSize` (`ResizeObserver`).
3. Inner SVG renders the joined string at reference font size; its CSS width is `textWidth × (containerHeight / lineHeight)` so the rendered glyphs fill viewport height.
4. `requestAnimationFrame` loop in `useEffect` translates the container by `-speed × dt` per frame; when fully off-screen left, x resets to `containerWidth`. CSS animations are **not** used — duration depends on text width and we want a constant px/s regardless.

### Color → SVG (`src/lib/colorToSvg.tsx`)

`<GradientDef>` emits either nothing (solid), `<linearGradient>`, or `<radialGradient>` with `gradientUnits="objectBoundingBox"`. Linear angle is converted from CSS convention (0° = up, clockwise) into unit-square endpoints.

## Settings panel

Drawer with three tabs:
- **Text** — text input, mode toggle, marquee-speed slider (when mode=marquee), text presets
- **Style** — text-color editor, background-color editor, color presets, reset-colors button
- **Other** — rotate 90° cycle, fullscreen, language toggle

Tab state is local (`useState`) — not persisted across sessions; defaults to `text`.

## ConfirmButton

Reusable double-tap-to-confirm pattern (`src/components/ui/ConfirmButton.tsx`). First click arms the button (label switches to a confirmation phrase), second click within `timeoutMs` (default 3000) fires `onConfirm`. Used for Reset and preset deletion. No `alert()` / native dialog ever — they break the standalone PWA feel and double-tap is more touch-friendly.

## i18n (`src/lib/i18n.ts`)

Single file, two flat dicts (ZH-TW + EN). `useT()` returns `(key) => string`. Missing keys fall through to the key itself (visible during dev). Translation source is `lang` field from store. Add new strings to **both** dicts.

## PWA

`vite.config.ts` configures `vite-plugin-pwa` with:
- `registerType: 'autoUpdate'` — new SW activates next launch
- Workbox precaches all `js/css/html/svg/png/ico/webmanifest` build outputs (currently 14 entries, ~178 KiB)
- Manifest: `display: standalone`, `start_url`/`scope` = `/hype-sign/`, three icons (192, 512, maskable-512)

Icons live at `public/icons/`. Generator at `scripts/gen-icons.mjs`-style process is documented in commit history; current PNGs are placeholder (solid colored "H" tiles) — replace `public/icons/*.png` to ship a real brand.

## Styling — Liquid Glass

Tokens at the top of `global.css`:
- `--glass-bg` translucent panel surface (alpha ≈ 0.6)
- `--glass-bg-elev` / `--glass-bg-sunken` elevation layers
- `--glass-stroke` subtle white-alpha hairlines
- `--blur-glass` = `blur(40px) saturate(180%)`

Every panel surface (drawer, toggle, buttons, inputs, presets) uses some combination of: translucent rgba background + 1px alpha stroke + `backdrop-filter` blur + optional inner-highlight `box-shadow` (`inset 0 1px 0 …`). Range sliders are explicitly restyled across `-webkit-` and `-moz-` pseudo-elements.

Everything that's a "raised surface" uses `--glass-bg-elev`; everything that's "sunken" (inputs, sliders, tab strips) uses `--glass-bg-sunken`. Active states pick up the inner highlight + stronger stroke.

## Touch / cross-device

- `touch-action: manipulation` globally → no 300ms tap delay, no double-tap zoom
- Pointer Events on radial-pad → mouse/touch/pen single code path
- Drawer is full-width on `max-width: 480px`, fixed 380px on desktop
- All tap targets ≥ 36px (most are 40+)
- `useWakeLock` keeps screen awake while drawer is mounted (re-acquires on visibility change)
- iOS standalone meta tags set in `index.html`

## Deploy

`.github/workflows/deploy.yml` runs on push to `main`:
1. Checkout, setup Node 22, `npm ci`
2. `npm run typecheck` then `npm run build`
3. `actions/configure-pages` → `actions/upload-pages-artifact ./dist` → `actions/deploy-pages`

The repository's GitHub Pages is configured with `build_type=workflow`. Account-level custom domain `lab.howar31.com` resolves to `lab.howar31.com/hype-sign/`.

To fork to a different repo name: change `base` in `vite.config.ts` and `start_url`/`scope` in the PWA manifest there.

## Things to be careful about when extending

- **Persisted state**: any new setting must be added to `partialize` in the store, otherwise it won't survive reload.
- **i18n**: every new user-visible string needs a key in both ZH and EN dicts.
- **Color editor**: when adding a new gradient type, update `ColorValue` union + `colorToCss` + `colorToSvg.GradientDef` + `ColorEditor.selectType` (preserve stops when switching types).
- **getBBox in StaticDisplay**: the `useLayoutEffect` dep array includes `text`, `fontSize`, `lineHeight`, `lines.length` — if you add new factors that affect rendering, include them too or measurements go stale.
- **Don't reintroduce `dominant-baseline="hanging"`** — it clips on iOS Safari in landscape.
