import { useId, useMemo } from 'react';
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
    // Trim trailing empty lines but keep interior blank lines as visible spacing.
    while (split.length > 1 && split[split.length - 1] === '') split.pop();
    return split.length === 0 ? [''] : split;
  }, [text]);

  const fontSize = REFERENCE_FONT_SIZE;
  const lineHeight = fontSize * LINE_HEIGHT_FACTOR;

  const widths = useMemo(() => lines.map((l) => measureLineWidth(l, fontSize)), [lines, fontSize]);
  const maxWidth = Math.max(1, ...widths);
  const totalHeight = Math.max(1, lines.length * lineHeight);

  // viewBox: x centered around 0, y from 0 to totalHeight.
  const vbX = -maxWidth / 2;
  const vbW = maxWidth;
  const vbY = 0;
  const vbH = totalHeight;

  const isEmpty = lines.every((l) => l.trim() === '');

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      {isEmpty ? null : (
        <svg
          width="100%"
          height="100%"
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
        >
          <defs>
            <GradientDef color={textColor} id={gradId} />
          </defs>
          <g
            fontFamily={FONT_FAMILY}
            fontWeight={FONT_WEIGHT}
            fontSize={fontSize}
            fill={fill}
            textAnchor="middle"
            dominantBaseline="hanging"
          >
            {lines.map((line, i) => (
              <text key={i} x={0} y={i * lineHeight}>
                {line || ' '}
              </text>
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}
