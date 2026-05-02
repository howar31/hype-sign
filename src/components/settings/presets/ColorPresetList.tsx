import { useEffect, useState } from 'react';
import { useSettings } from '../../../store/settingsStore';
import { useT } from '../../../lib/i18n';
import { PresetItem } from './PresetItem';

type Props = {
  applyTo: 'text' | 'bg';
};

export function ColorPresetList({ applyTo }: Props) {
  const presets = useSettings((s) => s.presets);
  const applyToText = useSettings((s) => s.applyPresetToText);
  const applyToBg = useSettings((s) => s.applyPresetToBg);
  const deletePreset = useSettings((s) => s.deletePreset);
  const reorderPresets = useSettings((s) => s.reorderPresets);
  const t = useT();

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (presets.length === 0) setIsEditing(false);
  }, [presets.length]);

  const handleApply = applyTo === 'text' ? applyToText : applyToBg;

  return (
    <div className="section">
      <div className="preset-section-header">
        <span className="section-label">{t('colorPreset.list')}</span>
        {presets.length > 0 && (
          <button
            type="button"
            className="btn"
            style={{ height: 28, fontSize: 12, padding: '0 10px' }}
            onClick={() => setIsEditing((v) => !v)}
          >
            {isEditing ? t('preset.done') : t('preset.edit')}
          </button>
        )}
      </div>
      {presets.length === 0 ? (
        <span className="muted">{t('preset.empty')}</span>
      ) : (
        <div className="preset-list">
          {presets.map((p, i) => (
            <PresetItem
              key={p.id}
              preset={p}
              onApply={() => handleApply(p.id)}
              onDelete={() => deletePreset(p.id)}
              isEditing={isEditing}
              isFirst={i === 0}
              isLast={i === presets.length - 1}
              onMoveUp={() => reorderPresets(p.id, 'up')}
              onMoveDown={() => reorderPresets(p.id, 'down')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
