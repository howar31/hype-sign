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
│   └── settingsStore.ts                  single zustand store; persist key "hype-sign:v1", version 2
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
│   │   ├── SettingsPanel.tsx             drawer + 4 tabs (Text / Tint / Backdrop / Settings)
│   │   ├── sections/
│   │   │   ├── TextSection.tsx           TextInput + ModeToggle + SpeedSlider + TextPresetManager + ClearTextButton
│   │   │   ├── TextColorSection.tsx      ColorEditor (text) + SaveCurrentColor + ColorPresetList(text) + ResetColorButton(tint)
│   │   │   ├── BackgroundColorSection.tsx ColorEditor (bg) + SaveCurrentColor + ColorPresetList(bg) + ResetColorButton(bg)
│   │   │   └── OtherSection.tsx          RotateButton + FullscreenButton + LanguageToggle
│   │   ├── TextInput.tsx · ModeToggle.tsx · SpeedSlider.tsx · RotateButton.tsx
│   │   ├── FullscreenButton.tsx · LanguageToggle.tsx · ClearTextButton.tsx · ResetColorButton.tsx
│   │   ├── color/
│   │   │   ├── ColorEditor.tsx           tabs: solid / linear / radial; per-type snapshots
│   │   │   ├── SolidPicker.tsx
│   │   │   ├── LinearEditor.tsx          angle slider + StopList
│   │   │   ├── RadialEditor.tsx          cx/cy pad picker + StopList
│   │   │   └── StopList.tsx              dynamic add/remove (ConfirmButton)/edit color stops
│   │   └── presets/
│   │       ├── SaveCurrentColor.tsx      save current color in active editor as a single-color preset
│   │       ├── ColorPresetList.tsx       shared preset list; applyTo prop chooses tint vs backdrop
│   │       ├── PresetItem.tsx            swatch + ColorTypeIcon + name + apply/delete
│   │       ├── ColorTypeIcon.tsx         14×14 type glyph (solid / linear / radial) with hover+tap tooltip
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
  margin: number;              // 0–25 (vmin units of padding around text)
  fontWeight: number;          // 100–900 (snapped to 100s)
};

