import { useState } from 'react';
import { useSettings } from '../../../store/settingsStore';
import { useT } from '../../../lib/i18n';
import type { ColorValue } from '../../../types';

type Props = {
  /** The current color value to snapshot when the user clicks save. */
  color: ColorValue;
};

/**
 * Save form for capturing the active color editor's value as a new color
 * preset. One of these lives at the bottom of the Tint and Backdrop tabs;
 * both write to the same shared `presets` list.
 */
export function SaveCurrentColor({ color }: Props) {
  const savePreset = useSettings((s) => s.savePreset);
  const t = useT();
  const [name, setName] = useState('');

  function onSave() {
    savePreset(name, color);
    setName('');
  }

  return (
    <div className="section">
      <span className="section-label">{t('preset.saveCurrent')}</span>
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
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {t('preset.save')}
        </button>
      </div>
    </div>
  );
}
