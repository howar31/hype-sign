import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../../store/settingsStore';
import { colorToCss } from '../../lib/colorToCss';
import { GradientDef, fillFor } from '../../lib/colorToSvg';
import {
  FONT_FAMILY,
  FONT_WEIGHT,
  LINE_HEIGHT_FACTOR,
  REFERENCE_FONT_SIZE,
  measureLineWidth,
} from '../../lib/measureText';

// Where to place the alphabetic baseline of the first line within its slot.
// We avoid dominant-baseline="hanging" because Safari clips text above
// viewBox y=0 when the SVG is height-limited (iPhone in landscape).
const BASELINE_RATIO = 0.85;

type BBox = { x: number; y: number; w: number; h: number };

export function StaticDisplay() {
  const text = useSettings((s) => s.text);
  const textColor = useSettings((s) => s.textColor);
  const bgColor = useSettings((s) => s.bgColor);

  const reactId = useId();
  const gradId = `text-grad-${reactId.replace(/:/g, '')}`;
  const fill = fillFor(textColor, gradId);
  const bg = colorToCss(bgColor);

  const lines = useMemo(() => {
    const split = text.split('\n');
    while (split.length > 1 && split[split.length - 1] === '') split.pop();
    return split.length === 0 ? [''] : split;
  }, [text]);

  const fontSize = REFERENCE_FONT_SIZE;
  const lineHeight = fontSize * LINE_HEIGHT_FACTOR;

  const widths = useMemo(
    () => lines.map((l) => measureLineWidth(l, fontSize)),
    [lines, fontSize],
  );
  const estMaxWidth = Math.max(1, ...widths);
  const estTotalHeight = Math.max(1, lines.length * lineHeight);

  // Initial viewBox is a font-metric estimate; refined below via getBBox so
  // the viewBox exactly fits the rendered glyphs (perfect centering).
  const [bbox, setBbox] = useState<BBox>({
    x: -estMaxWidth / 2,
    y: 0,
    w: estMaxWidth,
    h: estTotalHeight,
  });

  const textRef = useRef<SVGTextElement>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    let b: DOMRect;
    try {
      b = el.getBBox();
    } catch {
      return;
    }
    if (b.width <= 0 || b.height <= 0) return;
    setBbox((prev) => {
      const next = { x: b.x, y: b.y, w: b.width, h: b.height };
      // Avoid spurious updates when measurements are stable.
      if (
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5 &&
        Math.abs(prev.w - next.w) < 0.5 &&
        Math.abs(prev.h - next.h) < 0.5
      ) {
        return prev;
      }
      return next;
    });
  }, [text, fontSize, lineHeight, lines.length]);

  const isEmpty = lines.every((l) => l.trim() === '');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
      }}
    >
      {isEmpty ? null : (
        <svg
          width="100%"
          height="100%"
          viewBox={`${bbox.x} ${bbox.y} ${bbox.w} ${bbox.h}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
        >
          <defs>
            <GradientDef color={textColor} id={gradId} />
          </defs>
          <text
            ref={textRef}
            x={0}
            fontFamily={FONT_FAMILY}
            fontWeight={FONT_WEIGHT}
            fontSize={fontSize}
            fill={fill}
            textAnchor="middle"
          >
            {lines.map((line, i) => (
              <tspan
                key={i}
                x={0}
                dy={i === 0 ? fontSize * BASELINE_RATIO : lineHeight}
              >
                {line === '' ? ' ' : line}
              </tspan>
            ))}
          </text>
        </svg>
      )}
    </div>
  );
}
