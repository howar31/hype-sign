import type { ColorStop, ColorValue } from '../types';

function sortedStops(stops: ColorStop[]): ColorStop[] {
  return [...stops].sort((a, b) => a.position - b.position);
}

function stopsToCss(stops: ColorStop[]): string {
  return sortedStops(stops)
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ');
}

export function colorToCss(c: ColorValue): string {
  switch (c.type) {
    case 'solid':
      return c.color;
    case 'linear':
      return `linear-gradient(${c.angle}deg, ${stopsToCss(c.stops)})`;
    case 'radial':
      return `radial-gradient(circle at ${c.cx}% ${c.cy}%, ${stopsToCss(c.stops)})`;
  }
}

/**
 * Returns a representative single color for a ColorValue (used in tiny preset
 * preview swatches where rendering a real gradient is overkill).
 */
export function representativeColor(c: ColorValue): string {
  if (c.type === 'solid') return c.color;
  return c.stops[0]?.color ?? '#000000';
}
