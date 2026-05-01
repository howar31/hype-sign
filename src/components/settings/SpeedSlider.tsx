import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';
import { MAX_SPEED, MIN_SPEED } from '../../types';

export function SpeedSlider() {
  const speed = useSettings((s) => s.marqueeSpeed);
  const setSpeed = useSettings((s) => s.setMarqueeSpeed);
  const t = useT();

  return (
    <div className="section">
      <div className="row-spread">
        <span className="section-label">{t('speed.label')}</span>
        <span className="value-pill">
          {speed} {t('speed.unit')}
        </span>
      </div>
      <input
        type="range"
        className="range"
        min={MIN_SPEED}
        max={MAX_SPEED}
        step={10}
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
