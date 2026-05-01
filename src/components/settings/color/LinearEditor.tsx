import { useT } from '../../../lib/i18n';
import type { ColorStop, LinearGradient } from '../../../types';
import { StopList } from './StopList';

type Props = {
  value: LinearGradient;
  onChange: (value: LinearGradient) => void;
};

export function LinearEditor({ value, onChange }: Props) {
  const t = useT();

  function setStops(stops: ColorStop[]) {
    onChange({ ...value, stops });
  }

  function setAngle(angle: number) {
    const wrapped = ((angle % 360) + 360) % 360;
    onChange({ ...value, angle: wrapped });
  }

  return (
    <div className="section" style={{ gap: 12 }}>
      <div className="section">
        <div className="row-spread">
          <span className="section-label">{t('gradient.angle')}</span>
          <span className="value-pill">{value.angle}°</span>
        </div>
        <input
          type="range"
          className="range"
          min={0}
          max={360}
          step={1}
          value={value.angle}
          onChange={(e) => setAngle(Number(e.target.value))}
        />
      </div>

      <StopList stops={value.stops} onChange={setStops} />
    </div>
  );
}
