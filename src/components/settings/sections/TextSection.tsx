import { useSettings } from '../../../store/settingsStore';
import { TextInput } from '../TextInput';
import { ModeToggle } from '../ModeToggle';
import { SpeedSlider } from '../SpeedSlider';
import { FontWeightSlider } from '../FontWeightSlider';
import { TextPresetManager } from '../presets/TextPresetManager';
import { ClearTextButton } from '../ClearTextButton';

export function TextSection() {
  const mode = useSettings((s) => s.mode);
  return (
    <>
      <TextInput />
      <ModeToggle />
      {mode === 'marquee' && <SpeedSlider />}
      <FontWeightSlider />
      <TextPresetManager />
      <ClearTextButton />
    </>
  );
}
