import { useSettings } from '../../store/settingsStore';
import { useT } from '../../lib/i18n';
import { ConfirmButton } from '../ui/ConfirmButton';

export function ResetButton() {
  const reset = useSettings((s) => s.resetColors);
  const t = useT();

  return (
    <div className="section">
      <span className="section-label">{t('reset.label')}</span>
      <ConfirmButton confirmLabel={t('reset.confirm')} onConfirm={reset}>
        {t('reset.button')}
      </ConfirmButton>
    </div>
  );
}
