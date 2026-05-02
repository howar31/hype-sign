import { DEFAULT_FONT, getFontFamily } from './fonts';

// Default font stack used when no FontId is supplied (e.g. early renders
// before the store has hydrated). Display components always pass the
// active font's family explicitly; this constant exists so global.css and
// canvas measurement share the same fallback value.
export const FONT_FAMILY = getFontFamily(DEFAULT_FONT);

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
  fontFamily: string = FONT_FAMILY,
): number {
  const ctx = getCtx();
  if (!ctx) return text.length * fontSize * 0.6; // rough fallback for SSR
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text || ' ').width;
}
