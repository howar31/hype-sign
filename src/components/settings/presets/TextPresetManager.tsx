import { useEffect, useState } from 'react';
import { useSettings } from '../../../store/settingsStore';
import { useT } from '../../../lib/i18n';
import { TextPresetItem } from './TextPresetItem';

export function TextPresetManager() {
  const text = useSettings((s) => s.text);
  const textPresets = useSettings((s) => s.textPresets);
  const saveTextPreset = useSettings((s) => s.saveTextPreset);
  const applyTextPreset = useSettings((s) => s.applyTextPreset);
  const deleteTextPreset = useSettings((s) => s.deleteTextPreset);
  const reorderTextPresets = useSettings((s) => s.reorderTextPresets);
  const t = useT();

  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (textPresets.length === 0) setIsEditing(false);
  }, [textPresets.length]);

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

      <div className="preset-section-header">
        <span className="section-label">{t('textPreset.list')}</span>
        {textPresets.length > 0 && (
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

      {textPresets.length === 0 ? (
        <span className="muted">{t('preset.empty')}</span>
      ) : (
        <div className="preset-list">
          {textPresets.map((p, i) => (
            <TextPresetItem
              key={p.id}
              preset={p}
              onApply={() => applyTextPreset(p.id)}
              onDelete={() => deleteTextPreset(p.id)}
              isEditing={isEditing}
              isFirst={i === 0}
              isLast={i === textPresets.length - 1}
              onMoveUp={() => reorderTextPresets(p.id, 'up')}
              onMoveDown={() => reorderTextPresets(p.id, 'down')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
