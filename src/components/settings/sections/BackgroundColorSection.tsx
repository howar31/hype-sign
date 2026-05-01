import { useState } from 'react';
import { useSettings } from '../../../store/settingsStore';
import { useT } from '../../../lib/i18n';
import { ColorEditor } from '../color/ColorEditor';
import { SaveCurrentColor } from '../presets/SaveCurrentColor';
import { ColorPresetList } from '../presets/ColorPresetList';
import { ResetColorButton } from '../ResetColorButton';

export function BackgroundColorSection() {
  const bgColor = useSettings((s) => s.bgColor);
  const setBgColor = useSettings((s) => s.setBgColor);
  const resetBgColor = useSettings((s) => s.resetBgColor);
  const t = useT();

  // See TextColorSection: key bump remounts the editor and re-derives
  // all three type snapshots from the reset value.
  const [resetCounter, setResetCounter] = useState(0);

  function handleReset() {
    resetBgColor();
    setResetCounter((c) => c + 1);
  }

  return (
    <>
      <ColorEditor
        key={resetCounter}
        label={t('color.bg')}
        value={bgColor}
        onChange={setBgColor}
        defaultSolid="#000000"
      />
      <SaveCurrentColor color={bgColor} />
      <ColorPresetList applyTo="bg" />
      <ResetColorButton target="bg" onReset={handleReset} />
    </>
  );
}
