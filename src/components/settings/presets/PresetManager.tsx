import { useState } from 'react';
import { useSettings } from '../../../store/settingsStore';
import { useT } from '../../../lib/i18n';
import { PresetItem } from './PresetItem';

export function PresetManager() {
  const presets = useSettings((s) => s.presets);
  const savePreset = useSettings((s) => s.savePreset);
  const applyPreset = useSettings((s) => s.applyPreset);
  const deletePreset = useSettings((s) => s.deletePreset);
  const t = useT();

  const [name, setName] = useState('');

  function onSave() {
    savePreset(name);
    setName('');
  }

  return (
    <div className="section">
      <span className="section-label">{t('preset.section')}</span>

      <div className="row">
        <input
          type="text"
          className="input"
          placeholder={t('preset.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSave();
            }
          }}
        />
        <button type="button" className="btn primary" onClick={onSave}>
          {t('preset.save')}
        </button>
      </div>

      {presets.length === 0 ? (
        <span className="muted">{t('preset.empty')}</span>
      ) : (
        <div className="preset-list">
          {presets.map((p) => (
            <PresetItem
              key={p.id}
              preset={p}
              onApply={() => applyPreset(p.id)}
              onDelete={() => deletePreset(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
