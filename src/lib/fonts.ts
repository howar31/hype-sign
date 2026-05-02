// Font model — a single source of truth for the font picker. Each entry
// describes what to feed CSS `font-family` plus the wght axis range so the
// FontWeightSlider can clamp out-of-range values when switching fonts.
//
// Bundled fonts (`bundled: true`) ship as WOFF2 in public/fonts/ and are
// declared in global.css via @font-face. System fonts fall back through
// platform stacks and incur no download cost.

export type FontId =
  | 'system-sans'
  | 'system-mono'
  | 'noto-tc'
  | 'noto-serif-tc'
  | 'lxgw-wenkai-tc'
  | 'atkinson';

export type FontDef = {
  id: FontId;
  labelKey: string;
  family: string;
  /** Inclusive wght axis range. Used to clamp FontWeightSlider. */
  weightRange: { min: number; max: number };
  bundled: boolean;
};

/** Sample lines composed by FontPicker. The first line follows the
 *  active UI language (zh-TW shows the Tang couplet, en shows a short
 *  product-branded phrase); the unambiguous-character line is always
 *  shown. A picker-local toggle can additionally render the OTHER
 *  language's line for side-by-side comparison.
 *
 *  The unambiguous line stresses pairs the user explicitly wants to
 *  compare across faces (0/O/o, 1/I/l, 2/Z, 5/S, 8/B, 6/9 with
 *  descenders, m/r/n, u/v). */
export const FONT_SAMPLE_LINES = {
  'zh-TW': '南去經三國，東來過五湖',
  en: 'Hype Sign Font Example',
  diff: '0Oo 1Il 2Z 5S 8B 9gq mrn uv',
} as const;

export const FONTS: Record<FontId, FontDef> = {
  'noto-tc': {
    id: 'noto-tc',
    labelKey: 'font.notoTc',
    family:
      "'NotoSansTC', system-ui, 'PingFang TC', 'Microsoft JhengHei', 'Noto Sans CJK TC', sans-serif",
    weightRange: { min: 100, max: 900 },
    bundled: true,
  },
  'noto-serif-tc': {
    id: 'noto-serif-tc',
    labelKey: 'font.notoSerifTc',
    family:
      "'NotoSerifTC', system-ui, 'Songti TC', 'PMingLiU', serif",
    weightRange: { min: 200, max: 900 },
    bundled: true,
  },
  'lxgw-wenkai-tc': {
    id: 'lxgw-wenkai-tc',
    labelKey: 'font.lxgwWenkaiTc',
    family:
      "'LxgwWenKaiTC', 'BiauKai', 'DFKai-SB', 'PingFang TC', 'Microsoft JhengHei', sans-serif",
    weightRange: { min: 300, max: 500 },
    bundled: true,
  },
  atkinson: {
    id: 'atkinson',
    labelKey: 'font.atkinson',
    family: "'AtkinsonHyperlegibleNext', system-ui, sans-serif",
    weightRange: { min: 200, max: 800 },
    bundled: true,
  },
  'system-sans': {
    id: 'system-sans',
    labelKey: 'font.systemSans',
    family:
      "system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', 'Noto Sans CJK TC', sans-serif",
    weightRange: { min: 100, max: 900 },
    bundled: false,
  },
  'system-mono': {
    id: 'system-mono',
    labelKey: 'font.systemMono',
    family:
      "ui-monospace, 'SF Mono', 'Cascadia Mono', 'Roboto Mono', Menlo, Consolas, monospace",
    weightRange: { min: 100, max: 700 },
    bundled: false,
  },
};

// Picker render order. Bundled CJK + Latin faces first, then the system
// fallbacks. FontPicker renders a horizontal divider at the bundled →
// system boundary so the curated set reads as a discrete group.
export const FONT_ORDER: FontId[] = [
  'noto-tc',
  'noto-serif-tc',
  'lxgw-wenkai-tc',
  'atkinson',
  'system-sans',
  'system-mono',
];

export const DEFAULT_FONT: FontId = 'noto-tc';

export function getFontFamily(id: FontId): string {
  return (FONTS[id] ?? FONTS[DEFAULT_FONT]).family;
}

/** Snap a weight value to the nearest 100 within the font's supported range. */
export function clampWeightForFont(id: FontId, weight: number): number {
  const { min, max } = (FONTS[id] ?? FONTS[DEFAULT_FONT]).weightRange;
  const snapped = Math.round(weight / 100) * 100;
  return Math.max(min, Math.min(max, snapped));
}

export function isValidFontId(value: unknown): value is FontId {
  return typeof value === 'string' && value in FONTS;
}
