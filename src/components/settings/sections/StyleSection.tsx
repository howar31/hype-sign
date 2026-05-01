import { useSettings } from '../../../store/settingsStore';
import { useT } from '../../../lib/i18n';
import { ColorEditor } from '../color/ColorEditor';
import { PresetManager } from '../presets/PresetManager';
import { ResetButton } from '../ResetButton';

export function StyleSection() {
  const textColor = useSettings((s) => s.textColor);
  const bgColor = useSettings((s) => s.bgColor);
  const setTextColor = useSettings((s) => s.setTextColor);
  const setBgColor = useSettings((s) => s.setBgColor);
  const t = useT();

  return (
    <>
      <ColorEditor
        label={t('color.text')}
        value={textColor}
        onChange={setTextColor}
        defaultSolid="#ffffff"
      />
      <ColorEditor
        label={t('color.bg')}
        value={bgColor}
        onChange={setBgColor}
        defaultSolid="#000000"
      />
      <PresetManager />
      <ResetButton />
    </>
  );
}