type Preset     = { id; name; color: ColorValue }; // single-color preset (was {textColor,bgColor} pair before persist v2)
type TextPreset = { id; name; text };              // text-content preset
```

Persisted under `hype-sign:v1` / version 2. v1 → v2 migration in `settingsStore.ts` splits each old `{textColor, bgColor}` preset into two single-color presets named `…(字)` and `…(底)` so user data isn't lost.

`DEFAULT_SETTINGS` ships text=`'Hype Sign\nSettings ↗'` (second line points first-time users to the floating settings button at the top-right), white-on-black, static mode, 400 px/s, no rotation, zh-TW, `margin=0`, `fontWeight=800`.

## Store (`src/store/settingsStore.ts`)

Single zustand store, all actions live here; components only `useSettings(s => s.field)` (selector form for fine-grained subscription).

| Action | Effect |
|---|---|
| `setText`, `setTextColor`, `setBgColor`, `setMode`, `setMarqueeSpeed`, `setRotation`, `setLang` | Trivial setters |
| `setMarqueeSpeed` | Clamps to `[MIN_SPEED, MAX_SPEED]` and rounds |
| `setMargin` | Clamps to `[MIN_MARGIN, MAX_MARGIN]` (0–25) and rounds. Applied as `padding: ${margin}vmin` on each display's outer wrapper, so the bg color still fills the full canvas while the text content shrinks |
| `setFontWeight` | Snaps to the nearest multiple of 100 within `[MIN_FONT_WEIGHT, MAX_FONT_WEIGHT]` (100–900). Applied to `<text>` in both displays and to the canvas font string in `measureLineWidth`, so width measurement matches what's rendered |
| `cycleRotation` | 0 → 90 → 180 → 270 → 0 |
| `resetTextColor` / `resetBgColor` | Set the named color back to its default (white text / black bg). The two are independent — resetting tint never touches backdrop |
| `savePreset(name, color)` | Append a single-color `Preset` from the explicit `color` argument (the active editor passes its current `textColor` or `bgColor`) |
| `applyPresetToText(id)` / `applyPresetToBg(id)` | Restore the chosen preset onto either side. The preset itself is type-agnostic; the apply target is decided by which color tab the user is in |
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
2. Outer wrapper holds the bg color and the `padding: ${margin}vmin`; an inner container then fills the post-padding content area and is what `useElementSize` measures and what the absolutely-positioned text element is positioned against. This split is necessary because `position: absolute` is relative to the padding edge, so without it the inner element would overlap the padding zone instead of respecting the margin.
3. Inner SVG renders the joined string at reference font size; its CSS width is `textWidth × (containerHeight / lineHeight)` so the rendered glyphs fill viewport height.
4. `requestAnimationFrame` loop in `useEffect` translates the container by `-speed × dt` per frame; when fully off-screen left, x resets to `containerWidth`. CSS animations are **not** used — duration depends on text width and we want a constant px/s regardless.

### Color → SVG (`src/lib/colorToSvg.tsx`)

`<GradientDef>` emits either nothing (solid), `<linearGradient>`, or `<radialGradient>` with `gradientUnits="objectBoundingBox"`. Linear angle follows CSS convention (0° = up, clockwise) and is converted to a unit-square direction vector — `dx = sin(θ)`, `dy = -cos(θ)` — then projected ±0.5 from the center to get the gradient endpoints. This matches the CSS rendering used for backgrounds: tint (SVG-rendered) and backdrop (CSS-rendered) at the same angle look identical.

## Settings panel

Drawer with four tabs (in order):
- **Text** (`文字`) — text input, mode toggle, marquee-speed slider (when mode=marquee), font-weight slider, text presets, clear-text button at end
- **Tint** (`字色`) — text-color editor, save-current-color form, shared color preset list (apply hits text), reset-tint button at end
- **Backdrop** (`底色`) — background-color editor, save-current-color form, shared color preset list (apply hits bg), reset-backdrop button at end
- **Settings** (`設定`) — rotate 90° cycle, fullscreen, edge-margin slider, language toggle

`ClearTextButton`, `ResetColorButton(tint)`, and `ResetColorButton(bg)` all live at the bottom of their respective tabs as identical-looking danger ConfirmButtons. The two color-reset buttons are independent: resetting tint clears textColor and re-derives the ColorEditor's solid/linear/radial snapshots via a `key` bump, but does not touch backdrop's snapshots, and vice versa.

The shared `ColorPresetList` is rendered in both color tabs but takes an `applyTo: 'text' | 'bg'` prop so the apply button knows which side to write to. The preset itself is just `{ name, color }` — there is no "preset is for text" vs "preset is for bg" distinction in storage.

`ColorTypeIcon` (next to each preset's swatch) renders a tiny 14×14 glyph for solid / linear / radial. Tooltip: native `:hover` for desktop, plus a React-state-driven tap tooltip that auto-dismisses after ~2s for touch devices.

Tab state is local (`useState`) — not persisted across sessions; defaults to `text`.

### Panel modes

Two layout modes (`panelMode`: `'split'` | `'floating'`, persisted) and a single session visibility flag (`panelVisible`):

- **Split (default)** — panel docked. On desktop (≥ 768px) it docks to the right at `var(--panel-width)` (380px); on mobile (< 768px) it collapses to a bottom sheet at `var(--mobile-panel-height)` (default 360px, persisted, draggable via top resize handle, clamped 200px ↔ 90% viewport so ~10vh of canvas stays visible / tappable above the sheet). The panel sits ON TOP of the full-bleed canvas — no shrinking. No mask. Has a directional shadow when open (left-cast on desktop, up-cast on mobile).
- **Floating (desktop only)** — panel becomes a draggable free window positioned via inline `left` / `top` from `floatingPos` (persisted, re-clamped on hydrate / resize so positions saved at a larger viewport don't leak off-screen). Has shadow + rounded corners + a bottom resize handle that drags `floatingHeight` (default 600px, persisted, clamped 200px ↔ `100dvh - 40px`). Drag handle for repositioning is the panel header (`.drawer-header.draggable`); pointer-capture-based drag, no library. Bounds clamp keeps at least 80px of header on-screen.

**Shadow / open-state coupling.** All panel shadows live on the `.drawer.drawer--*.open` rules, not the base, and `box-shadow` is part of the `.drawer` transition list. When the panel slides offscreen via `transform: translateX/Y(100%)`, its `.open` class is removed, the box-shadow falls back to `none`, and the shadow's leak into the still-visible canvas fades out in sync with the slide.

Mode is toggled via a button in the panel header (only rendered on desktop). Below the breakpoint `panelMode === 'floating'` is visually downgraded to split (bottom sheet) without mutating the persisted preference, so resizing back up restores floating.

The panel itself is rendered in either mode regardless — `.drawer.drawer--split` or `.drawer.drawer--floating` — and `.open` toggles slide-in (split) or scale+fade-in (floating). Click on `.display-root` calls `togglePanel()` regardless of mode/device; ESC and the header `✕` call `closePanel()` for explicit dismiss. There is no separate gear button. Click-canvas-toggle is the preview gesture — close panel to see the unobstructed design, click again to reopen and continue editing.

## ConfirmButton

Reusable double-tap-to-confirm pattern (`src/components/ui/ConfirmButton.tsx`). First click arms the button (label switches to a confirmation phrase), second click within `timeoutMs` (default 3000) fires `onConfirm`.

Two visual variants via `variant` prop (default `'danger'`):
- `'danger'` — red border / red armed state. Used for destructive actions: reset colors (`ResetButton`), clear text (`ClearTextButton`), preset delete.
- `'neutral'` — plain glass border / **blue** armed state. Used for non-destructive but state-replacing actions: applying a color or text preset (`PresetItem` / `TextPresetItem`).

CSS specificity: `.btn.danger.armed` outranks `.btn.armed`, so danger buttons keep the red armed look even though both classes match.

No `alert()` / native dialog is used anywhere — they break the standalone PWA feel and double-tap is more touch-friendly.

## Font

`measureText.ts` exports the canonical `FONT_FAMILY` string — a system-font fallback chain. `main.tsx` reads it on boot and writes the value into the `--font-family` CSS custom property on `documentElement`. `global.css` then references `var(--font-family, system-ui, sans-serif)` so canvas-based width measurement and the actual rendered CSS font cannot drift apart. Change the chain in `measureText.ts` only.

Cross-device, the rendered font is whatever the device has (SF Pro on Apple, Segoe UI on Windows, Roboto/Noto Sans on Android, PingFang/JhengHei/Noto for CJK). Visual consistency across devices therefore varies — bundling a web font (Inter Variable for Latin, optionally Noto Sans TC subset for Chinese) is a known follow-up but not yet implemented.

`fontWeight` is a user setting (100–900, step 100, default 800). The CSS spec accepts 1–1000 but only the listed steps map to OpenType weights. If the active font lacks the requested weight, the browser substitutes the closest available — both display surfaces and canvas measurement use the same value, so the substitution is consistent.

## i18n (`src/lib/i18n.ts`)

Single file, two flat dicts (ZH-TW + EN). `useT()` returns `(key) => string`. Missing keys fall through to the key itself (visible during dev). Translation source is `lang` field from store. Add new strings to **both** dicts.

**Terminology note:** in zh-TW, user-saved snapshots are translated as 「樣板」 (template), not 「預設」 (which collides with the standard term for "default"). English keeps "preset". Affected keys: `colorPreset.section`, `textPreset.section`, `preset.namePlaceholder`, `preset.empty`.

## PWA

`vite.config.ts` configures `vite-plugin-pwa` with:
- `registerType: 'autoUpdate'` — new SW activates next launch
- Workbox precaches all `js/css/html/svg/png/ico/webmanifest` build outputs
- Manifest: `name` = `'Hype Sign'`, `short_name` = `'Hype Sign'` (kept as the full name so the iOS/Android home-screen label doesn't collapse to just "Hype"), `display: standalone`, `start_url`/`scope` = `/hype-sign/`, three icons (192, 512, maskable-512)

Icons are SVG-sourced and rasterized to PNG via `rsvg-convert` (librsvg). Source files:

Three SVG sources, all sharing the **vintage CRT** look — solid `#0a0a0a` body, almost-invisible horizontal scan lines (Gaussian-profile gradient), radial vignette + warm amber corner tint for the aged-tube feel, very faint `feTurbulence` phosphor grain (α≈0.03), subtle top rim light, and three high-saturation bars (green `#00e676` / red `#ff3b4d` / yellow `#ffea00`) wrapped in a `feGaussianBlur` bloom that mimics LED phosphor bleed:

