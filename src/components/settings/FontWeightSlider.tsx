import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';
import { FONT_WEIGHT_STEP } from '../../types';
import { FONTS } from '../../lib/fonts';

export function FontWeightSlider() {
  const fontWeight = useSettings((s) => s.fontWeight);
  const setFontWeight = useSettings((s) => s.setFontWeight);
  const fontId = useSettings((s) => s.font);
  const t = useT();

  // Clamp slider bounds to the current font's wght axis range so dragging
  // past the font's max snaps back instead of producing a silently mismatched
  // synthetic-bold render.
  const { min, max } = FONTS[fontId].weightRange;

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
          min={min}
          max={max}
          step={FONT_WEIGHT_STEP}
          value={fontWeight}
          onChange={(e) => setFontWeight(Number(e.target.value))}
        />
        <span className="muted">{t('weight.note')}</span>
      </div>
    </div>
  );
}
