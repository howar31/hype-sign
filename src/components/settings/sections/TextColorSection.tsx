import { useState } from 'react';
import { useSettings } from '../../../store/settingsStore';
import { useT } from '../../../lib/i18n';
import { ColorEditor } from '../color/ColorEditor';
import { SaveCurrentColor } from '../presets/SaveCurrentColor';
import { ColorPresetList } from '../presets/ColorPresetList';
import { ResetColorButton } from '../ResetColorButton';

export function TextColorSection() {
  const textColor = useSettings((s) => s.textColor);
  const setTextColor = useSettings((s) => s.setTextColor);
  const resetTextColor = useSettings((s) => s.resetTextColor);
  const t = useT();

  // Bumping this remounts the ColorEditor so its solid/linear/radial
  // snapshots all re-derive from the freshly-reset value, wiping any
  // previous custom angle / cx-cy / stops / solid color the user had
  // set inside this section.
  const [resetCounter, setResetCounter] = useState(0);

  function handleReset() {
    resetTextColor();
    setResetCounter((c) => c + 1);
  }

  return (
    <>
      <ColorEditor
        key={resetCounter}
        label={t('color.text')}
        value={textColor}
        onChange={setTextColor}
        defaultSolid="#ffffff"
      />
      <SaveCurrentColor color={textColor} />
      <ColorPresetList applyTo="text" />
      <ResetColorButton target="tint" onReset={handleReset} />
    </>
  );
}
