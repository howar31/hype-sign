import { colorToCss } from '../../../lib/colorToCss';
import { useT } from '../../../lib/i18n';
import type { Preset } from '../../../types';
import { ConfirmButton } from '../../ui/ConfirmButton';
import { ColorTypeIcon } from './ColorTypeIcon';

type Props = {
  preset: Preset;
  onApply: () => void;
  onDelete: () => void;
  isEditing?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export function PresetItem({ preset, onApply, onDelete, isEditing, isFirst, isLast, onMoveUp, onMoveDown }: Props) {
  const t = useT();
  const typeLabel = t(`color.type.${preset.color.type}`);

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
        <div className="preset-swatches" aria-hidden>
          <div style={{ background: colorToCss(preset.color) }} />
        </div>
        <ColorTypeIcon type={preset.color.type} label={typeLabel} />
        <span className="preset-name-text">{preset.name}</span>
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
