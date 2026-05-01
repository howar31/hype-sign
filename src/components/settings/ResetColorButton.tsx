import { useT } from '../../lib/i18n';
import { ConfirmButton } from '../ui/ConfirmButton';

type Props = {
  /** 'tint' resets text color, 'bg' resets background. */
  target: 'tint' | 'bg';
  onReset: () => void;
};

/**
 * Per-color reset button. Resetting Tint does not touch Backdrop, and
 * vice versa. The parent (TextColorSection / BackgroundColorSection)
 * handles the snapshot remount via a key bump alongside the store reset.
 */
export function ResetColorButton({ target, onReset }: Props) {
  const t = useT();
  const labelKey = target === 'tint' ? 'reset.tint.label' : 'reset.bg.label';
  const buttonKey = target === 'tint' ? 'reset.tint.button' : 'reset.bg.button';

  return (
    <div className="section">
      <span className="section-label">{t(labelKey)}</span>
      <ConfirmButton confirmLabel={t('reset.confirm')} onConfirm={onReset}>
        {t(buttonKey)}
      </ConfirmButton>
    </div>
  );
}
