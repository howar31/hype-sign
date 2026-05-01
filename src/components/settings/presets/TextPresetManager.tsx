import { useState } from 'react';
import { useSettings } from '../../../store/settingsStore';
import { useT } from '../../../lib/i18n';
import { TextPresetItem } from './TextPresetItem';

export function TextPresetManager() {
  const text = useSettings((s) => s.text);
  const textPresets = useSettings((s) => s.textPresets);
  const saveTextPreset = useSettings((s) => s.saveTextPreset);
  const applyTextPreset = useSettings((s) => s.applyTextPreset);
  const deleteTextPreset = useSettings((s) => s.deleteTextPreset);
  const t = useT();

  const [name, setName] = useState('');

  function onSave() {
    if (!text.trim()) return;
    saveTextPreset(name);
    setName('');
  }

  return (
    <div className="section">
      <span className="section-label">{t('textPreset.section')}</span>

      <div className="row">
        <input
          type="text"
          className="input"
          style={{ flex: 1, minWidth: 0 }}
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
        <button
          type="button"
          className="btn primary"
          onClick={onSave}
          disabled={!text.trim()}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {t('preset.save')}
        </button>
      </div>

      {textPresets.length === 0 ? (
        <span className="muted">{t('preset.empty')}</span>
      ) : (
        <div className="preset-list">
          {textPresets.map((p) => (
            <TextPresetItem
              key={p.id}
              preset={p}
              onApply={() => applyTextPreset(p.id)}
              onDelete={() => deleteTextPreset(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
