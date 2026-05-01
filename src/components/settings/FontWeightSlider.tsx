import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';
import { FONT_WEIGHT_STEP, MAX_FONT_WEIGHT, MIN_FONT_WEIGHT } from '../../types';

export function FontWeightSlider() {
  const fontWeight = useSettings((s) => s.fontWeight);
  const setFontWeight = useSettings((s) => s.setFontWeight);
  const t = useT();

  return (
    <div className="section">
      <div className="row-spread">
        <span className="section-label">{t('weight.label')}</span>
        <span className="value-pill">{fontWeight}</span>
      </div>
      <div className="slider-with-note">
        <input
          type="range"
          className="range"
          min={MIN_FONT_WEIGHT}
          max={MAX_FONT_WEIGHT}
          step={FONT_WEIGHT_STEP}
          value={fontWeight}
          onChange={(e) => setFontWeight(Number(e.target.value))}
        />
        <span className="muted">{t('weight.note')}</span>
      </div>
    </div>
  );
}
