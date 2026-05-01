import { useT } from '../../../lib/i18n';
import { makeId, type ColorStop } from '../../../types';
import { ConfirmButton } from '../../ui/ConfirmButton';

type Props = {
  stops: ColorStop[];
  onChange: (stops: ColorStop[]) => void;
};

const MIN_STOPS = 2;

/**
 * Build a left-to-right preview gradient from the stops, ignoring the
 * parent color's angle (linear) or center (radial). The stop markers are
 * positioned by `left: position%`, so the bar must use the same axis or
 * the colors and markers won't line up — that mismatch was the source of
 * an "abnormal color appears on the wrong side" bug when the user picked
 * a non-90° linear angle or moved the radial center.
 */
function previewBar(stops: ColorStop[]): string {
  if (stops.length === 0) return 'transparent';
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  if (sorted.length === 1) return sorted[0].color;
  return `linear-gradient(to right, ${sorted.map((s) => `${s.color} ${s.position}%`).join(', ')})`;
}

export function StopList({ stops, onChange }: Props) {
  const t = useT();
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const previewCss = previewBar(stops);

  function updateStop(id: string, patch: Partial<ColorStop>) {
    onChange(stops.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStop(id: string) {
    if (stops.length <= MIN_STOPS) return;
    onChange(stops.filter((s) => s.id !== id));
  }

  function addStop() {
    // Insert at the largest gap between adjacent stops.
    let bestPos = 50;
    let bestColor = '#888888';
    if (sorted.length >= 2) {
      let bestGap = -1;
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];
        const gap = b.position - a.position;
        if (gap > bestGap) {
          bestGap = gap;
          bestPos = (a.position + b.position) / 2;
          bestColor = a.color;
        }
      }
    }
    onChange([...stops, { id: makeId(), color: bestColor, position: Math.round(bestPos) }]);
  }

  return (
    <div className="section" style={{ gap: 6 }}>
      <div className="row-spread">
        <span className="section-label">{t('gradient.stops')}</span>
        <button type="button" className="btn" style={{ height: 30, fontSize: 12 }} onClick={addStop}>
          {t('gradient.add')}
        </button>
      </div>

      <div className="stop-bar" style={{ background: previewCss }}>
        {sorted.map((s) => (
          <div key={s.id} className="stop-bar-marker" style={{ left: `${s.position}%` }} />
        ))}
      </div>

      {sorted.map((s) => (
        <div className="stop-row" key={s.id}>
          <label className="swatch" style={{ background: s.color }}>
            <input
              type="color"
              value={s.color}
              onChange={(e) => updateStop(s.id, { color: e.target.value })}
            />
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={s.position}
            onChange={(e) => updateStop(s.id, { position: Number(e.target.value) })}
          />
          <input
            type="number"
            className="pos-input"
            min={0}
            max={100}
            value={s.position}
            onChange={(e) => {
              const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
              updateStop(s.id, { position: v });
            }}
          />
          <ConfirmButton
            confirmLabel="?"
            onConfirm={() => removeStop(s.id)}
            disabled={stops.length <= MIN_STOPS}
            className="icon"
            style={{ height: 32, width: 32 }}
            ariaLabel={t('gradient.remove')}
          >
            ✕
          </ConfirmButton>
        </div>
      ))}
    </div>
  );
}
