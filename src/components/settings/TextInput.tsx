import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';
import { ConfirmButton } from '../ui/ConfirmButton';

export function TextInput() {
  const text = useSettings((s) => s.text);
  const setText = useSettings((s) => s.setText);
  const t = useT();

  return (
    <div className="section">
      <div className="row-spread">
        <label className="section-label" htmlFor="hype-text">
          {t('text.label')}
        </label>
        {text.length > 0 && (
          <ConfirmButton
            confirmLabel="?"
            onConfirm={() => setText('')}
            className="icon"
            style={{ height: 28, width: 28, fontSize: 12 }}
            ariaLabel={t('text.clear')}
          >
            ✕
          </ConfirmButton>
        )}
      </div>
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