- `public/favicon.svg` — **browser tab favicon**. Rounded square (60×60 inside a 64×64 viewBox, with 2px transparent margin so the tab background frames it cleanly). All vintage-CRT layers are clipped to the rounded rect.
- `public/icon-pwa.svg` — **standard PWA icon source** (192/512). Same look but **full-bleed** (no rounded corners in the SVG itself) so iOS / Android adaptive-icon containers can apply their own corner masks without doubling up.
- `public/icon-maskable.svg` — **maskable PWA icon source** (maskable-512). Full-bleed too, but the bars are inset to fit the maskable ~80% safe zone (left bar at x=20, middle at x=29.5, right at x=39, all 5px wide instead of 6).

The 192/512 PNGs come from `icon-pwa.svg`; the maskable PNG comes from `icon-maskable.svg`. No `-b` background flag is needed — the SVGs are already opaque.

Logo colors are **fixed** — none of the SVGs respond to `prefers-color-scheme`. PNGs are static and cannot adapt anyway. iOS additionally locks the home-screen icon at "Add to Home Screen" time, so even if the SVG could adapt, the installed PWA wouldn't switch.

Regenerate after editing any SVG:

```bash
rsvg-convert -w 192 -h 192 public/icon-pwa.svg       -o public/icons/192.png
rsvg-convert -w 512 -h 512 public/icon-pwa.svg       -o public/icons/512.png
rsvg-convert -w 512 -h 512 public/icon-maskable.svg  -o public/icons/maskable-512.png
```

