import { useT } from '../../../lib/i18n';
import type { TextPreset } from '../../../types';
import { ConfirmButton } from '../../ui/ConfirmButton';

type Props = {
  preset: TextPreset;
  onApply: () => void;
  onDelete: () => void;
  isEditing?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export function TextPresetItem({ preset, onApply, onDelete, isEditing, isFirst, isLast, onMoveUp, onMoveDown }: Props) {
  const t = useT();
  const firstLine = preset.text.split('\n').find((l) => l.trim() !== '') ?? '';
  const display = preset.name || firstLine.slice(0, 24) || '—';

  return (
    <div className={`preset-row${isEditing ? ' preset-row--editing' : ''}`}>
      {isEditing && (
        <>
          <button
            type="button"
            className="btn icon"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label={t('preset.moveUp')}
            style={{ height: 32, width: 32 }}
          >
            ▲
          </button>
          <button
            type="button"
            className="btn icon"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label={t('preset.moveDown')}
            style={{ height: 32, width: 32 }}
          >
            ▼
          </button>
        </>
      )}
      <div className="preset-name">
        <span className="preset-name-text" title={preset.text}>
          {display}
        </span>
      </div>
      {isEditing ? (
        <>
          <ConfirmButton
            confirmLabel="?"
            onConfirm={onDelete}
            className="icon"
            style={{ height: 32, width: 32 }}
            ariaLabel={t('preset.delete')}
          >
            ✕
          </ConfirmButton>
        </>
      ) : (
        <ConfirmButton
          variant="neutral"
          confirmLabel={t('preset.applyConfirm')}
          onConfirm={onApply}
          style={{ height: 32, fontSize: 12, padding: '0 12px' }}
        >
          {t('preset.apply')}
        </ConfirmButton>
      )}
    </div>
  );
}
