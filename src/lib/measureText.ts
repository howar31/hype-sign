// Single source of truth for the display font stack. Both canvas
// measurement (here) and CSS body text (via the --font-family custom
// property set in main.tsx) reference this string so they cannot drift.
export const FONT_FAMILY =
  "system-ui, -apple-system, 'Segoe UI', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif";

export const REFERENCE_FONT_SIZE = 100;
export const LINE_HEIGHT_FACTOR = 1.15;

/** Default font-weight when the store hasn't been hydrated yet (e.g. SSR). */
export const DEFAULT_FONT_WEIGHT = 800;

let cachedCtx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D | null {
  if (cachedCtx) return cachedCtx;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  cachedCtx = canvas.getContext('2d');
  return cachedCtx;
}

export function measureLineWidth(
  text: string,
  fontSize = REFERENCE_FONT_SIZE,
  fontWeight: number = DEFAULT_FONT_WEIGHT,
): number {
  const ctx = getCtx();
  if (!ctx) return text.length * fontSize * 0.6; // rough fallback for SSR
  ctx.font = `${fontWeight} ${fontSize}px ${FONT_FAMILY}`;
  return ctx.measureText(text || ' ').width;
}
