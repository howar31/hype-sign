import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';

export function TextInput() {
  const text = useSettings((s) => s.text);
  const setText = useSettings((s) => s.setText);
  const t = useT();

  return (
    <div className="section">
      <label className="section-label" htmlFor="hype-text">
        {t('text.label')}
      </label>
      <textarea
        id="hype-text"
        className="textarea"
        placeholder={t('text.placeholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  );
}
