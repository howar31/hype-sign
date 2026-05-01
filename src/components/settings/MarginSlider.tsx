import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';
import { MAX_MARGIN, MIN_MARGIN } from '../../types';

export function MarginSlider() {
  const margin = useSettings((s) => s.margin);
  const setMargin = useSettings((s) => s.setMargin);
  const t = useT();

  return (
    <div className="section">
      <div className="row-spread">
        <span className="section-label">{t('margin.label')}</span>
        <span className="value-pill">
          {margin}
          {t('margin.unit')}
        </span>
      </div>
      <input
        type="range"
        className="range"
        min={MIN_MARGIN}
        max={MAX_MARGIN}
        step={1}
        value={margin}
        onChange={(e) => setMargin(Number(e.target.value))}
      />
    </div>
  );
}
