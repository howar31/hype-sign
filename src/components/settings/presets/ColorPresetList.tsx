import { useSettings } from '../../../store/settingsStore';
import { useT } from '../../../lib/i18n';
import { PresetItem } from './PresetItem';

type Props = {
  /**
   * Where to apply a preset when the user taps "Apply" on a row. The
   * Tint tab passes 'text', Backdrop passes 'bg'. Both tabs share the
   * same preset list.
   */
  applyTo: 'text' | 'bg';
};

export function ColorPresetList({ applyTo }: Props) {
  const presets = useSettings((s) => s.presets);
  const applyToText = useSettings((s) => s.applyPresetToText);
  const applyToBg = useSettings((s) => s.applyPresetToBg);
  const deletePreset = useSettings((s) => s.deletePreset);
  const t = useT();

  const handleApply = applyTo === 'text' ? applyToText : applyToBg;

  return (
    <div className="section">
      <span className="section-label">{t('colorPreset.list')}</span>
      {presets.length === 0 ? (
        <span className="muted">{t('preset.empty')}</span>
      ) : (
        <div className="preset-list">
          {presets.map((p) => (
            <PresetItem
              key={p.id}
              preset={p}
              onApply={() => handleApply(p.id)}
              onDelete={() => deletePreset(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
