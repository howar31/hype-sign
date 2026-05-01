import { colorToCss } from '../../../lib/colorToCss';
import { useT } from '../../../lib/i18n';
import type { Preset } from '../../../types';
import { ConfirmButton } from '../../ui/ConfirmButton';

type Props = {
  preset: Preset;
  onApply: () => void;
  onDelete: () => void;
};

export function PresetItem({ preset, onApply, onDelete }: Props) {
  const t = useT();
  return (
    <div className="preset-row">
      <div className="preset-name">
        <div className="preset-swatches" aria-hidden>
          <div style={{ background: colorToCss(preset.bgColor) }} />
          <div style={{ background: colorToCss(preset.textColor) }} />
        </div>
        <span className="preset-name-text">{preset.name}</span>
      </div>
      <button type="button" className="btn" style={{ height: 32, fontSize: 12 }} onClick={onApply}>
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
