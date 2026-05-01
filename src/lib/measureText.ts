let cachedCtx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D | null {
  if (cachedCtx) return cachedCtx;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  cachedCtx = canvas.getContext('2d');
  return cachedCtx;
}

const DEFAULT_FONT_FAMILY =
  "system-ui, -apple-system, 'Segoe UI', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif";

export const FONT_FAMILY = DEFAULT_FONT_FAMILY;
export const FONT_WEIGHT = 800;
export const REFERENCE_FONT_SIZE = 100;
export const LINE_HEIGHT_FACTOR = 1.15;

export function measureLineWidth(text: string, fontSize = REFERENCE_FONT_SIZE): number {
  const ctx = getCtx();
  if (!ctx) return text.length * fontSize * 0.6; // rough fallback for SSR
  ctx.font = `${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
  return ctx.measureText(text || ' ').width;
}
