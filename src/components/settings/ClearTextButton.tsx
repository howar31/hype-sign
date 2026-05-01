import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';
import { ConfirmButton } from '../ui/ConfirmButton';

export function ClearTextButton() {
  const text = useSettings((s) => s.text);
  const setText = useSettings((s) => s.setText);
  const t = useT();

  return (
    <div className="section">
      <span className="section-label">{t('clear.label')}</span>
      <ConfirmButton
        confirmLabel={t('clear.confirm')}
        onConfirm={() => setText('')}
        disabled={text.length === 0}
      >
        {t('clear.button')}
      </ConfirmButton>
    </div>
  );
}
