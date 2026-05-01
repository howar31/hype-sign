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
    // Match CSS convention: 0deg points up, increases clockwise. The
    // gradient line runs along that direction; the first stop sits at
    // the start (opposite the direction) and the last stop at the end.
    //
    // Direction vector in y-down coords (same as SVG / CSS pixel space):
    //   dx = sin(θ), dy = -cos(θ)
    //   θ=0   → ( 0, -1)  up        (start at bottom, end at top)
    //   θ=90  → ( 1,  0)  right
    //   θ=180 → ( 0,  1)  down
    //   θ=270 → (-1,  0)  left
    //
    // With objectBoundingBox, (0,0)=top-left, (1,1)=bottom-right. We
    // center the line at (0.5, 0.5) and project ±0.5 along the direction.
    const rad = (color.angle * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const x1 = 0.5 - dx * 0.5;
    const y1 = 0.5 - dy * 0.5;
    const x2 = 0.5 + dx * 0.5;
    const y2 = 0.5 + dy * 0.5;

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
