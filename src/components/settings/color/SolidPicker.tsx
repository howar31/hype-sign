import type { SolidColor } from '../../../types';

type Props = {
  value: SolidColor;
  onChange: (value: SolidColor) => void;
};

export function SolidPicker({ value, onChange }: Props) {
  return (
    <div className="row">
      <label className="swatch" style={{ background: value.color }}>
        <input
          type="color"
          value={value.color}
          onChange={(e) => onChange({ type: 'solid', color: e.target.value })}
        />
      </label>
      <input
        type="text"
        className="input"
        value={value.color.toUpperCase()}
        onChange={(e) => {
          const v = e.target.value.trim();
          if (/^#[0-9a-fA-F]{6}$/.test(v)) {
            onChange({ type: 'solid', color: v });
          }
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
}
