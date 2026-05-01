import { useEffect, useState } from 'react';
import { useT } from '../../../lib/i18n';
import {
  makeId,
  type ColorStop,
  type ColorValue,
  type LinearGradient,
  type RadialGradient,
  type SolidColor,
} from '../../../types';
import { LinearEditor } from './LinearEditor';
import { RadialEditor } from './RadialEditor';
import { SolidPicker } from './SolidPicker';

type Props = {
  label: string;
  value: ColorValue;
  onChange: (value: ColorValue) => void;
  /** Used to derive a sensible solid color when no snapshot for that type yet. */
  defaultSolid?: string;
};

type Snapshots = {
  solid: SolidColor;
  linear: LinearGradient;
  radial: RadialGradient;
};

function makeDefaultStops(seed?: string): ColorStop[] {
  return [
    { id: makeId(), color: seed ?? '#ffffff', position: 0 },
    { id: makeId(), color: '#000000', position: 100 },
  ];
}

function deriveSnapshots(value: ColorValue, defaultSolid?: string): Snapshots {
  // Pick a sensible "primary color" for whichever side we don't have data for.
  const seed =
    value.type === 'solid'
      ? value.color
      : value.stops[0]?.color ?? defaultSolid ?? '#ffffff';

  const stopsFromValue: ColorStop[] | null =
    value.type === 'linear' || value.type === 'radial' ? value.stops : null;

  return {
    solid: value.type === 'solid' ? value : { type: 'solid', color: seed },
    linear:
      value.type === 'linear'
        ? value
        : { type: 'linear', angle: 90, stops: stopsFromValue ?? makeDefaultStops(seed) },
    radial:
      value.type === 'radial'
        ? value
        : { type: 'radial', cx: 50, cy: 50, stops: stopsFromValue ?? makeDefaultStops(seed) },
  };
}

export function ColorEditor({ label, value, onChange, defaultSolid }: Props) {
  const t = useT();

  // Per-type snapshot memory so switching tabs preserves each type's own
  // settings (linear keeps its angle, radial keeps cx/cy, both keep stops,
  // solid keeps its color) instead of resetting to derived defaults.
  const [snapshots, setSnapshots] = useState<Snapshots>(() =>
    deriveSnapshots(value, defaultSolid),
  );

  // Whenever the active value changes, refresh that type's snapshot so we
  // remember the latest user edits.
  useEffect(() => {
    setSnapshots((prev) => {
      if (prev[value.type] === value) return prev;
      return { ...prev, [value.type]: value };
    });
  }, [value]);

  function selectType(type: ColorValue['type']) {
    if (type === value.type) return;
    onChange(snapshots[type]);
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