Note: the rasterized PNGs are larger than typical (~30 KB / 130 KB / 130 KB) because the vintage texture has lots of fine pixel variation that PNG can't deduplicate. WebP would compress this kind of texture far better; revisit if total icon size matters.

Renderer caveats: `rsvg-convert` (librsvg) supports `feTurbulence`, `feGaussianBlur`, `feColorMatrix`, and `feMerge` used here. Browsers render full-spec SVG, so favicon.svg works the same in tabs.

Headless Chrome (Puppeteer) hangs on multi-gradient `page.screenshot` of these SVGs in this environment — `rsvg-convert` is the path that actually works. Install via `brew install librsvg` if missing.

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
- Desktop / mobile breakpoint: `768px`. Below that the drawer collapses to a bottom sheet (full-width, `var(--mobile-panel-height)` tall, draggable via top resize handle); above, the drawer is `var(--panel-width)` (380px) docked right.
- All tap targets ≥ 36px (most are 40+)
- `useWakeLock` keeps screen awake while the panel component is mounted (re-acquires on visibility change)
- iOS standalone meta tags set in `index.html`
- Tapping anywhere on the display canvas (`.display-root`) toggles the panel via `togglePanel()` in the store — there is **no** floating gear button. The canvas itself never shrinks; the panel simply layers on top of it (split = docked right/bottom, floating = positioned). Click-canvas-to-toggle is the universal preview gesture — works the same in any mode, any device. ESC and the panel header's `✕` button both call `closePanel()` for an explicit dismiss.

### Two-layer canvas: bg-layer + display-root

The display surface is split into two stacked full-viewport layers:

- `.bg-layer` — `position: fixed; inset: 0; z-index: 0; pointer-events: none`. Carries the background color (set inline in `App.tsx` from `bgColor` via `colorToCss`). Always full-bleed so the bg extends under the iPhone notch and reaches every physical edge, satisfying `viewport-fit=cover`.
- `.display-root` — `position: fixed; top: var(--sai-top); right: 0; bottom: 0; left: 0; z-index: 1`. Top is offset by the safe-area inset to clear the iPhone notch; bottom is `0` so the canvas reaches the physical bottom edge. iOS auto-hides the home indicator over a full-screen PWA, so we deliberately don't pad for it. `StaticDisplay` / `MarqueeDisplay` render transparent content inside this box and let `.bg-layer` show through.
- The settings panel is layered ON TOP of these two layers — clicking the canvas toggles the panel away to reveal the unobstructed full design. The canvas itself never shrinks; this avoids any aspect-ratio coupling between "design state" (panel open) and "viewing state" (panel closed).

#### iOS standalone PWA quirk: env() inside fixed elements

