import { useRef } from 'react';
import { colorToCss } from '../../../lib/colorToCss';
import { useT } from '../../../lib/i18n';
import type { ColorStop, RadialGradient } from '../../../types';
import { StopList } from './StopList';

type Props = {
  value: RadialGradient;
  onChange: (value: RadialGradient) => void;
};

export function RadialEditor({ value, onChange }: Props) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const t = useT();

  function setStops(stops: ColorStop[]) {
    onChange({ ...value, stops });
  }

  function pickFromEvent(e: PointerEvent | React.PointerEvent<HTMLDivElement>) {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    onChange({ ...value, cx: clamp(cx), cy: clamp(cy) });
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    pickFromEvent(e);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons === 0) return;
    pickFromEvent(e);
  }

  return (
    <div className="section" style={{ gap: 12 }}>
      <div className="section">
        <div className="row-spread">
          <span className="section-label">{t('gradient.center')}</span>
          <span className="value-pill">
            {Math.round(value.cx)}%, {Math.round(value.cy)}%
          </span>
        </div>
        <div
          ref={padRef}
          className="radial-pad"
          style={{ background: colorToCss(value) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          role="application"
          aria-label={t('gradient.center')}
        >
          <div
            className="radial-pad-handle"
            style={{ left: `${value.cx}%`, top: `${value.cy}%` }}
          />
        </div>
      </div>

      <StopList stops={value.stops} onChange={setStops} previewCss={colorToCss(value)} />
    </div>
  );
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}
