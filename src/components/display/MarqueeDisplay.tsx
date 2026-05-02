import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../../store/settingsStore';
import { GradientDef, fillFor } from '../../lib/colorToSvg';
import {
  LINE_HEIGHT_FACTOR,
  REFERENCE_FONT_SIZE,
  measureLineWidth,
} from '../../lib/measureText';
import { getFontFamily } from '../../lib/fonts';
import { useFontReady } from '../../lib/useFontReady';
import { useElementSize } from '../../hooks/useElementSize';

type InkBox = { x: number; y: number; w: number; h: number };

export function MarqueeDisplay() {
  const text = useSettings((s) => s.text);
  const speed = useSettings((s) => s.marqueeSpeed);
  const textColor = useSettings((s) => s.textColor);
  const margin = useSettings((s) => s.margin);
  const fontWeight = useSettings((s) => s.fontWeight);
  const fontId = useSettings((s) => s.font);
  const fontFamily = getFontFamily(fontId);
  const fontReady = useFontReady(fontFamily, text || '應', fontWeight);

  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const innerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<SVGTextElement | null>(null);

  const reactId = useId();
  const gradId = `marq-grad-${reactId.replace(/:/g, '')}`;
  const fill = fillFor(textColor, gradId);

  const joined = useMemo(
    () => text.split('\n').map((s) => s.trim()).filter(Boolean).join(' '),
    [text],
  );

  const fontSize = REFERENCE_FONT_SIZE;
  const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
  const textWidth = useMemo(
    () => measureLineWidth(joined, fontSize, fontWeight, fontFamily),
    // fontReady triggers re-measure after web fonts finish loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [joined, fontSize, fontWeight, fontFamily, fontReady],
  );

  // Measure the actual ink bounding box so the SVG viewBox tightly fits
  // the rendered glyphs (instead of `0 0 textWidth lineHeight`, where ink
  // was vertically biased toward the bottom and left a ~18%-of-height empty
  // strip at the top — which becomes a visibly asymmetric right-side gap
  // after a 90° rotation). Initial estimate uses font metrics; getBBox
  // refines it after layout.
  const [inkBox, setInkBox] = useState<InkBox>({
    x: 0,
    y: 0,
    w: Math.max(1, textWidth),
    h: lineHeight,
  });

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
    setInkBox((prev) => {
      const next = { x: b.x, y: b.y, w: b.width, h: b.height };
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
  }, [joined, fontSize, fontWeight, textWidth, fontFamily, fontReady]);

  // Round size + scaledWidth to integers. Fractional CSS dims (esp. on a
  // rotated parent) cause iOS Safari's GPU compositor to anti-alias edges
  // that don't line up with adjacent layers, which manifests as visible
  // off-center drift in the marquee even when the math says it should be
  // symmetric.
  const sizeW = Math.round(size.w);
  const sizeH = Math.round(size.h);
  // Scale by ink height (the actual rendered glyph height) so the ink
  // exactly fills the container vertically. Scaling by lineHeight (which
  // includes leading) left blank space above the ink.
  const scale = sizeH > 0 && inkBox.h > 0 ? sizeH / inkBox.h : 1;
  const scaledWidth = Math.max(1, Math.round(inkBox.w * scale));

  // Animation loop
  useEffect(() => {
    const el = innerRef.current;
    if (!el || sizeW === 0 || sizeH === 0 || !joined) return;

    let raf = 0;
    let last = performance.now();
    let x = sizeW; // start fully off-screen to the right

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      x -= speed * dt;
      if (x + scaledWidth < 0) {
        x = sizeW;
      }
      // Round the translate value as well — sub-pixel transforms compose
      // unpredictably with the rotated parent on iOS.
      el.style.transform = `translate3d(${Math.round(x)}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed, scaledWidth, sizeW, sizeH, joined]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: `calc(var(--display-min, 100vmin) * ${margin / 100})`,
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
              // Use CSS 100% instead of the JS-measured size.h so the
              // inner div fills the container vertically without any
              // sub-pixel mismatch between measured value and actual
              // rendered height (the latter is what iOS Safari uses to
              // composite the rotated parent's layer).
              height: '100%',
              willChange: 'transform',
            }}
          >
            <svg
              width={scaledWidth}
              height="100%"
              viewBox={`${inkBox.x} ${inkBox.y} ${inkBox.w} ${inkBox.h}`}
              preserveAspectRatio="none"
              style={{ display: 'block' }}
            >
              <defs>
                <GradientDef color={textColor} id={gradId} />
              </defs>
              <text
                ref={textRef}
                x={0}
                y={lineHeight * 0.85}
                fontFamily={fontFamily}
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