iOS Safari standalone mode sometimes resolves `env(safe-area-inset-*)` to `0` when read on a `position: fixed` element, even with `viewport-fit=cover` set. Workaround: resolve the four insets at `:root` and consume them via `var()` everywhere else.

```css
:root {
  --sai-top:    env(safe-area-inset-top, 0px);
  --sai-right:  env(safe-area-inset-right, 0px);
  --sai-bottom: env(safe-area-inset-bottom, 0px);
  --sai-left:   env(safe-area-inset-left, 0px);
}
.display-root, .settings-toggle, .drawer { /* uses var(--sai-*) */ }
```

`env()` resolves at `:root` consistently in iOS PWA mode; `var()` reads the already-resolved value at the point of use, so the fixed-element quirk doesn't bite. Always use `var(--sai-*)` in this codebase; never re-introduce `env(safe-area-inset-*)` directly on a fixed element.

The `margin` user setting (0–25 % of `--display-min`) still applies as **additional uniform** padding inside each display, layered on top of the safe-area-aware display-root. `--display-min` is published by a `ResizeObserver` on `.display-root` (= `min(.display-root.offsetWidth, .display-root.offsetHeight)`) so the margin tracks the shrunk canvas in split mode instead of the viewport. Earlier `vmin` units misbehaved here because `vmin` references the viewport, not the panel-aware container.

Reference: [Designing Websites for iPhone X (WebKit blog)](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) covers `viewport-fit=cover` and `env(safe-area-inset-*)`.

### Rotation wrapper sizing

`App.tsx` mounts the active display inside a wrapper that handles 0° / 90° / 180° / 270° rotation. The wrapper sizes itself to the **`.display-root` parent**, not the raw viewport, so the rotated content exactly fills the safe-area-aware canvas with no overflow. Since the canvas is panel-aware (shrinks in split mode), pre-rotation dimensions cannot be expressed in viewport units. Instead, a single `ResizeObserver` on `.display-root` publishes its current size as inline CSS vars (`--display-w`, `--display-h`, `--display-min`), and the rotation wrapper consumes them:

```ts
const rotated = rotation === 90 || rotation === 270;
const transformStyle = rotation === 0 ? undefined : {
  position: 'absolute',
  top: '50%', left: '50%',
  width:  rotated ? 'var(--display-h)' : 'var(--display-w)',
  height: rotated ? 'var(--display-w)' : 'var(--display-h)',
  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
  transformOrigin: 'center center',
};
```

When rotated 90°/270°, pre-rotation width = parent height and pre-rotation height = parent width; after rotation, those swap and the rotated visible bounds match the parent exactly. The same vars (`--display-min`) are reused by `StaticDisplay` / `MarqueeDisplay` for their edge-margin padding, so the margin proportions also track the shrunk canvas instead of the viewport.

**Don't reintroduce viewport-unit formulations:** `100dvh` / `100vw` / `vmin` reference the viewport, which diverges from `.display-root` whenever the split panel docks. Earlier we used `calc(100dvh - var(--sai-top))` for parent-height — that worked when `.display-root` was always full-bleed, but breaks once the canvas shrinks horizontally for the split panel. Always go through the `--display-*` vars now.

**Subtle gotcha — `height: 100%` does NOT give "parent width":** `100%` on the height property always resolves to the parent's *height*. When you want "parent width" on the height property, spell out the actual width — the `--display-w` var here.

## Deploy

`.github/workflows/deploy.yml` runs on push to `main`:
1. Checkout, setup Node 22, `npm ci`
2. `npm run typecheck` then `npm run build`
3. `actions/configure-pages` → `actions/upload-pages-artifact ./dist` → `actions/deploy-pages`

The repository's GitHub Pages is configured with `build_type=workflow`. Account-level custom domain `lab.howar31.com` resolves to `lab.howar31.com/hype-sign/`.

To fork to a different repo name: change `base` in `vite.config.ts` and `start_url`/`scope` in the PWA manifest there.

## README screenshots / hero gif

`scripts/capture-screenshots.cjs` is a self-contained Puppeteer driver that produces every image in `docs/screenshots/`:

