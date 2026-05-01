import { useEffect, useId, useMemo, useRef } from 'react';
import { useSettings } from '../../store/settingsStore';
import { colorToCss } from '../../lib/colorToCss';
import { GradientDef, fillFor } from '../../lib/colorToSvg';
import {
  FONT_FAMILY,
  LINE_HEIGHT_FACTOR,
  REFERENCE_FONT_SIZE,
  measureLineWidth,
} from '../../lib/measureText';
import { useElementSize } from '../../hooks/useElementSize';

export function MarqueeDisplay() {
  const text = useSettings((s) => s.text);
  const speed = useSettings((s) => s.marqueeSpeed);
  const textColor = useSettings((s) => s.textColor);
  const bgColor = useSettings((s) => s.bgColor);
  const margin = useSettings((s) => s.margin);
  const fontWeight = useSettings((s) => s.fontWeight);

  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const innerRef = useRef<HTMLDivElement | null>(null);

  const reactId = useId();
  const gradId = `marq-grad-${reactId.replace(/:/g, '')}`;
  const fill = fillFor(textColor, gradId);
  const bg = colorToCss(bgColor);

  const joined = useMemo(
    () => text.split('\n').map((s) => s.trim()).filter(Boolean).join(' '),
    [text],
  );

  const fontSize = REFERENCE_FONT_SIZE;
  const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
  const textWidth = useMemo(
    () => measureLineWidth(joined, fontSize, fontWeight),
    [joined, fontSize, fontWeight],
  );

  const scale = size.h > 0 ? size.h / lineHeight : 1;
  const scaledWidth = Math.max(1, textWidth * scale);

  // Animation loop
  useEffect(() => {
    const el = innerRef.current;
    if (!el || size.w === 0 || size.h === 0 || !joined) return;

    let raf = 0;
    let last = performance.now();
    let x = size.w; // start fully off-screen to the right

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      x -= speed * dt;
      if (x + scaledWidth < 0) {
        x = size.w;
      }
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed, scaledWidth, size.w, size.h, joined]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        padding: `${margin}vmin`,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {joined ? (
          <div
            ref={innerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: scaledWidth,
              height: size.h,
              willChange: 'transform',
            }}
          >
            <svg
              width={scaledWidth}
              height={size.h}
              viewBox={`0 0 ${Math.max(1, textWidth)} ${lineHeight}`}
              preserveAspectRatio="none"
              style={{ display: 'block' }}
            >
              <defs>
                <GradientDef color={textColor} id={gradId} />
              </defs>
              <text
                x={0}
                y={lineHeight * 0.85}
                fontFamily={FONT_FAMILY}
                fontWeight={fontWeight}
                fontSize={fontSize}
                fill={fill}
              >
                {joined}
              </text>
            </svg>
          </div>
        ) : null}
      </div>
    </div>
  );
}
