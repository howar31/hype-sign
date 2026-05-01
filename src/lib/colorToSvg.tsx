import type { ColorStop, ColorValue } from '../types';

function sortedStops(stops: ColorStop[]): ColorStop[] {
  return [...stops].sort((a, b) => a.position - b.position);
}

type Props = {
  /** ColorValue to render. */
  color: ColorValue;
  /** Unique id used in url(#...) reference. */
  id: string;
};

/**
 * Renders an SVG `<defs>` fragment for the given color. For solid colors, no
 * defs are produced — the caller should fall back to using `color.color` as
 * the fill directly.
 *
 * For gradients we use `gradientUnits="objectBoundingBox"` so the gradient
 * spans the actual text bounds (each glyph filled with the same gradient
 * mapped over its bbox), which is what users expect.
 */
export function GradientDef({ color, id }: Props) {
  if (color.type === 'solid') return null;

  if (color.type === 'linear') {
    // Convert CSS angle (0deg = up, increases clockwise) into SVG x1/y1/x2/y2
    // on a unit square. SVG y increases downward, but objectBoundingBox treats
    // (0,0) as top-left, which matches CSS gradient orientation when we
    // compute the unit vector below.
    const rad = ((color.angle - 90) * Math.PI) / 180; // 0deg should point up
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    // Center the gradient line at (0.5, 0.5) and project ±0.5 along (dx, dy)
    // so that angle=0 gives bottom→top, matching CSS.
    const x1 = 0.5 - dx * 0.5;
    const y1 = 0.5 + dy * 0.5;
    const x2 = 0.5 + dx * 0.5;
    const y2 = 0.5 - dy * 0.5;

    return (
      <linearGradient
        id={id}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        gradientUnits="objectBoundingBox"
      >
        {sortedStops(color.stops).map((s) => (
          <stop key={s.id} offset={`${s.position}%`} stopColor={s.color} />
        ))}
      </linearGradient>
    );
  }

  // radial
  return (
    <radialGradient
      id={id}
      cx={color.cx / 100}
      cy={color.cy / 100}
      r={0.5}
      fx={color.cx / 100}
      fy={color.cy / 100}
      gradientUnits="objectBoundingBox"
    >
      {sortedStops(color.stops).map((s) => (
        <stop key={s.id} offset={`${s.position}%`} stopColor={s.color} />
      ))}
    </radialGradient>
  );
}

export function fillFor(color: ColorValue, gradientId: string): string {
  return color.type === 'solid' ? color.color : `url(#${gradientId})`;
}