- `hero.gif` — 720×360 marquee at 15fps (3s loop), encoded via ffmpeg two-pass palette (`palettegen` + `paletteuse=dither=bayer:bayer_scale=5`). Source frames captured via CDP `Page.startScreencast` at `everyNthFrame: 2` (~30fps native), then downsampled at encode time to keep file size under 1.5 MB.
- 7 PNGs: `static-hero`, `cheer-board`, `drawer-gradient`, `drawer-presets`, `mobile-portrait`, `drawer-zh`, `drawer-en` (the last two are paired side-by-side in README to show i18n parity without needing image-compositing tools at build time).

Pipeline:
1. Spawn vite dev server (`npx vite --port 5173 --strictPort`), wait for `Local:` log.
2. Per scene: open a fresh `puppeteer.newPage()`, register `evaluateOnNewDocument` that writes `localStorage['hype-sign:v1'] = { state, version: 2 }` so zustand's persist middleware rehydrates from it on first load.
3. `goto` + `waitForSelector('.display-root')` + 600ms settle (lets `StaticDisplay`'s `useLayoutEffect` getBBox run).
4. For drawer-open scenes: programmatically click `button.settings-toggle`, wait 450ms for the slide animation, click the target tab in `.drawer-tabs`. Then inject CSS to hide the toggle (so it doesn't appear in the screenshot). For canvas-only scenes: hide both `.settings-toggle` AND closed `.drawer` / `.drawer-backdrop` to avoid faint translucent edge artifacts.
5. `page.screenshot({ path, type: 'png' })`.

Hero capture uses CDP screencast (not a `screenshot()` loop) because Puppeteer's screenshot is sync-blocking per call and would yield irregular frame intervals; screencast streams at native rAF cadence.

`--only=<id>[,<id>...]` recaptures a subset. The script is idempotent — overwrites existing files.

Requires Node 18 (Puppeteer is installed globally there per `~/.claude/skills/browser-automation`). Run with `NODE_PATH=$(npm root -g) node scripts/capture-screenshots.cjs`.

iOS PWA standalone-mode layout (notch / safe-area / home-indicator) **cannot** be reproduced via Puppeteer; these screenshots are headless-Chrome desktop renders and intentionally don't cover device-specific quirks. Real-device captures, if ever needed, are out-of-band manual screenshots.

## Things to be careful about when extending

- **Persisted state**: any new setting must be added to `partialize` in the store, otherwise it won't survive reload.
- **Migration**: any breaking change to a persisted shape must bump `version` and add a `migrate` step (see the v1 → v2 preset split for the pattern).
- **i18n**: every new user-visible string needs a key in both ZH and EN dicts.
- **Color editor**: when adding a new gradient type, update `ColorValue` union + `colorToCss` + `colorToSvg.GradientDef` + `ColorEditor.selectType` + `ColorEditor.deriveSnapshots` + `ColorTypeIcon` glyph + i18n `color.type.*` labels.
- **Color editor snapshots**: `ColorEditor` keeps per-type local snapshots so users don't lose their angle / cx-cy / stops when switching solid↔linear↔radial. The parent (`TextColorSection` / `BackgroundColorSection`) owns a `resetCounter` whose value is passed as React `key`; bumping it remounts the editor and re-derives all three snapshots from the freshly reset value.
- **All-mounted tabs**: `SettingsPanel` renders every tab's section unconditionally and toggles visibility via the `hidden` attribute. This is what makes ColorEditor snapshots, preset name inputs, and other local UI state survive tab switches. Don't fall back to `tab === 'x' && <Section />`.
- **getBBox in StaticDisplay**: the `useLayoutEffect` dep array includes `text`, `fontSize`, `lineHeight`, `lines.length` — if you add new factors that affect rendering, include them too or measurements go stale.
- **Don't reintroduce `dominant-baseline="hanging"`** — it clips on iOS Safari in landscape.
- **Don't add `inset` left-edge `box-shadow` to `.drawer`** — iOS Safari leaks it through the `box-shadow: none` mobile media-query override, leaving a visible 1px white line on the left edge of the drawer. If you need a desktop edge highlight, use `border-left` (it's already removed cleanly on mobile).
- **Linear gradient angle in SVG** must use the `dx = sin(θ), dy = -cos(θ)` convention so that tint (SVG-rendered) and backdrop (CSS-rendered) look identical at the same angle. The earlier `(angle - 90)` formulation was off by 180° — don't reintroduce it.
