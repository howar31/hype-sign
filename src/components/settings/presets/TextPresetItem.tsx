import { useT } from '../../../lib/i18n';
import type { TextPreset } from '../../../types';
import { ConfirmButton } from '../../ui/ConfirmButton';

type Props = {
  preset: TextPreset;
  onApply: () => void;
  onDelete: () => void;
};

export function TextPresetItem({ preset, onApply, onDelete }: Props) {
  const t = useT();
  const firstLine = preset.text.split('\n').find((l) => l.trim() !== '') ?? '';
  const display = preset.name || firstLine.slice(0, 24) || '—';

  return (
    <div className="preset-row">
      <div className="preset-name">
        <span className="preset-name-text" title={preset.text}>
          {display}
        </span>
      </div>
      <button
        type="button"
        className="btn"
        style={{ height: 32, fontSize: 12 }}
        onClick={onApply}
      >
        {t('preset.apply')}
      </button>
      <ConfirmButton
        confirmLabel="?"
        onConfirm={onDelete}
        className="icon"
        style={{ height: 32, width: 32 }}
        ariaLabel={t('preset.delete')}
      >
        ✕
      </ConfirmButton>
    </div>
  );
}
