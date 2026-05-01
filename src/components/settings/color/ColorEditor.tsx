import { useT } from '../../../lib/i18n';
import { makeId, type ColorStop, type ColorValue } from '../../../types';
import { LinearEditor } from './LinearEditor';
import { RadialEditor } from './RadialEditor';
import { SolidPicker } from './SolidPicker';

type Props = {
  label: string;
  value: ColorValue;
  onChange: (value: ColorValue) => void;
  /** Used to derive a sensible solid color when entering "solid" tab from a gradient. */
  defaultSolid?: string;
};

function makeDefaultStops(seed?: string): ColorStop[] {
  return [
    { id: makeId(), color: seed ?? '#ffffff', position: 0 },
    { id: makeId(), color: '#000000', position: 100 },
  ];
}

export function ColorEditor({ label, value, onChange, defaultSolid }: Props) {
  const t = useT();

  function selectType(type: ColorValue['type']) {
    if (type === value.type) return;

    if (type === 'solid') {
      const seed =
        value.type === 'solid' ? value.color : value.stops[0]?.color ?? defaultSolid ?? '#ffffff';
      onChange({ type: 'solid', color: seed });
      return;
    }

    if (type === 'linear') {
      const stops =
        value.type === 'linear'
          ? value.stops
          : value.type === 'radial'
            ? value.stops
            : makeDefaultStops(value.color);
      onChange({ type: 'linear', angle: 90, stops });
      return;
    }

    // radial
    const stops =
      value.type === 'radial'
        ? value.stops
        : value.type === 'linear'
          ? value.stops
          : makeDefaultStops(value.color);
    onChange({ type: 'radial', cx: 50, cy: 50, stops });
  }

  return (
    <div className="section" style={{ gap: 10 }}>
      <span className="section-label">{label}</span>
      <div className="tab-row">
        <button
          type="button"
          className={`tab${value.type === 'solid' ? ' active' : ''}`}
          onClick={() => selectType('solid')}
        >
          {t('color.solid')}
        </button>
        <button
          type="button"
          className={`tab${value.type === 'linear' ? ' active' : ''}`}
          onClick={() => selectType('linear')}
        >
          {t('color.linear')}
        </button>
        <button
          type="button"
          className={`tab${value.type === 'radial' ? ' active' : ''}`}
          onClick={() => selectType('radial')}
        >
          {t('color.radial')}
        </button>
      </div>

      {value.type === 'solid' && <SolidPicker value={value} onChange={onChange} />}
      {value.type === 'linear' && <LinearEditor value={value} onChange={onChange} />}
      {value.type === 'radial' && <RadialEditor value={value} onChange={onChange} />}
    </div>
  );
}
